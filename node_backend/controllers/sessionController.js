const Session = require('../models/Session');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

const ANALYSIS_INTERVAL_SECONDS = 5;

// @desc    Start a new session
// @route   POST /api/sessions/start
// @access  Private
exports.startSession = async (req, res) => {
    try {
        const userId = req.user.id;

        // This self-healing logic prevents bugs from stale sessions.
        const terminatedSession = await Session.findOneAndUpdate(
            { userId: userId, endTime: null },
            { $set: { endTime: new Date() } }
        );

        if (terminatedSession) {
            console.warn(`[startSession] Found and automatically terminated a stale session: ${terminatedSession._id}`);
        }

        const newSession = new Session({
            userId,
            startTime: new Date(),
        });

        await newSession.save();
        console.log(`[startSession] CREATED a fresh session with ID: ${newSession._id}`);

        // Return the full session object to the frontend.
        res.status(201).json({ message: 'Session started successfully', session: newSession });

    } catch (error) {
        console.error("Error in startSession:", error);
        res.status(500).json({ message: 'Server error while starting session' });
    }
};

// @desc    Receive and process data from the local Python engine
// @route   POST /api/sessions/data/:sessionId
// @access  Private
exports.processSessionData = async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id; // Assuming your 'protect' middleware adds the user to req

    const { focus, appName, activity } = req.body;

    // Basic validation for the incoming payload
    if (typeof focus !== 'boolean' || !appName || typeof activity === 'undefined') {
        return res.status(400).json({ message: 'Invalid analysis data payload.' });
    }

    try {
        // Find the active session for the user
        const session = await Session.findOne({
             _id: new mongoose.Types.ObjectId(sessionId),
             userId: new mongoose.Types.ObjectId(userId),
             endTime: null // Ensure we're only updating an active session
        });

        if (!session) {
            // This is an important message for the local engine if it keeps sending data after a session has stopped
            return res.status(404).json({ message: 'Active session not found. Please stop monitoring.' });
        }
        
        // Find the corresponding user to update their lifetime stats
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User associated with session not found.' });
        }
        
        // --- Data Processing and Updates ---
        
        const timeIncrement = ANALYSIS_INTERVAL_SECONDS;
        // Sanitize the appName to be a valid key for the Mongoose Map
        const sanitizedAppName = appName.replace(/\./g, '_').replace(/^\$/, '_$');

        // Update focus/distraction times
        if (focus) {
            session.focusTime += timeIncrement;
            user.totalFocusTime += timeIncrement;
        } else {
            session.distractionTime += timeIncrement;
            user.totalDistractionTime += timeIncrement;
        }
        
        // Update app usage stats for both the session and the user's lifetime
        session.appUsage.set(sanitizedAppName, (session.appUsage.get(sanitizedAppName) || 0) + timeIncrement);
        user.appUsage.set(sanitizedAppName, (user.appUsage.get(sanitizedAppName) || 0) + timeIncrement);
        
        // Update the 'latestActivity' object for the live feed feature
        session.latestActivity = {
            service: appName, // Use the original appName for display purposes
            productivity: focus ? "Productive" : "Unproductive",
            reason: activity,
            timestamp: new Date(),
        };

        // --- Mongoose Change Tracking ---
        
        // Explicitly tell Mongoose that these nested/Map fields have been modified.
        // This is crucial for ensuring the changes are saved to the database.
        session.markModified('appUsage');
        user.markModified('appUsage');
        session.markModified('latestActivity'); // <-- THE CRITICAL FIX
        
        // --- Database Save Operation ---
        
        // Save both documents concurrently for better performance
        await Promise.all([session.save(), user.save()]);
        
        // Log to the console for successful debugging
        console.log(`[Session ${sessionId}] DB Updated via Python: focus=${focus}, app=${sanitizedAppName}`);
        
        // Send a success response
        res.status(200).json({ message: 'Data point processed successfully.' });

    } catch (error) {
        console.error(`Error processing local data for session ${sessionId}:`, error);
        res.status(500).json({ message: 'Internal server error while processing data.' });
    }
};

// @desc    Stop the current session
// @route   POST /api/sessions/:id/stop
// @access  Private
exports.stopSession = async (req, res) => {
    const { id: sessionId } = req.params;
    const userId = req.user.id;
    try {
        const session = await Session.findOneAndUpdate(
            { _id: sessionId, userId, endTime: null },
            { $set: { endTime: new Date() } },
            { new: true }
        );
        if (!session) {
            return res.status(404).json({ message: 'Active session not found or already stopped' });
        }
        res.status(200).json({ message: 'Session stopped successfully', session });
    } catch (error) {
        console.error("Error stopping session:", error);
        res.status(500).json({ message: 'Server error stopping session' });
    }
};

// @desc    Get aggregated daily app usage stats for the user
// @route   GET /api/sessions/daily/apps
// @access  Private
exports.getDailyAppUsage = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const numberOfDays = parseInt(req.query.days, 10) || 7;
    if (numberOfDays <= 0 || numberOfDays > 90) {
        return res.status(400).json({ message: 'Invalid number of days requested.' });
    }
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (numberOfDays - 1));
    try {
        const appUsagePipeline = [
            { $match: { userId: userId, startTime: { $gte: startDate } } },
            { $project: { _id: 0, appUsageArray: { $objectToArray: "$appUsage" } } },
            { $unwind: "$appUsageArray" },
            { $group: { _id: "$appUsageArray.k", totalTime: { $sum: "$appUsageArray.v" } } },
            { $project: { _id: 0, appName: "$_id", totalTime: 1 } },
            { $sort: { totalTime: -1 } }
        ];
        const dailyAppStats = await Session.aggregate(appUsagePipeline);
        res.status(200).json(dailyAppStats);
    } catch (error) {
        console.error("Error fetching daily app usage statistics:", error);
        res.status(500).json({ message: 'Server error fetching daily app usage data' });
    }
});

// @desc    Get aggregated daily focus stats for the user
// @route   GET /api/sessions/daily
// @access  Private
exports.getDailyAnalysis = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const numberOfDays = parseInt(req.query.days, 10) || 7;
    if (numberOfDays <= 0 || numberOfDays > 90) {
        return res.status(400).json({ message: 'Invalid number of days requested.' });
    }
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (numberOfDays - 1));
    try {
        const dailyStats = await Session.aggregate([
            { $match: { userId: userId, startTime: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime", timezone: "UTC" } },
                    totalFocusTime: { $sum: "$focusTime" },
                    totalDistractionTime: { $sum: "$distractionTime" },
                    sessionCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0, date: "$_id", focusTime: "$totalFocusTime", distractionTime: "$totalDistractionTime", sessionCount: "$sessionCount",
                    focusPercentage: {
                       $cond: {
                            if: { $gt: [{ $add: ["$totalFocusTime", "$totalDistractionTime"] }, 0] },
                            then: { $round: [{ $multiply: [{ $divide: ["$totalFocusTime", { $add: ["$totalFocusTime", "$totalDistractionTime"] }] }, 100] }, 0 ] },
                            else: 0
                       }
                    }
                }
            },
            { $sort: { date: 1 } }
        ]);
        const filledStats = fillMissingDates(startDate, numberOfDays, dailyStats);
        res.status(200).json(filledStats);
    } catch (error) {
        console.error("Error fetching daily analysis:", error);
        res.status(500).json({ message: 'Server error fetching daily analysis' });
    }
});

function fillMissingDates(startDate, numberOfDays, stats) {
    const resultsMap = new Map(stats.map(s => [s.date, s]));
    const filled = [];
    const currentDate = new Date(startDate);
    for (let i = 0; i < numberOfDays; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (resultsMap.has(dateStr)) {
            filled.push(resultsMap.get(dateStr));
        } else {
            filled.push({ date: dateStr, focusTime: 0, distractionTime: 0, sessionCount: 0, focusPercentage: 0 });
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return filled;
}

// @desc    Get current active session for logged-in user
// @route   GET /api/sessions/current
// @access  Private
exports.getCurrentSession = asyncHandler(async (req, res) => {
    const session = await Session.findOne({ userId: req.user.id, endTime: null });
    if (!session) {
        return res.status(404).json({ message: 'No active session found' });
    }
    res.status(200).json(session);
});

// @desc    Get a specific session by its ID
// @route   GET /api/sessions/:id
// @access  Private
exports.getSessionById = asyncHandler(async (req, res) => {
    const { id: sessionId } = req.params;
    const userId = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({ message: 'Invalid session ID format' });
    }
    const session = await Session.findOne({ _id: sessionId, userId: userId });
    if (!session) {
        return res.status(404).json({ message: 'Session not found or access denied' });
    }
    res.status(200).json(session);
});

// @desc    Get all sessions for the logged-in user
// @route   GET /api/sessions/history
// @access  Private
exports.getSessionHistory = asyncHandler(async (req, res) => {
    const sessions = await Session.find({ userId: req.user.id }).sort({ startTime: -1 });
    res.status(200).json(sessions);
});

// @desc    Get overall user stats
// @route   GET /api/sessions/stats
// @access  Private
exports.getUserStats = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('totalFocusTime totalDistractionTime appUsage');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    const appUsageObject = Object.fromEntries(user.appUsage);
    res.status(200).json({
        totalFocusTime: user.totalFocusTime,
        totalDistractionTime: user.totalDistractionTime,
        appUsage: appUsageObject,
    });
});

exports.activateSession = asyncHandler(async (req, res) => {
    const { id: sessionId } = req.params;
    const userId = req.user.id;

    try {
        const updatedSession = await Session.findOneAndUpdate(
            { _id: sessionId, userId: userId, endTime: null },
            // Set the official startTime to the moment this request is received.
            { $set: { startTime: new Date() } },
            // Return the new, updated document.
            { new: true }
        );

        if (!updatedSession) {
            return res.status(404).json({ message: 'Session to activate not found or already ended.' });
        }

        console.log(`[activateSession] Session ${sessionId} is now active with the correct start time.`);
        res.status(200).json({ message: 'Session activated successfully', session: updatedSession });

    } catch (error) {
        console.error(`Error activating session ${sessionId}:`, error);
        res.status(500).json({ message: 'Server error activating session' });
    }
});

exports.getLiveStatus = asyncHandler(async (req, res) => {
    const session = await Session.findOne({ userId: req.user.id, endTime: null });
    if (!session) {
        return res.status(404).json({ message: 'No active session found' });
    }

    // THIS IS THE CRITICAL FIX that your running code is missing.
    // It gracefully handles the brief "initializing" state before the first data packet arrives.
    if (session.latestActivity && session.latestActivity.service && session.latestActivity.service !== "Initializing...") {
        return res.status(200).json(session.latestActivity);
    } else {
        // This ensures a 200 OK is always sent, preventing the 400 error.
        return res.status(200).json({
            service: "Initializing...",
            productivity: "Analyzing...",
            reason: "Waiting for first data point...",
            timestamp: new Date(),
        });
    }
});

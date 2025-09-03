const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Import your Mongoose models
const Session = require('../models/Session');
const ChatHistory = require('../models/ChatHistory');
const User = require('../models/User'); // Keep for potential future use

// --- Configuration ---
// Make sure you have GEMINI_API_KEY in your .env file
if (!process.env.GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not defined in the project's .env file.");
    process.exit(1); // Exit if the key is missing to prevent runtime errors
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});


// --- RAG Helper 1: Formatting Functions ---
const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '0s';
    const totalSeconds = Math.round(seconds);
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    if (remainingSeconds === 0) return `${minutes}m`;
    return `${minutes}m ${remainingSeconds}s`;
};

const getTopApp = (appUsage) => {
    // Mongoose Maps can be tricky, so we safely handle them
    if (!appUsage || !(appUsage instanceof Map) || appUsage.size === 0) return "N/A";
    let topApp = "N/A";
    let maxTime = 0;
    try {
        for (const [appName, time] of appUsage.entries()) {
            if (time > maxTime) {
                maxTime = time;
                topApp = appName.replace(/_/g, '.'); // Un-sanitize for display
            }
        }
        if (maxTime > 0) {
            return `${topApp} (${formatDuration(maxTime)})`;
        }
    } catch (e) {
        console.error("Error processing appUsage Map:", e);
        return "Error";
    }
    return "N/A";
};


// --- RAG Helper 2: The Data Fetcher and Context Formatter ---
const getRAGContext = async (userId) => {
    try {
        // Fetch the last 5 completed sessions and the current active session concurrently
        const [lastSessions, currentSession] = await Promise.all([
            Session.find({ userId: userId, endTime: { $ne: null } })
                .sort({ endTime: -1 })
                .limit(5)
                .lean(), // .lean() makes queries faster as it returns plain JS objects
            Session.findOne({ userId: userId, endTime: null }).lean()
        ]);

        let context = "--- USER'S RECENT PRODUCTIVITY DATA ---\n\n";

        if (currentSession) {
            const duration = (new Date() - new Date(currentSession.startTime)) / 1000;
            context += "Current Active Session:\n";
            context += `- Intent: ${currentSession.intent || 'Not set'}\n`;
            context += `- Duration so far: ${formatDuration(duration)}\n`;
            context += `- Focus Time so far: ${formatDuration(currentSession.focusTime)}\n`;
            context += `---\n`;
        } else {
            context += "Current Active Session: None\n---\n";
        }

        if (lastSessions.length > 0) {
            context += "Last 5 Completed Sessions (newest first):\n";
            lastSessions.forEach((s, index) => {
                const duration = (new Date(s.endTime) - new Date(s.startTime)) / 1000;
                const totalTime = (s.focusTime || 0) + (s.distractionTime || 0);
                const focusPercent = totalTime > 0 ? Math.round(((s.focusTime || 0) / totalTime) * 100) : 0;
                context += `Session #${index + 1} (Ended ${new Date(s.endTime).toLocaleDateString()}):\n`;
                context += `  - Intent: ${s.intent || 'Not set'}\n`;
                context += `  - Duration: ${formatDuration(duration)}\n`;
                context += `  - Focus: ${focusPercent}%\n`;
                context += `  - Top App: ${getTopApp(s.appUsage)}\n`;
            });
        } else {
            context += "Last Completed Sessions: None\n";
        }
        context += "\n--- END OF DATA ---";
        return context;
    } catch (error) {
        console.error("Error fetching RAG context:", error);
        return "--- ERROR: Could not retrieve user's productivity data. ---";
    }
};


// --- The System Prompt for Gemini ---
const systemPrompt = `You are Focus Guardian, a supportive and data-driven productivity coach. Your primary role is to answer the user's questions based on the productivity data provided to you in the context.

RULES:
- BE CONCISE. Keep answers to 2-3 sentences unless the user asks for more detail.
- DATA FIRST: Always base your answers on the provided "USER'S RECENT PRODUCTIVITY DATA". Do not make up information or apologize if data is missing.
- TONE: Be encouraging but objective. If focus was low, state it factually (e.g., "This session had a focus of 35%") and suggest reflection.
- "LAST SESSION": If the user asks about their "last session" or "previous session", use the data from "Session #1" in the context.
- "HOW AM I DOING?": If the user asks for a summary, briefly mention the current session (if active) and the trend from the last few completed sessions.
- GENERAL KNOWLEDGE: If the user's question is not about their data (e.g., "give me a productivity tip"), you can answer from your general knowledge.
`;


// @desc    Handle a chat message from the user
// @route   POST /api/chat/converse
// @access  Private
exports.handleChatMessage = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ message: "Message content is required." });
    }

    // 1. Fetch RAG context and user's chat history
    const [ragContext, chatHistoryDoc] = await Promise.all([
        getRAGContext(userId),
        ChatHistory.findOne({ userId })
    ]);
    
    const chatHistory = chatHistoryDoc || new ChatHistory({ userId, messages: [] });

    // 2. Prepare the full history for the Gemini API call
    const geminiHistory = [
        // Start with the system prompt to set the context
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I am Focus Guardian, ready to help the user by analyzing their productivity data." }] },
    ];
    // Add the last 5 turns (10 messages) from the database to maintain conversation flow
    chatHistory.messages.slice(-10).forEach(msg => {
        geminiHistory.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        });
    });
    // Add the fresh RAG context right before the user's latest message
    geminiHistory.push({
        role: "user",
        parts: [{ text: `Here is the latest data for your analysis:\n${ragContext}` }]
    }, {
        role: "model",
        parts: [{ text: "Thank you for the data. I'm ready for the user's question." }]
    });

    // 3. Start the chat with the history and send the new message
    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message);
    const botReply = result.response.text();

    // 4. Save the new turn to our database and send the response to the frontend
    chatHistory.messages.push({ role: 'user', content: message, timestamp: new Date() });
    chatHistory.messages.push({ role: 'assistant', content: botReply, timestamp: new Date() });
    await chatHistory.save();

    res.status(200).json({ reply: botReply });
});


// @desc    Get the user's chat history
// @route   GET /api/chat/history
// @access  Private
exports.getChatHistory = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const chatHistory = await ChatHistory.findOne({ userId }).lean();
    
    // Always return a valid structure, even for new users
    res.status(200).json({ messages: chatHistory ? chatHistory.messages : [] });
});
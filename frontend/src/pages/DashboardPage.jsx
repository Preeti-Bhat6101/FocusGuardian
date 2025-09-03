import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './dashboard.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

// Helper to create an authorized Axios instance on-demand
const createAuthAxiosInstance = () => {
  const instance = axios.create();
  const token = localStorage.getItem('focusGuardianToken');
  if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  return instance;
};

export default function DashboardPage() {
  const navigate = useNavigate();

  // --- State Management ---
  const [user, setUser] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isEngineInitializing, setIsEngineInitializing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [liveStatus, setLiveStatus] = useState(null);

  // --- Refs for managing intervals and session data ---
  const elapsedTimerIntervalRef = useRef(null);
  const sessionPlaceholderRef = useRef(null);
  const liveStatusIntervalRef = useRef(null);

  // --- Core Action Callbacks ---
  const handleLogout = useCallback(() => {
    if (window.electronAPI) { window.electronAPI.stopLocalEngine(); }
    clearInterval(elapsedTimerIntervalRef.current);
    clearInterval(liveStatusIntervalRef.current);
    localStorage.removeItem('focusGuardianToken');
    localStorage.removeItem('focusGuardianUser');
    setActiveSession(null);
    setElapsedTime(0);
    setUser(null);
    setError(null);
    setIsTrackingActive(false);
    navigate('/login');
  }, [navigate]);

  const handleStartSession = useCallback(async () => {
    if (isStarting || activeSession) return;
    setError(null);
    setIsStarting(true);
    setIsEngineInitializing(true);
    setLoadingAction(true);
    setIsTrackingActive(false);

    try {
      const authAxios = createAuthAxiosInstance();
      const res = await authAxios.post(`${API_URL}/api/sessions/start`);
      
      const placeholderSession = res.data.session;
      if (!placeholderSession?._id) throw new Error("No session placeholder returned");
      
      sessionPlaceholderRef.current = placeholderSession;
      
      const token = localStorage.getItem('focusGuardianToken');
      if (window.electronAPI) {
        window.electronAPI.startLocalEngine(placeholderSession._id, token);
      } else {
        throw new Error("Desktop application environment not found.");
      }
    } catch (err) {
      if (err.response?.status === 401) { return handleLogout(); }
      setError(`Start Failed: ${err.response?.data?.message || err.message}`);
      setIsEngineInitializing(false);
      setLoadingAction(false);
    } finally {
      setIsStarting(false);
    }
  }, [activeSession, isStarting, handleLogout]);

  const handleStopSession = useCallback(async () => {
    const sessionId = activeSession?._id;
    if (!sessionId) return;

    setError(null);
    setLoadingAction(true);
    if (window.electronAPI) { window.electronAPI.stopLocalEngine(); }
    setIsTrackingActive(false);
    clearInterval(elapsedTimerIntervalRef.current);
    clearInterval(liveStatusIntervalRef.current);
    setLiveStatus(null); 

    try {
      const authAxios = createAuthAxiosInstance();
      await authAxios.post(`${API_URL}/api/sessions/${sessionId}/stop`);
      setActiveSession(null);
      setElapsedTime(0);
    } catch (err) {
      if (err.response?.status === 401) { return handleLogout(); }
      setError(`Failed to notify backend: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoadingAction(false);
    }
  }, [activeSession, handleLogout]);

  // --- useEffect Hooks for Data Loading and State Synchronization ---

  // Initial data load for the dashboard
  useEffect(() => {
    let mounted = true;
    const loadDashboard = async () => {
        setLoadingInitial(true);
        const authAxios = createAuthAxiosInstance();
        const token = localStorage.getItem('focusGuardianToken');
        if (!token) { if (mounted) handleLogout(); return; }

        try {
            const userRes = await authAxios.get(`${API_URL}/api/users/profile`);
            if (!mounted) return;
            setUser(userRes.data);
            
            const sessionRes = await authAxios.get(`${API_URL}/api/sessions/current`).catch(() => null);
            
            if (mounted && sessionRes?.data) {
                setError("An unterminated session was found. Please stop it before starting a new one.");
                setActiveSession(sessionRes.data);
                setIsTrackingActive(true);
            }
        } catch (err) {
            if (mounted && err.response?.status === 401) handleLogout();
        } finally {
            if (mounted) setLoadingInitial(false);
        }
    };
    loadDashboard();
    return () => { mounted = false; };
  }, [handleLogout]);

  // Listener for events from the Electron main process
  useEffect(() => {
    if (!window.electronAPI) return;

    const handleEngineReady = async () => {
      const placeholder = sessionPlaceholderRef.current;
      if (!placeholder) {
        setError("Error: Session placeholder missing. Please restart.");
        setIsEngineInitializing(false); 
        setLoadingAction(false);
        return;
      }
      
      try {
        const authAxios = createAuthAxiosInstance();
        const res = await authAxios.patch(`${API_URL}/api/sessions/${placeholder._id}/activate`);
        setActiveSession(res.data.session);
        setIsTrackingActive(true);
        sessionPlaceholderRef.current = null;
      } catch (err) {
        if (err.response?.status === 401) {
            setError("Authentication failed while activating the session. Please log in again.");
            return handleLogout();
        }
        setError("Failed to activate session on the server. Please stop and restart.");
      } finally {
        setIsEngineInitializing(false); 
        setLoadingAction(false);
      }
    };

    const handleEngineFailed = () => {
      setError("The local analysis engine failed to start. Check terminal for errors.");
      setIsEngineInitializing(false); 
      setLoadingAction(false); 
      setIsTrackingActive(false);
    };
    
    const removeReadyListener = window.electronAPI.onEngineReady(handleEngineReady);
    const removeFailedListener = window.electronAPI.onEngineFailed(handleEngineFailed);

    return () => {
      if (typeof removeReadyListener === 'function') removeReadyListener();
      if (typeof removeFailedListener === 'function') removeFailedListener();
    };
  }, [handleLogout]);

  // Combined Timer and Live Status Polling Effect
  useEffect(() => {
    clearInterval(elapsedTimerIntervalRef.current);
    clearInterval(liveStatusIntervalRef.current);

    if (activeSession && isTrackingActive) {
      const start = new Date(activeSession.startTime);
      const tick = () => {
        setElapsedTime(Math.floor((new Date() - start) / 1000));
      };
      tick();
      elapsedTimerIntervalRef.current = setInterval(tick, 1000);
      
      const pollStatus = async () => {
        try {
          const authAxios = createAuthAxiosInstance();
          const res = await authAxios.get(`${API_URL}/api/sessions/live-status`);
          setLiveStatus(res.data);
        } catch (error) {
          // It's okay to get a 404 if the session just ended or status is not yet available
          if (error.response?.status !== 404) { 
             console.error("Failed to fetch live status:", error);
          }
        }
      };
      pollStatus(); // Fetch immediately
      liveStatusIntervalRef.current = setInterval(pollStatus, 5000); // Poll every 5 seconds
    } else {
      setElapsedTime(0);
      setLiveStatus(null);
    }

    return () => {
      clearInterval(elapsedTimerIntervalRef.current);
      clearInterval(liveStatusIntervalRef.current);
    };
  }, [activeSession, isTrackingActive]);

  // --- Helper Functions & Rendering ---
  const formatElapsed = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00:00';
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // A single, reliable flag to determine if any critical action is in progress.
  const isActionInProgress = loadingAction || isEngineInitializing || isStarting;

  if (loadingInitial) {
    return <div style={{ padding: '20px', textAlign: 'center', fontSize: '1.2em' }}>Loading Dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Focus Guardian Dashboard</h1>
          <div className="user-info">
            <span className="user-greeting">Welcome back, {user?.name || 'User'}!</span>
            <button onClick={handleLogout} disabled={isActionInProgress} className="btn btn-primary">Logout</button>
          </div>
        </header>

        {error && (<div className="error-alert"><span>{error}</span><button onClick={() => setError(null)}>×</button></div>)}
        
        <section className="session-card">
          <div className="session-status">
            {activeSession && !isEngineInitializing ? (
              <span className="session-active">Session Active</span>
            ) : isEngineInitializing ? (
              <p>Initializing Analysis Engine...</p>
            ) : (
              <p>No active session.</p>
            )}
          </div>

          {activeSession ? (
            <>
              <div className="timer-display">{formatElapsed(elapsedTime)}</div>

              {isTrackingActive && liveStatus && (
                <div className="live-insights-grid">
                  <div className="insight-item">
                      <span className="insight-icon">💻</span>
                      <strong>Current App</strong>
                      <span>{liveStatus.service || '...'}</span>
                  </div>
                  <div className="insight-item">
                      <span className="insight-icon">{liveStatus.productivity === 'Productive' ? '✅' : '⏳'}</span>
                      <strong>Status</strong>
                      <span className={liveStatus.productivity === 'Productive' ? 'productive-text' : 'unproductive-text'}>
                          {liveStatus.productivity || '...'}
                      </span>
                  </div>
                  <div className="insight-item">
                      <span className="insight-icon">💡</span>
                      <strong>Reason</strong>
                      <span>{liveStatus.reason || 'N/A'}</span>
                  </div>
                   <div className="insight-item">
                      <span className="insight-icon">🕒</span>
                      <strong>Last Update</strong>
                      <span>{liveStatus.timestamp ? new Date(liveStatus.timestamp).toLocaleTimeString() : '...'}</span>
                  </div>
                </div>
              )}
              
              <div className="btn-group">
                <button onClick={handleStopSession} disabled={loadingAction} className="btn btn-danger">
                  {loadingAction ? 'Stopping...' : 'Stop Session'}
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={handleStartSession}
              disabled={isActionInProgress}
              className="btn btn-success"
            >
              {isActionInProgress ? 'Starting...' : 'Start New Session'}
            </button>
          )}
        </section>

        <div className="session-history-link" style={{ marginBottom: '20px', textAlign: 'center' }}>
          {/* This logic correctly disables navigation by rendering a non-clickable span */}
          {isActionInProgress ? (
            <span className="btn btn-secondary disabled-link" aria-disabled="true">
              View Session History & Analytics →
            </span>
          ) : (
            <Link to="/session" className="btn btn-secondary">
              View Session History & Analytics →
            </Link>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
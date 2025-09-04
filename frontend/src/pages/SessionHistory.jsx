import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './sessionhistory2.css';

// --- Import Specific Chart Components ---
import DailyFocusTimeChart from '../components/charts/DailyFocusTimeChart';
import DailyFocusPercentChart from '../components/charts/DailyFocusPercentChart';
import SessionFocusTrendChart from '../components/charts/SessionFocusTrendChart';
import SessionDurationChart from '../components/charts/SessionDurationChart';
import AppUsagePieChart from '../components/charts/AppUsagePieChart';
import DailyAppUsagePieChart from '../components/charts/DailyAppUsagePieChart';
import ChartCard from '../components/charts/ChartCard';

// --- Import Formatting Helpers from Centralized Utils File ---
import {
    formatDuration,
    formatFocusPercent,
    formatTimeDetailed,
    formatMinutesOnly,
    formatDateShort,
    getPaletteColor
} from '../utils/formatters';

// --- Import Chart Options and Stylers from Centralized Config ---
import {
    getBarChartOptions,
    getLineChartOptions,
    getPieChartOptions,
    styleDailyFocusTime,
    styleDailyFocusPercent,
    styleSessionDuration,
    styleSessionFocusTrend
} from '../config/chartOptions';

const API_URL = process.env.REACT_APP_API_BASE_URL;

// --- Axios Helper ---
const createAuthAxiosInstance = () => {
    const instance = axios.create({ /* baseURL if needed */ });
    const token = localStorage.getItem('focusGuardianToken');
    if (token) {
        instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        console.warn("SessionHistory: Token missing.");
    }
    return instance;
};
const authAxios = createAuthAxiosInstance();

// --- REMOVED THE INLINE STYLES OBJECT ---
// All styling is now handled by sessionhistory.css

// --- THE COMPONENT ---
function SessionHistoryPage() {
    const navigate = useNavigate();

    // --- State variables (unchanged) ---
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState(null);
    const [dailyData, setDailyData] = useState([]);
    const [dailyLoading, setDailyLoading] = useState(true);
    const [dailyError, setDailyError] = useState(null);
    const [dailyAppStats, setDailyAppStats] = useState([]);
    const [dailyAppLoading, setDailyAppLoading] = useState(true);
    const [dailyAppError, setDailyAppError] = useState(null);
    const [expandedSessionId, setExpandedSessionId] = useState(null);
    const [expandedSessionData, setExpandedSessionData] = useState(null);
    const [expandedDetailLoading, setExpandedDetailLoading] = useState(false);
    const [expandedDetailError, setExpandedDetailError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const fetchTargetRef = useRef(null);
    // eslint-disable-next-line no-unused-vars
    const [daysToShow, setDaysToShow] = useState(7);
    const logSectionRef = useRef(null);

    // --- Data fetching and handlers (unchanged) ---
    const handleLogout = useCallback(() => {
        localStorage.removeItem('focusGuardianToken');
        localStorage.removeItem('focusGuardianUser');
        setHistory([]);
        setDailyData([]);
        setDailyAppStats([]);
        setExpandedSessionId(null);
        navigate('/login');
    }, [navigate]);

    const fetchSessionHistory = useCallback(async () => {
        setHistoryLoading(true);
        setHistoryError(null);
        const token = localStorage.getItem('focusGuardianToken');
        if (!token) { handleLogout(); return; }
        if (!authAxios.defaults.headers.common['Authorization']) { authAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`; }
        try {
            const response = await authAxios.get(`${API_URL}/api/sessions/history`);
            setHistory(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setHistoryError("Could not load session history.");
            if (err.response?.status === 401 || err.response?.status === 403) { handleLogout(); }
        } finally {
            setHistoryLoading(false);
        }
    }, [handleLogout]);

    const fetchDailyData = useCallback(async () => {
        setDailyLoading(true);
        setDailyError(null);
        const token = localStorage.getItem('focusGuardianToken');
        if (!token) { handleLogout(); return; }
        if (!authAxios.defaults.headers.common['Authorization']) { authAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`; }
        try {
            const response = await authAxios.get(`${API_URL}/api/sessions/daily?days=${daysToShow}`);
            setDailyData(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setDailyError("Could not load daily analysis data.");
            if (err.response?.status === 401 || err.response?.status === 403) { handleLogout(); }
        } finally {
            setDailyLoading(false);
        }
    }, [daysToShow, handleLogout]);

    const fetchDailyAppStats = useCallback(async () => {
        setDailyAppLoading(true);
        setDailyAppError(null);
        const token = localStorage.getItem('focusGuardianToken');
        if (!token) { handleLogout(); return; }
        if (!authAxios.defaults.headers.common['Authorization']) { authAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`; }
        try {
            const response = await authAxios.get(`${API_URL}/api/sessions/daily/apps?days=${daysToShow}`);
            setDailyAppStats(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setDailyAppError("Could not load daily app usage data.");
            if (err.response?.status === 401 || err.response?.status === 403) { handleLogout(); }
        } finally {
            setDailyAppLoading(false);
        }
    }, [daysToShow, handleLogout]);

    const fetchExpandedSessionDetails = useCallback(async (sessionId) => {
        if (!sessionId) return;
        if (sessionId === expandedSessionId) {
            setExpandedSessionId(null);
            setExpandedSessionData(null);
            return;
        }
        setExpandedDetailLoading(true);
        setExpandedDetailError(null);
        setExpandedSessionData(null);
        setExpandedSessionId(sessionId);
        const token = localStorage.getItem('focusGuardianToken');
        if (!token) {
            handleLogout();
            return;
        }
        if (!authAxios.defaults.headers.common['Authorization']) {
            authAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        try {
            const response = await authAxios.get(`${API_URL}/api/sessions/${sessionId}`);
            setExpandedSessionData(response.data);
        } catch (err) {
            if (err.response?.status === 404) {
                setExpandedDetailError("Session details not found.");
            } else if (err.response?.status === 401 || err.response?.status === 403) {
                handleLogout();
            } else {
                setExpandedDetailError("Could not load session details.");
            }
        } finally {
            setExpandedDetailLoading(false);
        }
    }, [handleLogout, expandedSessionId]);

    useEffect(() => {
        const token = localStorage.getItem('focusGuardianToken');
        if (!token) {
            handleLogout();
        } else {
             fetchSessionHistory();
             fetchDailyData();
             fetchDailyAppStats();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

     useEffect(() => {
        if (logSectionRef.current) {
            logSectionRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    }, [currentPage]); 

    const isLoading = historyLoading || dailyLoading || dailyAppLoading;
    const displayError = historyError || dailyError || dailyAppError;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentHistoryItems = history.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(history.length / itemsPerPage);
    
    return (
        <div className="session-history-page">
          <Navbar hideLoginButton={true}/>
          <div className="session-history-container">
    
            <div className="session-history-header">
              <h1>Analytics & History</h1>
              <Link to="/dashboard" className="back-button">← Back to Dashboard</Link>
            </div>
    
            {isLoading && <div className="loading-indicator">Loading data...</div>}
            {displayError && !isLoading && (
              <div className="loading-error">
                Error loading some data. Charts or logs may be incomplete. Please try refreshing. <Link to="/dashboard">Go Back</Link>.
              </div>
            )}
    
            {!isLoading && (
              <>
                <section className="daily-analysis-section">
                  <h2 className="session-section-heading">Daily Analysis (Last {daysToShow} Days)</h2>
                  <div className="chart-grid">
                    {dailyError
                      ? <div className="loading-error">Focus Time/Percent Chart Error</div>
                      : (
                        <>
                          <ChartCard>
                            <DailyFocusTimeChart
                                dailyData={dailyData}
                                options={getBarChartOptions()}
                                formatDateShort={formatDateShort}
                                dataStyler={styleDailyFocusTime}
                            />
                          </ChartCard>
                          <ChartCard>
                            <DailyFocusPercentChart
                                dailyData={dailyData}
                                options={getBarChartOptions(true)}
                                formatDateShort={formatDateShort}
                                dataStyler={styleDailyFocusPercent}
                            />
                          </ChartCard>
                        </>
                      )
                    }
                    {dailyAppError
                      ? <div className="loading-error">Daily App Usage Chart Error</div>
                      : <ChartCard>
                            <DailyAppUsagePieChart
                                dailyAppStats={dailyAppStats}
                                options={getPieChartOptions()}
                                getPaletteColor={getPaletteColor}
                            />
                        </ChartCard>
                    }
                  </div>
                </section>
    
                <section className="session-trends-section">
                  <h2 className="session-section-heading">Per-Session Trends</h2>
                  {historyError
                    ? <div className="loading-error">Trend Chart Error</div>
                    : (
                      <div className="chart-grid">
                        <ChartCard>
                            <SessionFocusTrendChart
                                history={history}
                                options={getLineChartOptions(true)}
                                dataStyler={styleSessionFocusTrend}
                            />
                        </ChartCard>
                        <ChartCard>
                            <SessionDurationChart
                                history={history}
                                options={getBarChartOptions()}
                                dataStyler={styleSessionDuration}
                            />
                        </ChartCard>
                      </div>
                    )
                  }
                </section>
    
                <section ref={logSectionRef} className="detailed-log-section">
                  <h2 className="session-section-heading">Detailed Session Log</h2>
                  {historyError
                    ? <p className="loading-error">Could not load the detailed session log.</p>
                    : history.length === 0
                      ? <p>No sessions recorded yet.</p>
                      : (
                        <>
                            <div className="table-container">
                              <div className="flex-table">
                                <div className="flex-header">
                                  <div className="cell">Start Time</div>
                                  <div className="cell">Duration</div>
                                  <div className="cell">Focus %</div>
                                  <div className="cell">Focus Time</div>
                                  <div className="cell">Distraction</div>
                                  <div className="cell">Top App</div>
                                  <div className="cell actions">Details</div>
                                </div>
                                {currentHistoryItems.map(session => {
                                  const isExpanded = expandedSessionId === session._id;
                                  const topAppEntry = Object.entries(session.appUsage || {}).sort(([, a], [, b]) => b - a)[0];
                                  const topAppName = topAppEntry ? topAppEntry[0].replace(/_/g, '.') : 'N/A';
                                  const topAppTime = topAppEntry ? topAppEntry[1] : 0;

                                  return (
                                    <React.Fragment key={session._id}>
                                      <div className={`flex-row${isExpanded ? ' expanded' : ''}`}>
                                        <div className="cell">{new Date(session.startTime).toLocaleString()}</div>
                                        <div className="cell duration">{formatDuration(session.startTime, session.endTime)}</div>
                                        <div className="cell">{formatFocusPercent(session.focusTime, session.distractionTime)}</div>
                                        <div className="cell">{formatTimeDetailed(session.focusTime)}</div>
                                        <div className="cell">{formatTimeDetailed(session.distractionTime)}</div>
                                        <div className="cell">{topAppName !== 'N/A' ? `${topAppName} (${formatMinutesOnly(topAppTime)})` : 'N/A'}</div>
                                        <div className="cell actions">
                                          <button
                                            onClick={() => fetchExpandedSessionDetails(session._id)}
                                            disabled={expandedDetailLoading && expandedSessionId === session._id}
                                            title={isExpanded ? "Hide Details" : "Show Details"}
                                          >
                                            {expandedDetailLoading && expandedSessionId === session._id ? '…' : (isExpanded ? '▼' : '▶')}
                                          </button>
                                        </div>
                                      </div>
                                      {isExpanded && (
                                        <div className="detail-row">
                                          {expandedDetailLoading && <p style={{ padding: '15px', textAlign: 'center' }}>Loading details...</p>}
                                          {expandedDetailError && <p style={{ color: 'red', padding: '15px', textAlign: 'center' }}>Error: {expandedDetailError}</p>}
                                          {expandedSessionData && !expandedDetailLoading && !expandedDetailError && (
                                            <div className="detail-content">
                                              <div>
                                                <h4>Summary</h4>
                                                <p><strong>Started:</strong> {new Date(expandedSessionData.startTime).toLocaleString()}</p>
                                                <p><strong>Ended:</strong> {expandedSessionData.endTime ? new Date(expandedSessionData.endTime).toLocaleString() : 'In Progress'}</p>
                                                <p><strong>Duration:</strong> {formatDuration(expandedSessionData.startTime, expandedSessionData.endTime)}</p>
                                                <p><strong>Focus %:</strong> <strong>{formatFocusPercent(expandedSessionData.focusTime, expandedSessionData.distractionTime)}</strong></p>
                                                <p><strong>Focus Time:</strong> <span>{formatTimeDetailed(expandedSessionData.focusTime)}</span></p>
                                                <p><strong>Distraction Time:</strong> <span>{formatTimeDetailed(expandedSessionData.distractionTime)}</span></p>
                                              </div>
                                              <div>
                                                <h4>Application Usage (This Session)</h4>
                                                <AppUsagePieChart
                                                  sessionData={expandedSessionData}
                                                  options={getPieChartOptions()}
                                                  getPaletteColor={getPaletteColor}
                                                />
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </div>

                            {history.length > itemsPerPage && (
                                <div className="pagination-controls">
                                  <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1 || isLoading}
                                  >
                                    {'<'} Previous
                                  </button>
                                  <span> Page {currentPage} of {totalPages} </span>
                                  <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || isLoading}
                                  >
                                    Next {'>'}
                                  </button>
                                </div>
                            )}
                        </>
                      )
                  }
                </section>
              </>
            )}
    
          </div>
          <Footer />
        </div>
      );
    }

export default SessionHistoryPage;
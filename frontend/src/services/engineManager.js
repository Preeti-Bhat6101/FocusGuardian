// src/services/engineManager.js

// This is our simple, in-memory state store.
// It lives as long as the app is open and survives component unmounts.
const state = {
  isEngineRunning: false,
  isEngineInitializing: false,
  activeSessionId: null,
  activeToken: null,
};

// We use an EventEmitter-like pattern to notify subscribers of changes.
const subscribers = new Set();

const notifySubscribers = () => {
  subscribers.forEach(callback => callback(state));
};

const engineManager = {
  // Method to get the current state
  getState: () => ({ ...state }),

  // Method to subscribe to state changes
  subscribe: (callback) => {
    subscribers.add(callback);
    // Return an unsubscribe function for cleanup
    return () => subscribers.delete(callback);
  },

  // The main function to start the engine
  start: (sessionId, token) => {
    // Prevent multiple starts
    if (state.isEngineInitializing || state.isEngineRunning) {
      console.warn("EngineManager: Start called but engine is already running/initializing.");
      return;
    }

    console.log("EngineManager: Starting engine...");
    state.isEngineInitializing = true;
    state.activeSessionId = sessionId;
    state.activeToken = token;
    notifySubscribers();

    if (window.electronAPI) {
      window.electronAPI.startLocalEngine(sessionId, token);
    }
  },

  // The main function to stop the engine
  stop: () => {
    if (!state.isEngineRunning && !state.isEngineInitializing) {
      console.warn("EngineManager: Stop called but engine was not running.");
      return;
    }
    
    console.log("EngineManager: Stopping engine...");
    if (window.electronAPI) {
      window.electronAPI.stopLocalEngine();
    }
    
    // Reset state immediately
    state.isEngineRunning = false;
    state.isEngineInitializing = false;
    state.activeSessionId = null;
    state.activeToken = null;
    notifySubscribers();
  },
};

// --- Listen to Electron events globally ---
// This part is crucial. The manager listens, not the component.
if (window.electronAPI) {
  window.electronAPI.onEngineReady(() => {
    console.log("EngineManager: Received engine-ready signal.");
    if (state.isEngineInitializing) {
      state.isEngineInitializing = false;
      state.isEngineRunning = true;
      notifySubscribers();
    }
  });

  window.electronAPI.onEngineFailed(() => {
    console.error("EngineManager: Received engine-failed signal.");
    // Reset state on failure
    state.isEngineInitializing = false;
    state.isEngineRunning = false;
    notifySubscribers();
    // We can also notify subscribers of the error itself if needed
  });

  window.electronAPI.onEngineStopped(() => {
    console.log("EngineManager: Received engine-stopped signal (e.g., process crashed).");
    if (state.isEngineRunning || state.isEngineInitializing) {
       engineManager.stop(); // Trigger a clean stop and notify subscribers
    }
  });
}

export default engineManager;
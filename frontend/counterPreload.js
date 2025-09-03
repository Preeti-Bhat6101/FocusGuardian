const { contextBridge } = require('electron');

// Even though we are not exposing any functions to the counter window,
// it is a security best practice to have a preload script.
// This script runs in a privileged environment and ensures that the
// renderer process (your React component) remains isolated.
//
// We can expose an empty object to confirm the script has run.
contextBridge.exposeInMainWorld('electronAPI', {});
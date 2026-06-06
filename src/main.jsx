import React from 'react'
import ReactDOM from 'react-dom/client'
import SafeApp from './App.jsx'
import './index.css'

// --- Handle Launch Queue for File Handling System ---
if ('launchQueue' in window) {
  window.launchQueue.setConsumer((launchParams) => {
    // If the app was opened by clicking a local audio file (.mp3, .wav)
    if (launchParams.files && launchParams.files.length > 0) {
      const fileHandle = launchParams.files[0];

      // Request permission to read the file locally
      fileHandle.getFile().then((file) => {
        console.log("Opening shared audio file natively:", file.name);
        // Custom window event dispatch so your Player components can listen and play it immediately
        const event = new CustomEvent('nativeAudioLaunch', { detail: { audioFile: file } });
        window.dispatchEvent(event);
      }).catch(err => console.error("Failed to read launched file", err));
    }
  });
}

// --- Handle Incoming App Shortcuts & Share Targets ---
const urlParams = new URLSearchParams(window.location.search);
const shortcutAction = urlParams.get('shortcut');
if (shortcutAction) {
  console.log(`App launched via shortcut option: ${shortcutAction}`);
  // You can check window.location.search inside your app view components to redirect to favorites/recent automatically!
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SafeApp />
  </React.StrictMode>,
)
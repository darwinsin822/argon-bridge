// Argon Bridge Chrome Extension - Background Service Worker
const NATIVE_HOST_NAME = 'com.darwinsin.argon_bridge';
let nativePort = null;
let pendingCallbacks = new Map();
let messageSeq = 0;

function connectNative() {
  if (nativePort) return nativePort;
  try {
    nativePort = chrome.runtime.connectNative(NATIVE_HOST_NAME);
    nativePort.onMessage.addListener((response) => {
      if (response && response.id && pendingCallbacks.has(response.id)) {
        const { resolve, reject } = pendingCallbacks.get(response.id);
        pendingCallbacks.delete(response.id);
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error || 'Native message failed'));
        }
      }
    });

    nativePort.onDisconnect.addListener(() => {
      const err = chrome.runtime.lastError;
      console.warn('[ArgonExtension] Native Host disconnected:', err ? err.message : 'Clean exit');
      nativePort = null;
      for (const { reject } of pendingCallbacks.values()) {
        reject(new Error('Native Host disconnected'));
      }
      pendingCallbacks.clear();
    });

    return nativePort;
  } catch (err) {
    console.error('[ArgonExtension] Failed to connect to Native Host:', err);
    nativePort = null;
    return null;
  }
}

function sendNative(action, payload = {}) {
  return new Promise((resolve, reject) => {
    const port = connectNative();
    if (!port) {
      reject(new Error('Unable to connect to Argon Bridge Native Host'));
      return;
    }
    const id = `msg_${++messageSeq}_${Date.now()}`;
    pendingCallbacks.set(id, { resolve, reject });

    port.postMessage({ id, action, payload });

    // Safety timeout
    setTimeout(() => {
      if (pendingCallbacks.has(id)) {
        pendingCallbacks.delete(id);
        reject(new Error(`Native host timed out for action ${action}`));
      }
    }, 10000);
  });
}

// Runtime message listener for Popup and Content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action, payload } = request;

  sendNative(action, payload)
    .then((data) => sendResponse({ success: true, data }))
    .catch((err) => sendResponse({ success: false, error: err.message }));

  return true; // Keep message channel open for async response
});

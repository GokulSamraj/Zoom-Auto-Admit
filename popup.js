


const toggleBtn = document.getElementById('toggle');
let countdownInterval;

function updateCountdown() {
  const statusEl = document.getElementById('status');
  chrome.storage.local.get(['lastCheckTime', 'zoomAutoAdmitRunning'], (result) => {
    if (!result.zoomAutoAdmitRunning) {
      statusEl.textContent = 'Next check in: --';
      return;
    }
    
    const lastCheck = result.lastCheckTime || 0;
    const now = Date.now();
    const nextCheck = lastCheck + 10000;
    const remaining = Math.max(0, Math.ceil((nextCheck - now) / 1000));
    
    if (remaining > 0) {
      statusEl.textContent = `Next check in: ${remaining}s`;
    } else {
      statusEl.textContent = 'Checking...';
    }
  });
}

function updateButton(running) {
  if (toggleBtn) {
    toggleBtn.textContent = running ? 'Stop Auto Admit' : 'Start Auto Admit';
    
    if (running) {
      updateCountdown();
      countdownInterval = setInterval(updateCountdown, 1000);
    } else {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
      document.getElementById('status').textContent = 'Next check in: --';
    }
  }
}

// Sync button state on popup load
function syncButtonState() {
  chrome.storage.local.get(['zoomAutoAdmitRunning'], (result) => {
    updateButton(!!result.zoomAutoAdmitRunning);
  });
}

// Initialize button state
syncButtonState();

// Listen for changes in storage to keep button in sync
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.zoomAutoAdmitRunning) {
    updateButton(!!changes.zoomAutoAdmitRunning.newValue);
  }
});

// Add click handler for auto admit toggle
if (toggleBtn) {
  toggleBtn.addEventListener('click', async () => {
    const result = await chrome.storage.local.get(['zoomAutoAdmitRunning']);
    const running = !result.zoomAutoAdmitRunning;
    
    await chrome.storage.local.set({ zoomAutoAdmitRunning: running });
    
    try {
      if (running) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.runtime.sendMessage({ type: 'START_AUTO_ADMIT', tabId: tab.id });
      } else {
        chrome.runtime.sendMessage({ type: 'STOP_AUTO_ADMIT' });
      }
    } catch (e) {
      console.error('Error in button handler:', e);
    }
  });
} else {
  console.error('Toggle button not found in popup.html');
}

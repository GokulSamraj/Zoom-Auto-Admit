


const toggleBtn = document.getElementById('toggle');

function updateButton(running) {
  if (toggleBtn) {
    toggleBtn.textContent = running ? 'Stop' : 'Start';
  }
}

// Sync button state on popup load
function syncButtonState() {
  chrome.storage.local.get(['zoomAutoAdmitRunning'], (result) => {
    updateButton(!!result.zoomAutoAdmitRunning);
  });
}
syncButtonState();

// Listen for changes in storage to keep button in sync
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.zoomAutoAdmitRunning) {
    updateButton(!!changes.zoomAutoAdmitRunning.newValue);
  }
});

if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    console.log('Toggle button clicked');
    chrome.storage.local.get(['zoomAutoAdmitRunning'], (result) => {
      let running = !result.zoomAutoAdmitRunning;
      chrome.storage.local.set({ zoomAutoAdmitRunning: running }, async () => {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (running) {
            console.log('Sending START_AUTO_ADMIT to background', tab);
            chrome.runtime.sendMessage({ type: 'START_AUTO_ADMIT', tabId: tab.id });
          } else {
            console.log('Sending STOP_AUTO_ADMIT to background');
            chrome.runtime.sendMessage({ type: 'STOP_AUTO_ADMIT' });
          }
        } catch (e) {
          console.error('Error in button handler:', e);
        }
      });
    });
  });
} else {
  console.error('Toggle button not found in popup.html');
}

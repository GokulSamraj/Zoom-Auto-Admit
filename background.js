let admitInterval = null;
let currentTabId = null;

function clickAdmitButtons() {
    if (!currentTabId) return;

    chrome.scripting.executeScript({
        target: { tabId: currentTabId },
        func: () => {
            function findAndClickAdmit(root = document) {
                let clicked = 0;
                
                // Find all possible admit buttons using various selectors
                const selectors = [
                    'button:not([disabled])',
                    '[role="button"]:not([disabled])',
                    '[aria-label*="admit" i]:not([disabled])',
                    '[title*="admit" i]:not([disabled])',
                    '[data-testid*="admit" i]:not([disabled])',
                    'button[class*="admit" i]:not([disabled])'
                ];

                selectors.forEach(selector => {
                    const elements = root.querySelectorAll(selector);
                    elements.forEach(el => {
                        const text = (el.textContent || '').toLowerCase();
                        const label = (el.getAttribute('aria-label') || '').toLowerCase();
                        const title = (el.getAttribute('title') || '').toLowerCase();
                        
                        if (text.includes('admit') || label.includes('admit') || title.includes('admit')) {
                            try {
                                el.click();
                                console.log('Clicked admit button:', el);
                                clicked++;
                            } catch (e) {
                                console.error('Failed to click button:', e);
                            }
                        }
                    });
                });

                // Try to find buttons inside iframes
                const iframes = root.querySelectorAll('iframe');
                iframes.forEach(iframe => {
                    try {
                        if (iframe.contentDocument) {
                            clicked += findAndClickAdmit(iframe.contentDocument);
                        }
                    } catch (e) {
                        // Ignore cross-origin errors
                    }
                });

                return clicked;
            }

            const totalClicked = findAndClickAdmit();
            if (totalClicked > 0) {
                console.log(`Clicked ${totalClicked} admit button(s)`);
            }
        }
    }).catch(err => console.error('Error executing script:', err));
}

function startAutoAdmit(tabId) {
    currentTabId = tabId;
    console.log('Starting auto-admit for tab:', currentTabId);
    
    // Clear any existing interval
    if (admitInterval) {
        clearInterval(admitInterval);
    }
    
    // Initial check
    clickAdmitButtons();
    
    // Set up interval to check continuously
    admitInterval = setInterval(clickAdmitButtons, 1000);
}

function stopAutoAdmit() {
    if (admitInterval) {
        clearInterval(admitInterval);
        admitInterval = null;
    }
    currentTabId = null;
    console.log('Auto-admit stopped');
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'START_AUTO_ADMIT' && message.tabId) {
        startAutoAdmit(message.tabId);
        sendResponse({ success: true });
    } else if (message.type === 'STOP_AUTO_ADMIT') {
        stopAutoAdmit();
        sendResponse({ success: true });
    }
    return true;
});
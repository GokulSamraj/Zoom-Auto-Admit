let admitInterval = null;
let currentTabId = null;

function clickAdmitButtons() {
    if (!currentTabId) return;
    
    // Store last check time
    chrome.storage.local.set({ lastCheckTime: Date.now() });

    chrome.scripting.executeScript({
        target: { tabId: currentTabId },
        func: () => {
            function findAndClickAdmitButtons(root = document) {
                let clicked = 0;
                
                // Common Zoom waiting room selectors
                const selectors = [
                    // Generic button selectors
                    'button:not([disabled])',
                    '[role="button"]:not([disabled])',
                    
                    // Zoom-specific selectors
                    '[aria-label*="admit" i]:not([disabled])',
                    '[data-testid*="admit" i]:not([disabled])',
                    '[class*="admit" i]:not([disabled])',
                    '[class*="waiting" i] button:not([disabled])',
                    
                    // Additional Zoom UI patterns
                    '.admit-btn',
                    '.participants-item-button',
                    '.waiting-room-item button',
                    '[data-testid="waiting-room-item"] button',
                    '[aria-label*="participants" i] button'
                ];

                // Search for buttons using all selectors
                selectors.forEach(selector => {
                    const elements = root.querySelectorAll(selector);
                    elements.forEach(el => {
                        const text = (el.textContent || '').toLowerCase();
                        const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
                        const title = (el.getAttribute('title') || '').toLowerCase();
                        const dataTestId = (el.getAttribute('data-testid') || '').toLowerCase();
                        
                        // Check for admit-related text in various attributes
                        if (
                            text.includes('admit') ||
                            ariaLabel.includes('admit') ||
                            title.includes('admit') ||
                            dataTestId.includes('admit') ||
                            text.includes('let in') || // Additional Zoom text patterns
                            text.match(/admit \d+ participants?/i)
                        ) {
                            try {
                                // Ensure element is visible and interactable
                                const style = window.getComputedStyle(el);
                                if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                                    el.click();
                                    clicked++;
                                    console.log('Clicked admit button:', text || ariaLabel || title);
                                }
                            } catch (e) {
                                console.error('Failed to click button:', e);
                            }
                        }
                    });
                });

                // Look for admit buttons in iframes (Zoom sometimes uses these)
                try {
                    const iframes = root.querySelectorAll('iframe');
                    iframes.forEach(iframe => {
                        if (iframe.contentDocument) {
                            clicked += findAndClickAdmitButtons(iframe.contentDocument);
                        }
                    });
                } catch (e) {
                    // Ignore cross-origin iframe errors
                }

                return clicked;
            }

            const totalClicked = findAndClickAdmitButtons();
            if (totalClicked > 0) {
                console.log(`Clicked ${totalClicked} admit button(s)`);
            }
        }
    }).catch(err => console.error('Error executing script:', err));
}

function startAutoAdmit(tabId) {
    currentTabId = tabId;
    console.log('Starting auto-admit for tab:', currentTabId);
    
    if (admitInterval) {
        clearInterval(admitInterval);
    }
    
    // Initial check
    clickAdmitButtons();
    
    // Set up interval to check every 10 seconds
    admitInterval = setInterval(clickAdmitButtons, 10000);
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
    } else if (message.type === 'STOP_AUTO_ADMIT') {
        stopAutoAdmit();
    }
});
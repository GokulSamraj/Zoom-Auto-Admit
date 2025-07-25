let isAdmitting = false;

function clickAdmitButtons() {
    const elements = document.querySelectorAll('button, [role="button"], [aria-label*="admit" i], [class*="admit" i]');
    let clicked = 0;
    
    elements.forEach(element => {
        const text = (element.textContent || '').toLowerCase();
        const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase();
        const title = (element.getAttribute('title') || '').toLowerCase();
        
        if (text.includes('admit') || ariaLabel.includes('admit') || title.includes('admit')) {
            element.click();
            clicked++;
        }
    });
    
    if (clicked > 0) {
        console.log(`Clicked ${clicked} admit button(s)`);
    }
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === 'START_ADMITTING') {
        isAdmitting = true;
        // Start the interval
        const intervalId = setInterval(() => {
            if (!isAdmitting) {
                clearInterval(intervalId);
                return;
            }
            clickAdmitButtons();
        }, 10000); // Check every 10 seconds
    } else if (message === 'STOP_ADMITTING') {
        isAdmitting = false;
    }
});
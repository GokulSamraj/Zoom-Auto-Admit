let isAdmitting = false;
let admitInterval = null;

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
chrome.runtime.onMessage.addListener((message) => {
    if (message === 'START_ADMITTING') {
        isAdmitting = true;
        if (admitInterval) {
            clearInterval(admitInterval);
        }
        // Start the interval with 10-second delay
        admitInterval = setInterval(() => {
            if (!isAdmitting) {
                clearInterval(admitInterval);
                admitInterval = null;
                return;
            }
            clickAdmitButtons();
        }, 10000); // Check every 10 seconds
    } else if (message === 'STOP_ADMITTING') {
        isAdmitting = false;
        if (admitInterval) {
            clearInterval(admitInterval);
            admitInterval = null;
        }
    }
});
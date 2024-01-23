// service-worker.js
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'authorizeUser') {
        // Perform tasks after user is authorized (e.g., send a message to content script)
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'performTasksAfterAuthorization' });
        });
    }
});



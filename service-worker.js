// service-worker.js
chrome.runtime.onMessage.addListener(function (request) {
    if (request.action === 'authorizeUser') {
        // Perform tasks after user is authorized (e.g., send a message to content script)
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0].url.startsWith("https://app.testudo.umd.edu/#/main/schedule?termId")) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'performTasksAfterAuthorization', token: request.token });
            }
        });
    }
});



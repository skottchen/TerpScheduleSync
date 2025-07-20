chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('Message received:', request);

    if (request.action === 'authorizeUser') {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0].url.startsWith("https://app.testudo.umd.edu/#/main/schedule?termId")) {
                const messageToSend = {
                    action: 'performTasksAfterAuthorization',
                    token: request.token,
                };
                console.log('Message sent to content script:', messageToSend);
                chrome.tabs.sendMessage(tabs[0].id, messageToSend);
            }
        });
    } else if (request.action === 'displayProgressBar'){
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          
        });
    }
});


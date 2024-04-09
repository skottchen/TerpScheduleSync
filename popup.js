const importBtn = document.createElement("button");
const link = document.querySelector('a');
const popupBody = document.querySelector("body");
importBtn.style.backgroundColor = "lightgreen";
importBtn.textContent = "Import my schedule to Google Calendar!";
importBtn.setAttribute("id", "import_btn");
importBtn.addEventListener('click', handleImportButtonClick);
const loadingText = document.createElement("h2");
loadingText.textContent = "Parsing your schedule..."

//this function was provided by the Chrome Extension API
async function getCurrentTab() {//returns a promise
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function verifyTestudoIsOpen() {
    return await getCurrentTab().then(
        function (response) {
            return response;
        }
    ).then(
        function (response) {
            if (response.url.startsWith('https://app.testudo.umd.edu/#/main/schedule?termId')) {
                link.remove();
                popupBody.appendChild(importBtn);
            }
        }
    )
}

verifyTestudoIsOpen();

function handleImportButtonClick() {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
        // Send a message to the service worker to authorize the user
        sendMessageToServiceWorker(token);
    });
    document.getElementById("import_btn").disabled = true;
    popupBody.appendChild(loadingText);
}

function sendMessageToServiceWorker(token) {
    chrome.runtime.sendMessage({ action: 'authorizeUser', token: token });
}
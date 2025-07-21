// Copyright (c) 2024-2025 Scott Chen
// This source code is licensed under the MIT License
const importBtn = document.createElement("button");
const link = document.querySelector('a');
const popupBody = document.querySelector("body");
importBtn.style.backgroundColor = "lightgreen";
importBtn.textContent = "Import my schedule to Google Calendar!";
importBtn.setAttribute("id", "import_btn");
importBtn.addEventListener('click', () => {
    handleImportButtonClick();
    displayProgressBar();
});

verifyTestudoIsOpen();

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

function handleImportButtonClick() {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
        // Send a message to the service worker to authorize the user
        sendMessageToServiceWorker(token);
    });
    document.getElementById("import_btn").disabled = true;
    const progressBarCont = document.createElement("div");
    progressBarCont.setAttribute("id", "container");
    progressBarCont.style.marginTop = "10px";
    popupBody.appendChild(progressBarCont);
}

function sendMessageToServiceWorker(token) {
    chrome.runtime.sendMessage({ action: 'authorizeUser', token: token });
}

//Update 5/22/24
//Add progress bar to popup
function displayProgressBar() {
    //from https://jsfiddle.net/kimmobrunfeldt/k5v2d0rr/
    const bar = new ProgressBar.Line(container, {
        strokeWidth: 5,
        easing: 'easeInOut',
        duration: 13000,
        color: 'green',
        trailColor: '#eee',
        trailWidth: 1,
        text: {
            style: {
                // Text color.
                // Default: same as stroke color (options.color)
                color: 'black',
                position: 'absolute',
                right: '0',
                bottom: '6px',
                padding: 0,
                margin: 0,
                transform: null,
            },
            autoStyleContainer: false
        },
        step: (state, bar) => {
            bar.setText(Math.round(bar.value() * 100) + ' %');
        }
    });

    bar.animate(1);  // Number from 0.0 to 1.0
}


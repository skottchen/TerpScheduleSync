# TerpScheduleSync
Import your semester course schedule from Testudo to Google Calendar

## Motivation
As students at the University of Maryland, College Park, we all have many tedious tasks that we don't look forward to doing but that we must get done anyway. One of these tasks is making our schedule/planning our semester before it starts. To keep track of the time classes take place, students often manually enter their classes from Testudo into Google Calendar. 

To help UMD students save time from their busy schedules/having to import their courses manually to Google Calendar, I developed TerpScheduleSync, which automatically imports students' course schedules from the schedule page on Testudo (the university system) to Google Calendar. 

## Challenges
The most challenging aspect of this project was working with the Google Calendar API as its official documentation does not contain much information on how to make API requests with JavaScript. Another challenging aspect was using the Chrome Extension API to pass the access/authentication token from the popup (popup.js) to the content script (schedule_importer.js). 

## Built With
- HTML, CSS, JavaScript (asynchronous concepts: async, await, promises, setTimeout) 
- Chrome Extension API, Google Calendar API, Fetch API

## How To Use
Simply download the [extension](https://chromewebstore.google.com/detail/terpschedulesync/jddhjnjljjagidpbanbfbacadiejbogn) from the Chrome Web Store and click through the buttons on the popup. Make sure to click continue on the Oauth consent screen. 
<em>Note: This extension is only for students enrolled at the University of Maryland, College Park </em>

## License
Distributed under the MIT License. See `License.txt` for more information. 

## Contact
Send me an email at schen78997@gmail.com or testudodev1@gmail.com

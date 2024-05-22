# TerpScheduleSync

Import your semester course schedule from Testudo to Google Calendar

## Motivation

As students at the University of Maryland, College Park, we all have many tedious tasks that we don't look forward to doing but that we must get done anyway. One of these tasks is making our schedule/planning our semester before it starts. To keep track of the time classes take place, students often manually enter their classes from Testudo into Google Calendar, which can be a tedious and time-consuming task.

To help UMD students save time in their busy schedules/save time from having to import their courses manually to Google Calendar, I developed TerpScheduleSync, which is a Chrome Extension that automatically imports students' course schedules from the schedule page on Testudo (the university system) to Google Calendar.

## Challenges

The most challenging aspect of this project was working with the Google Calendar API as its official documentation does not contain much information on how to make API requests with JavaScript. Another challenging aspect was using the Chrome Extension API to pass the access/authentication token from the popup (popup.js) to the content script (schedule-importer.js).

## Built With

- HTML, CSS, JavaScript (asynchronous concepts: async/await, promises, setTimeout)
- Chrome Extension API, Google Calendar API, Fetch API

## How To Use

Simply download the [extension](https://chromewebstore.google.com/detail/terpschedulesync/jddhjnjljjagidpbanbfbacadiejbogn) from the Chrome Web Store and click through the buttons on the popup. Make sure to click continue on the OAuth consent screen. <br>
<em>Note: This extension is only for students enrolled at the University of Maryland, College Park </em>

## CHANGELOG

4/20/24: 
- Added function (adjustToDaylightSavingsTime) that enables extension to account for Daylight Savings Time when importing courses from Testudo (avoids Fall and Spring semester courses being shifted ahead by 1 hour)

5/22/24: 
- Add year, month, and day parameters to Google Calendar link that opens when the program is finished running so that users don't have to navigate all the way to the semester that they imported their classes for in Google Calendar
- Add progress bar to popup

## License

Distributed under the MIT License. See `License.txt` for more information.

## Contact

Send me an email at testudodev1@gmail.com

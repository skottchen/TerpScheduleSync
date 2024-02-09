# TerpScheduleSync
Import your semester course schedule from Testudo to Google Calendar

## Motivation
As students at the University of Maryland, College Park, we all have many tedious tasks that we don't look forward to doing but that we must get done anyway. One of these tasks is making our schedule/planning our semester before it starts. To keep track of the time classes take place, students often manually enter their classes from Testudo into Google Calendar. However, this task can be quite time-consuming and is not one that students look forward to doing. <br>

To help UMD students save time from their busy schedules, I developed this Chrome Extension (Terp Schedule Sync) that imports students' course schedules from the schedule page on Testudo (the university system) directly to Google Calendar. 

## Challenges
The most challenging aspect of this project was working with the Google Calendar API as its official documentation does not contain much information on how to make API requests with JavaScript. Another challenging aspect was using the Chrome Extension API to pass the access token from the popup (popup.js) to the content script (schedule_importer.js). 

## License
Distributed under the MIT License. See `License.txt` for more information. 

## Contact
Send me an email at schen78997@gmail.com or testudodev1@gmail.com

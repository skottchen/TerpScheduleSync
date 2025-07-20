
# TerpScheduleSync

TerpScheduleSync is a Chrome Extension that helps University of Maryland, College Park students automatically import their course schedules from Testudo into Google Calendar, saving time and reducing manual entry.

## Features

- One-click import of your UMD course schedule from Testudo to Google Calendar
- Automatically navigates to the correct semester in Google Calendar
- Progress bar for visual feedback during import
- Handles Daylight Savings Time adjustments for accurate event times

## Motivation

Manually entering class schedules from Testudo into Google Calendar is a tedious and time-consuming task for UMD students. TerpScheduleSync streamlines this process, allowing students to focus on what matters most.

## How It Works

1. Download the [extension](https://chromewebstore.google.com/detail/terpschedulesync/jddhjnjljjagidpbanbfbacadiejbogn) from the Chrome Web Store.
2. Open the schedule page on Testudo.
3. Click the import button in the extension popup.
4. Authorize access to your Google Calendar when prompted.
5. Your classes will be automatically added to Google Calendar for the correct semester.

> **Note:** This extension is intended for students enrolled at the University of Maryland, College Park.

## Technologies Used

- HTML, CSS, JavaScript (async/await, promises, setTimeout)
- Chrome Extension API
- Google Calendar API
- Fetch API

## Challenges

- Integrating with the Google Calendar API using JavaScript, due to limited official documentation
- Passing authentication tokens securely between the popup and content scripts using the Chrome Extension API

## Changelog

**4/20/24:**
- Added Daylight Savings Time support to prevent event time shifts in Fall and Spring semesters

**5/22/24:**
- Added year, month, and day parameters to Google Calendar link for direct navigation to the imported semester
- Added progress bar to popup for improved user experience

## Contributing

Contributions are welcome! Please email [testudodev1@gmail.com](mailto:testudodev1@gmail.com) with suggestions or pull requests.

## License

Distributed under the MIT License. See the `LICENSE` file for details.

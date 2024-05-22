const API_KEY = "AIzaSyDc-NMRQwMYohXnR69RfI0XGbfJXj2VAOA"
let calendarId;
let currSemester;
let currSemesterStartYear;
let currSemesterStartMonth;
let currSemesterStartDay;
let colorCount = 1;

chrome.runtime.onMessage.addListener(async function (request) {
    if (request.action === 'performTasksAfterAuthorization') {
        const token = request.token;
        await scrapeScheduleDataFromTestudo(token);
        await new Promise((r) => setTimeout(r, 2000));
        await cleanUpFirstDayOfClasses(token);
        colorCount = 1;

        //Update 5/20: Add year, month, and day parameters to link so that users don't have to navigate all the way to the
        //semester that they imported their classes for in Google Calendar
        window.open(`https://calendar.google.com/calendar/u/0/r/week/${currSemesterStartYear}/${currSemesterStartMonth}/${currSemesterStartDay}`)
    }
});

async function scrapeScheduleDataFromTestudo(token) {
    await new Promise((r) => setTimeout(r, 3000)); //wait for Testudo to load as it is often under heavy traffic
    currSemester = document.querySelector("span.header-dropdown-label").innerText;
    let studentCourses = document.querySelectorAll(".course-card-container--info");
    if (studentCourses.length > 0) {
        await createNewCalendar(token); //only create a calendar if the student is registered for any courses
        let count = 0;
        for (const course of studentCourses) {
            parseCourse(studentCourses[count].innerText, token);
            count++;
        }
    } else {
        alert("You are not registered for any classes this semester.");
    }
}

async function createNewCalendar(token) {
    const apiUrl = `https://www.googleapis.com/calendar/v3/calendars?key=${API_KEY}`
    const courseCalendar = {
        summary: `UMD ${currSemester} Course Schedule`,
        timeZone: "America/New_York",
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
            },
            body: JSON.stringify(courseCalendar),
        });
        if (response.ok) {
            const responseData = await response.json();
            calendarId = responseData.id;
            console.log('New calendar created successfully. Calendar ID:', calendarId);
        } else {
            const errorData = await response.json();
            console.log(apiUrl);
            console.error('Failed to create new calendar:', errorData.error.message);
        }
    } catch (error) {
        console.error('Error creating new calendar:', error);
    }
}

async function parseCourse(course, token) {//format schedule data so that is readable by the Google Calendar API
    let courseArr = course.split("\n");
    courseArr.splice(1, 1);
    //courseArr[0] = courseArr[0].slice(0, courseArr[0].length - 6); remove section number from course
    courseArr[0] = courseArr[0].trim();
    courseArr.splice(-2, 2);
    courseArr.forEach((elem) => {
        if (elem.includes("EST")) {
            const elemIdx = courseArr.indexOf(elem);
            courseArr[elemIdx] = courseArr[elemIdx].slice(0, -4);
            courseArr[elemIdx] = courseArr[elemIdx].split(/[ ,]+/);
            courseArr[elemIdx].splice(2, 1);
        }
    })
    courseArr.forEach((elem) => {
        if (elem.includes("TBA")) {//delete courses/discussions that have no meeting time from course array
            const elemIdx = courseArr.indexOf(elem);
            courseArr.splice(elemIdx - 1, 3);
        }
    })
    courseArr.forEach((elem) => {
        if (elem instanceof Array) {
            const elemIdx = courseArr.indexOf(elem);
            courseArr[elemIdx] = parseCourseDayTime(courseArr[elemIdx]);
        }
    })

    courseArr.forEach((elem) => {
        if (elem == "Lec") {
            const elemIdx = courseArr.indexOf(elem);
            courseArr[elemIdx] = "Lecture";
        } else if (elem == "Dis") {
            const elemIdx = courseArr.indexOf(elem);
            courseArr[elemIdx] = "Discussion";
        }
    })

    if (courseArr.length > 1) {
        await importCourseIntoGoogleCalendar(courseArr, token);
    }
}

//format the course day and time so that it is readable by Google Calendar API
function parseCourseDayTime(timeArr) {
    let formattedDaysStr = "";

    //parse course day
    for (let i = 0; i < timeArr[0].length; i++) {
        if (timeArr[0].charAt(i) == "M") {
            formattedDaysStr += "MO,";
        } else if (timeArr[0].charAt(i) == "W") {
            formattedDaysStr += "WE,";
        } else if (timeArr[0].charAt(i) == "F") {
            formattedDaysStr += "FR,";
        } else if (
            timeArr[0].charAt(i) == "T" &&
            timeArr[0].charAt(i + 1) != "h"
        ) {
            formattedDaysStr += "TU,";
        } else if (
            timeArr[0].charAt(i) == "T" &&
            timeArr[0].charAt(i + 1) == "h"
        ) {
            formattedDaysStr += "TH,";
        } else {
            continue;
        }
    }

    //remove trailing comma from formattedDaysStr
    formattedDaysStr = formattedDaysStr.slice(
        0,
        formattedDaysStr.length - 1
    );

    timeArr[0] = formattedDaysStr;
    timeArr[1] = parseCourseTime(timeArr[1]);
    timeArr[2] = parseCourseTime(timeArr[2]);
    return timeArr;
}

//convert time of course to Google Calendar API time format
//9:30am -> 09:30:00-7:00
//12:00pm -> 12:00:00-7:00
//5:00pm -> 17:00:00-7:00
//6:15 pm -> 18:15:00-7:00
function parseCourseTime(time) {
    let formattedTime = time;
    if (time.endsWith("am")) {
        if (time.slice(0, 1) !== "1") {
            //check if time is not 10:00am, 11:00am, or 12:00am
            formattedTime = "0" + time;
        }
    } else if (time.endsWith("pm")) {
        if (time.slice(0, 2) !== "12") {
            //check if time is past 12 pm
            formattedTime = (parseInt(time.slice(0, 1)) + 12).toString(); //1 -> "13", 2, -> "14", 5 -> "17", etc.
            formattedTime += time.slice(1, 4) + ":00-05:00";
            return adjustToDaylightSavingsTime(formattedTime);
        }
    }

    //remove "am" or "pm" from end of time string
    //EST has offset of 5 hours from UTC (Coordinated Universal Time)
    formattedTime =
        formattedTime.slice(0, formattedTime.length - 2) + ":00-05:00";
    return adjustToDaylightSavingsTime(formattedTime);
}

//Bug fix: 4/20/24
//For Summer and Fall Semesters, the formattedTime is shifted back 1 hour to account for Daylight Savings (due to bug with Google Calendar that shifts all events after Daylight
//Savings time forward by 1 hour)
//09:30:00-5:00 -> 08:30:00-5:00
//12:00:00-5:00 -> 11:00:00-5:00
//17:00:00-5:00 -> 16:00:00-5:00
//18:15:00-5:00 -> 17:15:00-5:00
function adjustToDaylightSavingsTime(formattedTime) {
    if (currSemester.includes("Summer") || currSemester.includes("Fall")) {
        let formattedHour = "";
        if (formattedTime.slice(0, 1) !== "1") {
            //condition for course times from 7 am (inclusive) - 9 am (inclusive) where the hour has 1 digit
            formattedHour = parseInt((formattedTime.slice(1, 2)) - 1).toString();
        } else {
            //condition for course times from 10 am (inclusive) to 7 pm (inclusive) where the hour (in gcal api formatted time 
            //has 2 digits
            formattedHour = parseInt((formattedTime.slice(0, 2)) - 1).toString();
        }
        formattedTime = formattedHour + formattedTime.slice(2);
    }
    return formattedTime;
}

async function importCourseIntoGoogleCalendar(courseArr, token) {
    const colorId = getColorId();//each course component (lecture and discussion) will have the same background color
    courseArr.forEach(async (elem) => {
        if (elem instanceof Array) {
            const elemIdx = courseArr.indexOf(elem);//idx of array with day and time of classes
            const currSemesterStartDay = getCurrSemesterStartDate();

            //create an event for each lecture, discussion, or lab
            await createEvent(token, colorId, currSemesterStartDay, courseArr[0], courseArr[elemIdx], courseArr[elemIdx - 1], courseArr[elemIdx + 1])
        }
    })
}

function getColorId() {
    let colorId = ""
    if (colorCount == 1) {
        colorId = "1";
    } else if (colorCount == 2) {
        colorId = "2";
    } else if (colorCount == 3) {
        colorId = "3";
    } else if (colorCount == 4) {
        colorId = "4";
    } else if (colorCount == 5) {
        colorId = "5";
    } else if (colorCount == 6) {
        colorId = "6";
    } else if (colorCount == 7) {
        colorId = "7";
    } else if (colorCount == 8) {
        colorId = "8";
    } else if (colorCount == 9) {
        colorId = "9";
    } else if (colorCount == 10) {
        colorId = "10";
    } else {
        colorId = "11";
    }
    colorCount++;
    return colorId;
}
//courseFormat - Lecture, Discussion, or Lab
async function createEvent(token, colorId, currSemesterStartDay, courseName, courseTime, courseFormat, courseLocation) {
    const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${API_KEY}`;
    const currSemesterEndDate = getCurrSemesterEndDate();
    const eventDetails = {
        summary: courseName + " " + courseFormat,
        location: courseLocation,
        colorId: colorId,
        start: {
            dateTime: `${currSemesterStartDay}T${courseTime[1]}`,
            timeZone: 'America/New_York',
        },
        end: {
            dateTime: `${currSemesterStartDay}T${courseTime[2]}`,
            timeZone: 'America/New_York',
        },
        recurrence: [
            `RRULE:FREQ=WEEKLY;UNTIL=${currSemesterEndDate};BYDAY=${courseTime[0]}`
        ],
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
            },
            body: JSON.stringify(eventDetails),
        });

        if (response.ok) {
            console.log(courseName + ' added to the calendar successfully!');
        } else {
            const errorData = await response.json();
            console.error(`Failed to add ${courseName} to the calendar:`, errorData.error.message);
        }
    } catch (error) {
        console.error(`Error adding ${courseName} to the calendar:`, error);
    }
}

function getCurrSemesterStartDate() {
    let startDate = "";
    if (currSemester == "Fall 2023") {
        startDate = "2023-08-28";
    } else if (currSemester == "Winter 2024") {
        startDate = "2024-01-02";
    } else if (currSemester == "Spring 2024") {
        startDate = "2024-01-24";
    } else if (currSemester == "Summer I 2024") {
        startDate = "2024-05-28";
    } else if (currSemester == "Summer II 2024") {
        startDate = "2024-07-08";
    } else if (currSemester == "Fall 2024") {
        startDate = "2024-08-26";
    } else if (currSemester == "Winter 2025") {
        startDate = "2025-01-02";
    } else if (currSemester == "Spring 2025") {
        startDate = "2025-01-27";
    } else if (currSemester == "Summer I 2025") {
        startDate = "2025-06-02";
    } else if (currSemester == "Summer II 2025") {
        startDate = "2025-07-14";
    } else {
        //Fall 2025 (and beyond?)
        startDate = "2025-09-02";
    }

    currSemesterStartYear = getCurrSemesterStartYear(startDate);
    currSemesterStartMonth = getCurrSemesterStartMonth(startDate);
    currSemesterStartDay = getCurrSemesterStartDay(startDate);
    return startDate;
}

function getCurrSemesterStartYear(startDate) {
    return startDate.slice(0, 4);
}

function getCurrSemesterStartMonth(startDate) {
    return startDate.substr(6, 1);
}

function getCurrSemesterStartDay(startDate) {
    return startDate.substring(startDate.length - 2, startDate.length);
}

function getCurrSemesterEndDate() {
    let currSemesterEndDate = "";
    if (currSemester == "Fall 2023") {
        currSemesterEndDate = "20231212"
    } else if (currSemester == "Winter 2024") {
        currSemesterEndDate = "20240123"
    } else if (currSemester == "Spring 2024") {
        currSemesterEndDate = "20240510"
    } else if (currSemester == "Summer I 2024") {
        currSemesterEndDate = "20240706"
    } else if (currSemester == "Summer II 2024") {
        currSemesterEndDate = "20240817"
    } else if (currSemester == "Fall 2024") {
        currSemesterEndDate = "20241210"
    } else if (currSemester == "Winter 2025") {
        currSemesterEndDate = "20250123"
    } else if (currSemester == "Spring 2025") {
        currSemesterEndDate = "20250514"
    } else if (currSemester == "Summer I 2025") {
        currSemesterEndDate = "20250712"
    } else if (currSemester == "Summer II 2025") {
        currSemesterEndDate = "20250823"
    } else {//Fall 2025 (and beyond?)
        currSemesterEndDate = "20251213"
    }
    return currSemesterEndDate;
}

//the purpose of this function is to delete the instances of courses/dicussions in the
//first day of the semester that shouldn't be there
//it enables the extension to support multiple semesters (Fall 2023 to Fall 2025)
async function cleanUpFirstDayOfClasses(token) {
    const firstDayStart = getCurrSemesterStartDate() + "T07:00:00-05:00"; // 7 am EST
    const firstDayEnd = getCurrSemesterStartDate() + "T22:00:00-05:00"; // 10 pm EST
    const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${API_KEY}&timeMin=${firstDayStart}&timeMax=${firstDayEnd}`;
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
            },
        });

        if (response.ok) {
            const eventData = await response.json();
            const firstDayEvents = eventData.items;
            const firstDayIdx = new Date(firstDayStart).getDay();
            const dayNames = ["SUN", "MO", "TU", "WE", "TH", "FR", "SAT"];
            const firstDay = dayNames[firstDayIdx];

            for (const event of firstDayEvents) {//iterate through each event on the first day of the semester
                let recurStr = event.recurrence[0].toString();
                const subStr = "BYDAY";
                const subStrIdx = recurStr.indexOf(subStr);
                const byDayStr = recurStr.substr(subStrIdx);
                if (!byDayStr.includes(firstDay)) {
                    await getFirstInstance(token, event.id);
                }
            }
        } else {
            const errorData = await response.json();
            console.error('Failed to fetch events:', errorData.error.message);
        }
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

async function getFirstInstance(token, eventId) {//necessary to get the instanceId
    const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}/instances?maxResults=1&key=${API_KEY}`;
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
            },
        });

        if (response.ok) {
            const eventData = await response.json();
            const firstInstance = eventData.items[0];
            const firstInstanceStartTime = firstInstance.start.dateTime;
            const firstInstanceEndTime = firstInstance.end.dateTime;
            const instanceId = firstInstance.id;
            await cancelFirstInstance(token, instanceId, firstInstanceStartTime, firstInstanceEndTime);
        } else {
            const errorData = await response.json();
            console.error('Failed to fetch instances:', errorData.error.message);
        }
    } catch (error) {
        console.error('Error fetching instances:', error);
    }
}

async function cancelFirstInstance(token, instanceId, startTime, endTime) {
    const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${instanceId}?key=${API_KEY}`;
    const eventToDelete = {
        start: {
            dateTime: startTime,
            timeZone: 'America/New_York',
        },
        end: {
            dateTime: endTime,
            timeZone: 'America/New_York',
        },
        status: 'cancelled'
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
            },

            body: JSON.stringify(eventToDelete)
        });

        if (response.ok) {
            console.log('Instance cancelled successfully:', instanceId);
        } else {
            const errorData = await response.json();
            console.error('Failed to cancel instance:', errorData.error.message);
        }
    } catch (error) {
        console.error('Error cancelling instance:', error);
    }
}

const API_KEY = "AIzaSyBG641ft-K02Iw3uLY4ALnV4bMj3CNXuB8";
let calendarId;
let currSemester;
chrome.runtime.onMessage.addListener(async function (request) {
    if (request.action === 'performTasksAfterAuthorization') {
        const token = request.token;
        await createNewCalendar(token);
        await getScheduleData(token);
        window.close();//close Testudo (current window)
        window.open("https://calendar.google.com/calendar/u/0/r") //end of application
    }
});

async function createNewCalendar(token) {
    const apiUrl = `https://www.googleapis.com/calendar/v3/calendars?key=${API_KEY}`
    const courseCalendar = {
        summary: "UMD Sp24 Course Schedule",
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
async function getScheduleData(token) {
    await new Promise((r) => setTimeout(r, 3000)); //wait for Testudo to load as it is often under heavy traffic
    currSemester = document.querySelector("span.header-dropdown-label").innerText;
    console.log(currSemester);
    let studentCourses = document.querySelectorAll(".course-card-container--info");
    if (studentCourses.length > 0) {
        let count = 0;
        for (const course of studentCourses) {
            parseCourse(studentCourses[count].innerText, token);
            count++;
        }
    } else {
        alert("You are not registered for any classes this semester.");
    }
}

function parseCourse(course, token) {//format schedule data so that is readable by the Google Calendar API
    let courseArr = course.split("\n")
    courseArr.splice(1, 1);
    courseArr[0] = courseArr[0].slice(0, courseArr[0].length - 6);//remove section number from course
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
        importCourseIntoGoogleCalendar(courseArr, token);
    }
}

//format the course day and time so that it is readable by Google Calendar API
function parseCourseDayTime(timeArr) {
    let newArr = timeArr;
    if (newArr[0] == "MWF") {
        newArr[0] = "MO,WE,FR";
    } else if (newArr[0] == "MW") {
        newArr[0] = "MO,WE";
    } else if (newArr[0] == "TTh") {
        newArr[0] = "TU,TH"
    } else if (newArr[0] == "M") {
        newArr[0] = "MO"
    } else if (newArr[0] == "T") {
        newArr[0] = "TU"
    } else if (newArr[0] == "W") {
        newArr[0] = "WE"
    } else if (newArr[0] == "Th") {
        newArr[0] = "TH"
    } else {
        newArr[0] = "FR"
    }

    newArr[1] = parseCourseTime(newArr[1]);
    newArr[2] = parseCourseTime(newArr[2]);
    return newArr;
}

//9:30am -> 09:30:00-7:00
//12:00pm -> 12:00:00-7:00
//5:00pm -> 17:00:00-7:00
//6:15 pm -> 18:15:00-7:00
function parseCourseTime(time) {
    let formattedTime = time;
    if (time.endsWith("am")) {
        if ((time.slice(0, 1)) != "1") {//check if time is not 10:00am, 11:00am, or 12:00am
            formattedTime = "0" + time;
        }
    } else if (time.endsWith("pm")) {
        if ((time.slice(0, 2)) != "12") {//check if time is past 12 pm
            formattedTime = (parseInt(time.slice(0, 1)) + 12).toString()//1 -> "13", 2, -> "14", 5 -> "17", etc.
            formattedTime += time.slice(1, 4) + ":00-05:00";
            return formattedTime;
        }
    }
    formattedTime = formattedTime.slice(0, formattedTime.length - 2) + ":00-05:00"; //EST has offset of 5 hours from UTC (Coordinated Universal Time)
    return formattedTime;
}

async function importCourseIntoGoogleCalendar(courseArr, token) {
    const colorId = (Math.floor(Math.random() * 11) + 1).toString();//each course component (lecture and discussion) will have the same background color
    courseArr.forEach(async (elem) => {
        if (elem instanceof Array) {//create an event for each lecture, discussion, or lab
            const elemIdx = courseArr.indexOf(elem);
            const courseFirstDay = getCourseStartDate(courseArr[elemIdx]);
            await createEvent(token, colorId, courseFirstDay, courseArr[0], courseArr[elemIdx], courseArr[elemIdx - 1], courseArr[elemIdx + 1])
        }
    })
}

//courseFormat - Lecture, Discussion, or Lab
async function createEvent(token, colorId, courseFirstDay, courseName, courseTime, courseFormat, courseLocation) {
    const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${API_KEY}`;
    const semesterEndDate = getSemesterEndDate();
    const eventDetails = {
        summary: courseName + " " + courseFormat,
        location: courseLocation,
        colorId: colorId,
        start: {
            dateTime: `${courseFirstDay}T${courseTime[1]}`,
            timeZone: 'America/New_York',
        },
        end: {
            dateTime: `${courseFirstDay}T${courseTime[2]}`,
            timeZone: 'America/New_York',
        },
        recurrence: [
            `RRULE:FREQ=WEEKLY;UNTIL=${semesterEndDate};BYDAY=${courseTime[0]}`
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

function getCourseStartDate(courseDayTimeArr) {
    let startDate;
    if (currSemester == "Spring 2024") {
        if (courseDayTimeArr[0] == "MO,WE,FR" || courseDayTimeArr[0] == "MO,WE"
            || courseDayTimeArr[0] == "WE") {
            startDate = "2024-01-24"
        } else if (courseDayTimeArr[0] == "TU,TH" || courseDayTimeArr[0] == "TH") {
            startDate = "2024-01-25"
        } else if (courseDayTimeArr[0] == "FR") {
            startDate = "2024-01-26"
        } else if (courseDayTimeArr[0] == "MO") {
            startDate = "2024-01-29"
        } else {//courseDayTimeArr[0] == "TU"
            startDate = "2024-01-30";
        }
    }
    return startDate;
}

function getSemesterEndDate(){
    let semesterEndDate;
    if(currSemester == "Spring 2024"){
        semesterEndDate = "20240510"
    }
    return semesterEndDate;
}
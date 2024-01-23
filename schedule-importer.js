chrome.runtime.onMessage.addListener(async function (request) {
    if (request.action === 'performTasksAfterAuthorization') {
        await getScheduleData();
    }
});

async function getScheduleData() {
    await new Promise((r) => setTimeout(r, 3000)); //wait for Testudo to load as it is often under heavy traffic
    let studentCourses = document.querySelectorAll(".course-card-container--info");
    if (studentCourses.length > 0) {
        let count = 0;
        for (const course of studentCourses) {
            parseCourse(studentCourses[count].innerText);
            count++;
        }
    } else {
        alert("You are not registered for any classes this semester.");
    }
}

function parseCourse(course) {//format schedule data so that is readable by the Google Calendar API
    let courseArr = course.split("\n")
    courseArr.splice(1, 1);
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

    console.log(courseArr);
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
            formattedTime += time.slice(1, 4) + ":00-7:00";
            return formattedTime;
        }
    }
    formattedTime = formattedTime.slice(0, formattedTime.length - 2) + ":00-07:00"; //offset of 7 hours from UTC (Coordinated Universal Time)
    return formattedTime;
}


function importCourseIntoGoogleCalendar(course) {

}


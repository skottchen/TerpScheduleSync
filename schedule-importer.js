async function getScheduleData() {
    let studentCourses;
    return new Promise((resolve) => {
        setTimeout(() => {//wait for Testudo to load
            studentCourses = document.querySelectorAll(".course-card-container--info");
            console.log(studentCourses);
            resolve("Schedule data successfully scraped!");
        }, "3000");
    }).then(() => {
        let count = 0;
        for (const course of studentCourses) {
            console.log(studentCourses[count].innerText);
            count++;
        }
    }
    )
}

getScheduleData();
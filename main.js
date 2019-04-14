

let returnNewHeader = function (content) {
    let newHeader = document.createElement("th");
    newHeader.className = "esg-table-head__th esg-table-head__th--10 group-credits text-align-right border-bottom-no-thickness";
    newHeader.innerHTML = "<span>" + content + "</span>";
    return newHeader;
}
   
let returnNewCell = function (content) {
    let newCell = document.createElement("td");
    newCell.className = "esg-table-body__td";
    let newSpan = document.createElement("span");
    newSpan.innerHTML = content;
    newCell.appendChild(newSpan);
    return newCell;
}

//returns teachers based on semester and course
let getSemesterTeachers = (course, semester) => {
    
    let d = new Date();
    let year = semester == "spring" ? d.getFullYear() + 1 : d.getFullYear();
    
    let url = "https://slatepermutate.org/auto.cgi?getsections=1&term=" + course + "&school=calvin&semester=" + year + "_" + semester;
    return new Promise(function (resolve, reject) {
        fetch(url).then((resp) => {

            if (resp.statusText == "Not Found") {

                reject("Not Found");
            }
            resp.json().then(data => {
                let semTeachers = data.sections.map((item) => {
                    return { instructor: item.instructor, rating: null, section: item.section, id: null }
                });
                resolve(semTeachers);
            }).catch(err => reject(err));

        }).catch(err => reject(err));
    }).catch(err => err);
};

//returns list of teachers each in their own semester element
let getTeachers = (course) => {
    return new Promise((resolve, reject) => {
        let seqSemester = [
            getSemesterTeachers(course, "spring"),
            getSemesterTeachers(course, "fall")
        ];
        
        Promise.all(seqSemester).then((resp) => {
            let teachers = [];

            let total = resp[0].concat(resp[1]);
            let names = [];
            total.forEach(item => {
                if (!names.includes(item.instructor) && !(item == "Not Found")) {
                    teachers.push(item);
                    names.push(item.instructor);
                }
            });
            //return concat of both semesters if lists exist, otherwise check if list is empty
            resolve(teachers);
        }).catch;
    });
}

//@params: name
//returns: id
let getTeacherID = (teacher) => {
    return new Promise((resolve, reject) => {
        let searchString = "/ShowRatings.jsp?tid=";
        let names = teacher.instructor.split(" ");
        let first = names[0]
        let second = names[1];

        if (names.length > 2) {
            //if middle name exists, exclude it
            if (names[1].includes(".")) {
                second = names[2];
            //if no middle name, include each part
            } else {
                second = names[1] + "+" + names[2];
            }
        }
    
        let url = "http://www.ratemyprofessors.com/search.jsp?query=" + first + "+" + second + "+Calvin+College";
        fetch(url).then(data => {
            if (data.status == 200) {
                data.text().then(data => {
                    let i = data.indexOf(searchString);
                    if (i == -1) {
                        teacher.id = "NF";
                    }
                    let firstNumIndex = searchString.length + i;
                    let generalCapture = data.substring(firstNumIndex, firstNumIndex + 20);

                    let lastIndex = generalCapture.indexOf("\"");
                    if (lastIndex == -1) {
                        teacher.id = "NF";
                    } else {
                        teacher.id = +generalCapture.substring(0, lastIndex);
                    }
                    resolve(teacher);
                });
            } else {
                teacher.id = "NF";
            }           

        }).catch((error) => {
            reject(error);
        });
    });
};

//@params: id
//returns review
let getTeacherReview = (teacher) => {
    return new Promise((resolve, reject) => {
        //TODO, figure out how to reject without causing errors
        if (teacher.id == "NF") { teacher.rating = "NF"; resolve(teacher); };

        let url = "https://www.ratemyprofessors.com/ShowRatings.jsp?tid=" + teacher.id;
        let searchString = "Overall Quality";
        fetch(url).then((data) => {
            
            if (data.status == 200) {
                data.text().then(text => {
                    let i = text.indexOf(searchString);
                    if (i > -1) {
                        let broadCapture = text.substring(i, i + 100);
                        let specificSearch = "<div class=\"grade\" title=\"\">";
                        let j = broadCapture.indexOf(specificSearch);
                        if (j > -1) {
                            let firstIndex = j + specificSearch.length;
                            let lastIndex = firstIndex + 3;
                            let rating = broadCapture.substring(firstIndex, lastIndex);
                            
                            
                            teacher.rating = +rating;
                            resolve(teacher);
                        }
                    } else {
                        teacher.rating = "NF";
                        resolve(teacher);
                    }
                });
            } else {
                teacher.rating = "NF";
                resolve(teacher);
            }
            
            
        });
    });
};


//@params: array: { rating: Number, ... }
//returns: teacher info with highest rating
let getBest = (teachers) => {
    return teachers.reduce((max, current) => current.rating > max.rating ? current : max);
}

//@params: trow DOM object
//returns: function with best teacher as argument
//Postcondition: trow contains best rating, best teacher, and best teacher's section
let updateRow = (trow) => {
    return function (best) {
        if (best.rating != "NF") {
            trow.appendChild(returnNewCell(best.rating));
            trow.appendChild(returnNewCell(best.section));
            trow.appendChild(returnNewCell(best.instructor));
        }
    }    
}


let getReviews = (teachers) => {
    return new Promise((resolve, reject) => {
        let tPromises = [];
        teachers.forEach((teacher) => {
            let seqTeacher = [
                getTeacherID,
                getTeacherReview,
            ];
            tPromises.push(seqTeacher.reduce((prev, next) => {
                return prev.then(next);
            }, Promise.resolve(teacher)));
        });
        Promise.all(tPromises).then(data => { resolve(data) }).catch(err => { alert(err) });
    });
}


let getBestTeacher = function (courseID, trow) {
    let seqCourse = [
        getTeachers,
        getReviews,
        getBest,
        updateRow(trow),
    ];
    seqCourse.reduce((prev, next) => {
        return prev.then(next);
    }, Promise.resolve(courseID));

}   




var theadList = Array.from(document.getElementsByTagName("thead"));
theadList.forEach((tHead, index, array) => {
    tHead.children[0].appendChild(returnNewHeader("Best Rating"));
    tHead.children[0].appendChild(returnNewHeader("Best Section"));
    tHead.children[0].appendChild(returnNewHeader("Best Teacher"));
});

var tbodyList = Array.from(document.getElementsByTagName("tbody"));
tbodyList.forEach(function(tbody, index, array) {
    let trows = Array.from(tbody.children);
    trows.forEach(function (trow) {
        try {
            let courseString = trow.children[1].children[0].children[0].innerHTML;
            let courseParts = courseString.split("-");
            getBestTeacher(courseParts.join(""), trow);            
        } catch (err) {
        }
        
    });
    
});

//*/

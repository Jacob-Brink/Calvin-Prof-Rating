let redundant_count = 0;
//Set that doesn't allow duplicate instructors

class uniqueTeacher extends Set {
    add(item, course) {
        let duplicate = false;
        let duplicate_in_course = false;
        let teacherObj;
        this.forEach((value, valueAgain, set) => {
            if (item.getName() == value.getName()) {
                duplicate = true;
                teacherObj = value;
                value.returnCourses().forEach(c => {
                    if (c == course) {
                        //marker for knowing whether or not to push teacher to course promise list
                        duplicate_in_course = true;
                    };
                });
                if (!duplicate_in_course) {
                    value.addCourse(course);
                };
                //value.addCourse(item.course);
            }
        });
        //package result
        function returnObj(obj, teacherIsNew) {
            return { 'teacher': obj, 'new': teacherIsNew, 'duplicate_in_course': duplicate_in_course };
        };

        if (!duplicate) {
            super.add(item);
            return returnObj(item, true);
        } else {
            return returnObj(teacherObj, false);
        }
    };
};

class Teacher {
    constructor(name, course) {
        this._courses = new Set([course]);
        this._name = name;
        this._searchableNames = this.returnFirstLastName();
    }
    //make it easy to search with url a person's name by converting it into a list
    returnFirstLastName() {
        let names = this._name.split(" ");
        //remove middle names and surnames, e.g: jr., P., Sr.
        names = names.filter(piece => {
            
            if (!piece.includes(".")) {
                return true;
            };
            return false;
        });
        return names;
    }
    //check if variable is undefined
    notSet(variable) {
        return variable == undefined;
    };

    //courses return and add
    returnCourses() {
        return this._courses;
    }
    addCourse(course) {
        this._courses.add(course);
    }

    //get name
    getName() {
        return this._name;
    }

    //get searchableNames
    getSearchableNames() {
        return this._searchableNames;
    }

    //rating getter, setter
    set rating(rating) {
        if (this.notSet(this._rating)) {
            this._rating = ((rating <= 5) && (rating > 0)) ? rating : this._rating;
        } else {
            throw Error("Rating set more than once for the same teacher");
        }
    }
    get rating() {
        return this._rating;
    }

    //id getter, setter
    set id(id) {
        if (this.notSet(this._id)) {
            this._id = id;
        } else {
            throw Error("ID set more than once for the same teacher");
        }
    }
    get id() {
        return this._id;
    }
}

//total amount of teachers
let teachersSearched = new uniqueTeacher();

//course list to row list
let courseToRow = {};

//returns header element
let returnNewHeader = function (content) {
    let newHeader = document.createElement("th");
    newHeader.className = "esg-table-head__th esg-table-head__th--10 group-credits text-align-right border-bottom-no-thickness";
    newHeader.innerHTML = "<span>" + content + "</span>";
    return newHeader;
}

//returns row element
let returnNewCell = function (content) {
    let newCell = document.createElement("td");
    newCell.className = "esg-table-body__td";
    let newSpan = document.createElement("span");
    newSpan.innerHTML = content;
    newCell.appendChild(newSpan);
    return newCell;
}

//go through teachers
//if teacher already exists in global set, don't do anything
//if teacher doesn't yet exist, add to list and research teacher
//works only if object references are not lost
let handleData = (rawData, course) => {
    let tPromises = [];
    //forEach course Section
    rawData.sections.forEach(item => {
        let teacherObj = new Teacher(item.instructor, course);//{ instructor: item.instructor, rating: null, section: item.section, id: null, searched: false };

        //A bit complicated, but the only way to tell if duplicates exist and if they do to have a course have a reference to that object
        let addedResult = teachersSearched.add(teacherObj, course);
        //returns reference to teacher object in set, whether or not newly added.
        let actualTeacherObj = addedResult['teacher'];

        //logic for whether to engage in researching teacher, not researching teacher, yada yadayah
        if (addedResult['new']) {
            //RESEARCH teacher then RESOLVE
            tPromises.push(getTeacherID(actualTeacherObj)
                .then(getTeacherReview).catch((err) => {
                    return Promise.resolve(actualTeacherObj);
                }).then(teacher => { return teacher; })
            );
        } else {
            //if not duplicate in same course, then add to action list
            //otherwise, do nothing
            if (!addedResult['duplicate_in_course']) {
                tPromises.push(Promise.resolve(actualTeacherObj));
            }
        }
    });
    return tPromises;
};

//returns list of promises containing teachers as result
let getSemesterTeachers = (course, semester) => {
    let d = new Date();
    let year = semester == "spring" ? d.getFullYear() + 1 : d.getFullYear();
    let url = "https://slatepermutate.org/auto.cgi?getsections=1&term=" + course + "&school=calvin&semester=" + year + "_" + semester;
    return fetch(url).then(resp => {
        if (resp.status == 200 || resp.status == 304) {
            if (resp.statusText == "Not Found") {
                return "CNF";
            }
            return resp.json();
        } else {
            return "CNF";
        }
    })
    .then(data => {
        if (data != "CNF") {
            return handleData(data, course);
        } else {
            return [];
        }
    }).catch(err => { return err; });
};

//returns list of teachers each in their own semester element
let getTeachers = (course) => {
    let springActions = getSemesterTeachers(course, "spring");
    let fallActions = getSemesterTeachers(course, "fall");
                
    return Promise.all([springActions, fallActions]).then(teachersResearched => {

        let teacherCourseArray = [];

        teachersResearched.forEach(teacherSemArray => {
            if (teacherSemArray != "CNF") {
                teacherCourseArray = teacherCourseArray.concat(teacherSemArray);
            } 
        });
        return teacherCourseArray;

    }).catch(err => {
        console.log(err);
    }).then(teachersPromises => {
        //unpack each teacher promise
        return Promise.all(teachersPromises).then(teachers => {
            return { teachers: teachers, course: course };
        }).catch(err => {
            throw err;
        });

     });       
};

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  //returns: id
let getTeacherID = (teacher) => {
    
    let formattedName = teacher.getSearchableNames().join("+");
    let url = "http://www.ratemyprofessors.com/search.jsp?query=" + formattedName + "+Calvin+College";
        
    return fetch(url).then(data => {
        if (data.status == 200) {
            return data.text();
        } else {
            return "NF";
        }
    })
    .then(data => {
        try {
            let searchString = "/ShowRatings.jsp?tid=";
            let i = data.indexOf(searchString);
            if (i != -1) {
                //general capture done because id number length varies
                let firstNumIndex = searchString.length + i;
                let generalCapture = data.substring(firstNumIndex, firstNumIndex + 20);

                let lastIndex = generalCapture.indexOf("\"");
                if (lastIndex != -1) {
                    try {
                        teacher.id = +generalCapture.substring(0, lastIndex);
                    } catch (err) {
                        console.log(err);
                    }

                }
            }
        } catch (err) {
            console.log(err);
        }
        //return teacher object given modified or unmodified
        return teacher;
    }).catch(err => {
        return teacher;
    });
};

//@params: id
//returns review
let getTeacherReview = (teacher) => {

    let url = "https://www.ratemyprofessors.com/ShowRatings.jsp?tid=" + teacher.id;
        
    return fetch(url).then((data) => {

        if (data.status == 200) {
            return data.text();
        } else {
            return "NF";
        }
    })
    .then(text => {
        let searchString = "Overall Quality";
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
            }
        }
        //return teacher object given modified or unmodified
        return teacher;
    }).catch(err => {
        return teacher;
    });
};

//@params: array: { rating: Number, ... }
//returns: teacher info with highest rating
let getBest = (teachers) => {
    let noRatings = 0;
    let bestTeacher = teachers.reduce((max, current) => {
        if (current.rating == null) {
            noRatings += 1;
        };
        return current.rating > max.rating ? current : max;
    });
    return { best: bestTeacher, courseTeachersNum: teachers.length, RatedTeachersNum: teachers.length - noRatings };
}


//@params: trow DOM object
//returns: function with best teacher as argument
//Postcondition: trow contains best rating, best teacher, and best teacher's section
let updateRow = (trow, best) => {
    if (best.best.rating != null) {
        trow.appendChild(returnNewCell(best.best.rating));
        trow.appendChild(returnNewCell(best.best.getName()));
        trow.appendChild(returnNewCell(best.RatedTeachersNum + " / " + best.courseTeachersNum));
    }
        
}

var theadList = Array.from(document.getElementsByTagName("thead"));
theadList.forEach((tHead, index, array) => {
    tHead.children[0].appendChild(returnNewHeader("Best Rating"));
    tHead.children[0].appendChild(returnNewHeader("Best Teacher"));
    tHead.children[0].appendChild(returnNewHeader("Rated / Total"));
});


function returnCourseID(row) {
    let courseString = row.children[1].children[0].children[0].innerHTML;
    let courseParts = courseString.split("-");
    return courseName = courseParts.join("");
}

function main() {
    var tbodyList = Array.from(document.getElementsByTagName("tbody"));
    let teacherCourses = [];
    
    tbodyList.forEach(function (tbody, index, array) {
        let trows = Array.from(tbody.children);
        
        trows.forEach(trow => {
            try {
                let course = returnCourseID(trow);
                if (course != undefined) {
                    if (courseToRow[courseName]) {
                        let rowArr = courseToRow[courseName];
                        rowArr.push(trow);
                    } else {
                        let newRowArr = [];
                        newRowArr.push(trow);
                        courseToRow[courseName] = newRowArr;
                    }

                    let teachers = getTeachers(course);
                    teacherCourses.push(teachers);
                }
                
            } catch (err) {
                //console.log(err);
            }
        });
    });
    
    Promise.all(teacherCourses).then(totalTeachers => {
        totalTeachers.forEach(courseTeachers => {
            
            let teachers = courseTeachers.teachers;
            let course = courseTeachers.course;
            
            let rows = courseToRow[course];
            if (teachers.length > 0) {
                let bestTeacher = getBest(teachers);
                if (course == "MUSC151") {
                    console.log("MUSC151");
                    console.log(bestTeacher);
                    console.log(teachers[0].rating);
                    console.log(bestTeacher.id);
                }
                rows.forEach(row => {
                    updateRow(row, bestTeacher);
                });
            };
        });
    }).catch(err => {
        console.log(err);
    });;
    
    
};
main();
// JavaScript source code
//Error function from stack overflow https://stackoverflow.com/questions/15313418/what-is-assert-in-javascript
function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            console.log(Error);
        }
        console.log("Assertion Error: " + message); // Fallback
    }
}

function equals(val1, val2) {
    if (val1 != val2) {
        console.log("Assertion Error: " + val1 + " does not equal " + val2);
    }
}

console.log("=============================================================");

//tests
//successful
getSemesterTeachers("CS112", "spring").then((data) => {
    equals(data.length, 2);
    equals(data[0].instructor, "Joel Adams");
    equals(data[1].instructor, "Victor T. Norman");
    console.log("getSemesterTeachers: passed!");
}).catch((err) => {
    assert(false);
});

//unsuccessful
/*
getSemesterTeachers("CSffffffffffffffffffff112", "spring").then((data) => {
    assert(false);
}).catch((err) => {
    
    equals(err, "Not Found");
    console.log("2");
});

//apparently slate permutate returns data even when some params make no sense

getSemesterTeachers("CS112", "asdf").then((data) => {
    assert(false);
}).catch((err) => {
    assert(err == "Not Found");
    console.log("3");
});
*/


getTeachers("CS112").then((data) => {
    equals(data.length, 2);
    equals(data[0].instructor, "Joel Adams");
    equals(data[1].instructor, "Victor T. Norman");
    console.log("getTeachers: basic tests passed!");
}).catch((err) => {
    assert(false);
});

getTeachers("SPAN202").then((data) => {
   // console.log(data);
    equals(data.length, 3);
    equals(data[0].instructor,"Scott Lamanna");
    equals(data[1].instructor,"Maria Rodriguez");
    equals(data[2].instructor,"Alisa Tigchelaar");
    console.log("getTeachers: restricted semester course test Passed!");
}).catch((err) => {
    assert(false);
    });//*/

//getTeacherID tests
getTeacherID({ instructor: "Joel Adams", section: "A", rating: null, id: null }).then(data => {
    equals(data.id, 46432);
    equals(data.instructor, "Joel Adams");
    equals(data.rating, null);
    equals(data.section, "A");
    console.log("getTeacherID: successful case passed!");
}).catch(err => assert(false));

getTeacherID({ instructor: "Garth Pauley", section: "B", rating: null, id: null }).then(data => {
    equals(data.id, 102101);
    equals(data.instructor, "Garth Pauley");
    equals(data.section, "B");
    equals(data.rating, null);
    console.log("getTeacherID: Pauley passed!");
});

getTeacherID({ instructor: "asdfasdfasdfasdfasdf fff", section: "A", rating: null, id: null }).then(data => {
    equals(data.id, "NF");
    equals(data.instructor, "asdfasdfasdfasdfasdf fff");
    equals(data.rating, null);
    equals(data.section, "A");
    console.log("getTeacherID: no result case passed!");
}).catch(err => assert(false));

getTeacherReview({ instructor: "Garth Pauley", section: "B", rating: null, id: 102101 }).then(data => {
    equals(data.id, 102101);    
    equals(data.instructor, "Garth Pauley");    
    equals(data.section, "B");    
    equals(data.rating, 3.0);
    console.log("getTeacherReview: Pauley passed!");
    
});

let teachers = [{ instructor: "Bob", rating: 0 }, { instructor: "Jesus", rating: 5 }, { instructor: "Nobody", rating: "NF" }];
equals(getBest(teachers).instructor, "Jesus");
equals(getBest(teachers).rating, 5);
console.log(getBest(teachers));


teachers = [
    { instructor: "Joel Adams", rating: null, section: "B", id: null },
    { instructor: "Nobody", rating: null, section: "B", id: null },
    { instructor: "John Wertz", rating: null, section: "A", id: null },
    { instructor: "Kimberley Benedict", rating: null, section: "A", id: null },
    { instructor: "Derek Schuurman", rating: null, section: "A", id: null },
];

let reviews = [3.6, "NF", 5, 5, "NF"];
        
getReviews(teachers).then(data => {
    data.forEach((teacher, index) => {
        equals(teacher.rating, reviews[index]);
    });
});

/*
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
        //wait until all teacher reviews are given before returning results
        Promises.all(tPromises).then((result) => {
            result.forEach((teacher) => {
                resolve(teacher);
            });
        });
    });
}*///
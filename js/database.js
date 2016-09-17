var testDate = 1468971000000; // Number of seconds since 1/1/1970 until start of boot camp (9/10/2016, 18:30:00 GMT-0500 (CDT))
var testDate2 = 1473523295344; // Number of seconds since 1/1/1970 until right now (9/10/2016, 11:01:33 GMT-0500 (CDT))

// var testMovieSearch = {
//     searchTerm: "mean girls",
//     numSearches: 4,
//     mostRecentSearchTime: testDate,
//     ongoingScore: 0
// }

var currentMovieObj, currentMovieObjSearches;
var searchInput;
var movieTitles;
var moviesInOrder = [];
var $twitterScore = 12.0;

// Initialize Firebase
var config = {
    apiKey: "AIzaSyBDU_oaLw-ziSFeQpxeK1EuAaz_6ufnLf4",
    authDomain: "moviesgroupproject.firebaseapp.com",
    databaseURL: "https://moviesgroupproject.firebaseio.com",
    storageBucket: "moviesgroupproject.appspot.com",
};
firebase.initializeApp(config);

var database = firebase.database();

$(document).ready(function(){
    checkMoviesInDatabase();
});


// Add Test movie search
//database.ref(testMovieSearch.searchTerm).set(testMovieSearch);

// Database Listener: Once - Grab ordered movies array from Firebase. If it doesn't exist, create a new array. Write the array to DOM as buttons.
database.ref().once("value", function(snapshot){ 
    if (snapshot.child("moviesInOrder").exists()) {
        moviesInOrder = snapshot.val().moviesInOrder;
        console.log("moviesInOrder: " + moviesInOrder);
    } 
    if (snapshot.child("movies").exists()) {
        movieTitles = Object.keys(snapshot.val().movies);
        console.log("movieTitles: " + movieTitles);
    } 
});

$("input").keypress(function(event) {
    if (event.which == 13) {
        event.preventDefault();
        event.stopImmediatePropagation();
        $("#searchRequest").click();
    }
});

// event.stopImmediatePropagation();

// Grab snapshot
function checkMoviesInDatabase() {
    database.ref().on("value", function(snapshot) {
        if (snapshot.child("movies").exists()) {
            movieTitles = Object.keys(snapshot.val().movies);  
        }
    });
}

$("#searchRequest").on("click", function() {
    searchInput = $("#movieSearch").val().toString().trim().toLowerCase();
    addSearchToDB();
    updateMovieObj(currentMovieObj);
    updateOngoingScore(currentMovieObj);
    updateMoviesInOrderArr();
    updateMoviesButtons();
    $("#movieSearch").val(""); // clear input form
});

function addSearchToDB() {
    if (movieTitles !== undefined) {
        console.log("Line 87");
        database.ref("movies").on("value", function(snapshot){
            if ((movieTitles.indexOf(searchInput) !== -1)) {
                console.log("wahhh");
                currentMovieObj = snapshot.child(searchInput).val();
            }
            else {
                currentMovieObj = {
                    searchTerm: searchInput,
                    numSearches: 0,
                    mostRecentSearchTime: Date.now(),
                    ongoingScore: 0
                }
            }
        });
    }
    else if (currentMovieObj === undefined) {
        console.log("Line 95");
        currentMovieObj = {
            searchTerm: searchInput,
            numSearches: 0,
            mostRecentSearchTime: Date.now(),
            ongoingScore: 0
        }
        console.log(currentMovieObj);
    }
    database.ref("movies/" + searchInput).set(currentMovieObj);
} 


//     database.ref().on("value", function(snapshot){
//         //If enter is pressed run database query
//         //console.log(snapshot.val()[searchInput]); // debug, validate that numSearches updates
//         console.log("line 48");
//         // If movie already in Firebase, pull that
//         //console.log(snapshot.child(searchInput).exists());
//         if (snapshot.child(searchInput).exists()) {
//             currentMovieObj = snapshot.child(searchInput).val();
//         } 
//     });
// }
        // console.log(currentMovieObj);
        // // Update the object then push to DB. 
        // console.log("outside of database call");
        // updateMovieObj(currentMovieObj);
        // ç
        // // Update moviesInOrder, push that to DB & write to DOM
        // updateMoviesInOrderArr();
        // database.ref("moviesInOrder").set(moviesInOrder);
        // updateMoviesButtons();
        // $("#movieSearch").val(""); // clear input form
        // console.log("reached the end");

// Listener: Submitted movie search, lookup the movie in our DB, adjust numSearches and mostRecentSearchTime, and grab changed movie object.
// KEY TO FIREBASE: Grab current value from DB, adjust it locally, re-write to DB

// Grab existing movie from DB, need to change (1) numSearches, (2) mostRecentSearchTime, (3) ongoingScore (separate function)
function updateMovieObj(movieObj) {
    movieObj.numSearches++;
    movieObj.mostRecentSearchTime = Date.now();
    movieObj.ongoingScore = updateOngoingScore(movieObj);
    database.ref("movies/" + searchInput).set(currentMovieObj);
}

// Calculate new ongoingScore
function updateOngoingScore(movieObj) {
    var searches = movieObj.numSearches;
    var score = movieObj.ongoingScore;
    var newScore = (((searches - 1) * score) + (1 * $twitterScore)) / searches;
    return newScore;
}

// Evaluate moviesInOrder and remove current movie from array if it exists. Then add back current movie to correct place based on numSearches
function updateMoviesInOrderArr() {
    var newMovieArrIndex = moviesInOrder.indexOf(currentMovieObj);
    var counter = 0;
    if (moviesInOrder.length === 0) {
        moviesInOrder.push(currentMovieObj);
        console.log("line 93");
    } 
    else {
        // If only 1 item in array and it's for the same movie, replace
        if ((moviesInOrder.length === 1) && (currentMovieObj.searchTerm === moviesInOrder[0].searchTerm)) {
            console.log(moviesInOrder);
            console.log("line 99");
            moviesInOrder.splice(0, 1, currentMovieObj);
            console.log(moviesInOrder);
        }
        // If only 1 item in array and it's for a different movie, evaluate which has more searches
        else if ((moviesInOrder.length === 1) && (currentMovieObj.searchTerm !== moviesInOrder[0].searchTerm)) {
            if (moviesInOrder[0].numSearches > 1) {
                console.log("line 105");
                // move to back of array b/c fewest # searches
                moviesInOrder.push(currentMovieObj);
            }
            else {
                console.log("line 110");
                // move to front of array b/c more recent
                moviesInOrder.unshift(currentMovieObj);
            }
        }
        // If more than 1 item in array, evaluate if current movie in array
        else if (moviesInOrder.indexOf(currentMovieObj) !== -1) {
            console.log(moviesInOrder);
            moviesInOrder.splice(newMovieArrIndex, 1);
            console.log(moviesInOrder);
            for (var i = 0; i < moviesInOrder.length; i++) {
                // If this numSearches for current movie >= movie at index i, insert currentMovieObj at index i. (last search time for current movie will always be more recent)
                if (currentMovieObj.numSearches >= moviesInOrder[i].numSearches){
                    console.log("line 121");
                    moviesInOrder.splice(i, 0, currentMovieObj);
                    break;
                }
                counter++;
            }
            if (counter === moviesInOrder.length) {
                console.log("line 128");
                moviesInOrder.push(currentMovieObj);
            }   
        }
        // If movie not in array, find another movie w/ numSearches === 1
        else {
            for (var j = 0; j < moviesInOrder.length; j++) {
                if (moviesInOrder[j].numSearches === 1) {
                    console.log("line 136");
                    // move to front of array b/c more recent
                    moviesInOrder.unshift(currentMovieObj);
                    break;
                }
                counter++;
            }
            if (counter === moviesInOrder.length) {
                console.log("line 144");
                // move to back of array b/c fewest # searches
                moviesInOrder.push(currentMovieObj);
            }
        }
    }
    database.ref("moviesInOrder").set(moviesInOrder);
}
// Write top 10 movies to DOM.
function updateMoviesButtons() {
    console.log(moviesInOrder);
    var arrayLen = 10;
    if (moviesInOrder.length < 10) {
        arrayLen = moviesInOrder.length;
    }
    $("#movieSearchesButtons").empty();
    for (var j = 0; j < arrayLen; j++) {
        var movieTitle = $("<button>").html(moviesInOrder[j].searchTerm).attr("class", "btn btn-primary");
        $("#movieSearchesButtons").append(movieTitle);
    }
}



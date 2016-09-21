// Initialize Firebase
// var config = {
//     apiKey: "AIzaSyBDU_oaLw-ziSFeQpxeK1EuAaz_6ufnLf4",
//     authDomain: "moviesgroupproject.firebaseapp.com",
//     databaseURL: "https://moviesgroupproject.firebaseio.com",
//     storageBucket: "moviesgroupproject.appspot.com",
// };
// firebase.initializeApp(config);

//var database = new Firebase("https://moviesgroupproject.firebaseio.com");
var currentMovieObj, searchInput, movieTitles, initialMoviesInOrder;
var moviesInOrder = [];

// When document is opened, run database listener functions
$(document).ready(function(){
    grabExistingMovies();
    initialMoviesInOrderArr();
});

// Initiate all database functions, function is executed after click and ajax call to Twitter in apiHandler.js
function databaseFunctions() {
    searchInput = $("#movieSearch").val().toString().trim().toLowerCase();
    addSearchToDB();
    updateMovieObj(currentMovieObj);
    updateOngoingScore(currentMovieObj);
    updateMoviesInOrderArr();
    updateMoviesButtons();
}

// Database Listener: Once - Grab ordered movies array from Firebase. If it doesn't exist, create a new array. Write the array to DOM as buttons.
function grabExistingMovies() {
    database.ref().once("value", function(snapshot){ 
        if (snapshot.child("movies").exists()) {
            movieTitles = Object.keys(snapshot.val().movies);
            console.log("movieTitles: " + movieTitles); // TODO remove debug
        } 
    }, function (errorObject) {
        console.log("Error: grabExistingMovies - Read failed: " + errorObject.code);
    });
}

// If API validates that the search is a movie, check if the movie is already in Firebase, & if so grab the snapshot. If not in database, create a new object.
// NOTE: Not using moment.js for the timestamp because the time is only being compared on the backend, not for the user or developer's benefit, so it doesn't need to be readable.
function addSearchToDB() {
    currentMovieObj = undefined;
    if (isValidMovie() === true){
        if (movieTitles !== undefined){
            database.ref("movies").on("value", function(snapshot){
                if ((movieTitles.indexOf(searchInput) !== -1)) {
                    currentMovieObj = snapshot.child(searchInput).val();
                }
                else {
                    currentMovieObj = {
                        searchTerm: searchInput,
                        numSearches: 1,
                        mostRecentSearchTime: Date.now(),
                        ongoingScore: 0
                    }
                }
            }, function (errorObject) {
                console.log("Error: addSearchToDB - The read failed: " + errorObject.code);
            });
        }
        else if (currentMovieObj === undefined) {
            currentMovieObj = {
                searchTerm: searchInput,
                numSearches: 1,
                mostRecentSearchTime: Date.now(),
                ongoingScore: 0
            }
        }
        database.ref("movies/" + searchInput).set(currentMovieObj);
    }
} 

// Update the values for currentMovieObj and push to Firebase
function updateMovieObj(movieObj) {
    movieObj.searchTerm = searchInput;
    movieObj.numSearches++;
    movieObj.mostRecentSearchTime = Date.now();
    movieObj.ongoingScore = updateOngoingScore(movieObj);
    database.ref("movies/" + searchInput).set(currentMovieObj);
}

// Calculate new ongoingScore
function updateOngoingScore(movieObj) {
    if (getTwitterScore() > 0) {
        var searches = movieObj.numSearches;
        var score = movieObj.ongoingScore;
        var newScore = (((searches - 1) * score) + (1 * twitterScore)) / searches;
        newScore = Math.round(newScore * 10) / 10;
        $("#twitterRate").html("<p>"+newScore+"</p>");
        database.ref("movies/" + searchInput).child("ongoingScore").set(newScore);
        return newScore;
    }
    else {
        console.log("Error: updateOngoingScore - Not a valid movie.");
    }
}

// Evaluate moviesInOrder and remove current movie from array if it exists. Then add back current movie to correct place based on numSearches. Then order items in that array with the same numSearches by most recent search.
function updateMoviesInOrderArr() {
    moviesInOrder = [];
    database.ref("movies").orderByChild("numSearches").on("child_changed", function(snapshot) {
        moviesInOrder.unshift(snapshot.val());
    }, function (errorObject) {
        console.log("Error: updateMoviesInOrderArr - The read failed: " + errorObject.code);
    });
    database.ref("movies").orderByChild("numSearches").on("child_added", function(snapshot) {
        moviesInOrder.unshift(snapshot.val());
    }, function (errorObject) {
        console.log("Error: updateMoviesInOrderArr - The read failed: " + errorObject.code);
    });
    database.ref("movies").orderByChild("numSearches").on("child_removed", function(snapshot) {
        moviesInOrder.unshift(snapshot.val());
    }, function (errorObject) {
        console.log("Error: updateMoviesInOrderArr - The read failed: " + errorObject.code);
    });
    // If the list item has the same numSearches as the next item, compare the search times. Move the most recent search first.
    for (var p=0; p < (moviesInOrder.length-1); p++) {
        if ((p < moviesInOrder.length) && (moviesInOrder[p].numSearches == moviesInOrder[p+1].numSearches)) {
            if (moviesInOrder[p].mostRecentSearchTime < moviesInOrder[p+1].mostRecentSearchTime) {
                var temp1 = moviesInOrder[p+1];
                moviesInOrder[p+1] = moviesInOrder[p];
                moviesInOrder[p] = temp1;
            }
        }
    }
}

// Initial grab of movies query to create initial buttons
function initialMoviesInOrderArr() {
    database.ref().once("value", function(snapshot){ 
        if (snapshot.child("movies").exists()) {
            moviesInOrder = snapshot.val().movies;
            var keys = Object.keys(moviesInOrder);
            for (var i=0; i < (keys.length-1); i++) {
                if (moviesInOrder[keys[i]].numSearches < moviesInOrder[keys[i+1]].numSearches) {
                    var temp2 = moviesInOrder[keys[i+1]];
                    moviesInOrder[keys[i+1]] = moviesInOrder[keys[i]];
                    moviesInOrder[keys[i]] = temp2;
                }
            }
            // Initial snapshot returned an object of objects, so need to turn it into an array of objects to work with updateMoviesButtons.
            var tempArr = [];
            for (item in moviesInOrder) {
                tempArr.push(moviesInOrder[item]);
            }
            moviesInOrder = tempArr;
            updateMoviesButtons();
        }
    });
}

// Write top 10 movies (most searched, most recent) to DOM
function updateMoviesButtons() {
    var moviesArrLength = 10;
    if (moviesInOrder.length < 10) {
        moviesArrLength = moviesInOrder.length;
    }
    $("#movieSearchesButtons").empty();
    for (var j = 0; j < moviesArrLength; j++) {
        var movieTitle = $("<button>").html((j+1) + ") " + moviesInOrder[j].searchTerm).attr("class", "btn btn-primary btn-movie").attr("style", "margin: 1px; text-transform:capitalize;").attr("onclick", "location.href='#portfolio'");
        $("#movieSearchesButtons").append(movieTitle);
    }
}

// Click handlers for the generated buttons
$(document.body).on("click", ".btn-movie", function(){
    var buttonSearch = $(this).html().slice(3);
    $("#movieSearch").val(buttonSearch);
    $("#twitterRate").html("<i class=\"fa fa-spinner fa-spin fa-2x fa-fw\"></i><span class=\"sr-only\">Loading...</span>");
    movieQuery();
});






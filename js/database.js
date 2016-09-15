var testDate = 1468971000000; // Number of seconds since 1/1/1970 until start of boot camp (9/10/2016, 18:30:00 GMT-0500 (CDT))
var testDate2 = 1473523295344; // Number of seconds since 1/1/1970 until right now (9/10/2016, 11:01:33 GMT-0500 (CDT))

// var testMovieSearch = {
//     searchTerm: "mean girls",
//     numSearches: 4,
//     mostRecentSearchTime: testDate,
//     ongoingScore: 0
// }

var searchInput, currentMovieObj, currentMovieObjSearches;
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

// Add Test movie search
//database.ref(testMovieSearch.searchTerm).set(testMovieSearch);

// Database Listener: Once - Grab ordered movies array from Firebase. If it doesn't exist, create a new array. Write the array to DOM as buttons.
database.ref().once("value", function(snapshot){ 
    if (snapshot.child("moviesInOrder").exists()) {
        moviesInOrder = snapshot.val().moviesInOrder;
    } 
});

// Listener: Submitted movie search, lookup the movie in our DB, adjust numSearches and mostRecentSearchTime, and grab changed movie object.
// KEY TO FIREBASE: Grab current value from DB, adjust it locally, re-write to DB
database.ref().on("value", function(snapshot){
    //If enter is pressed run database query
    $("input").keypress(function(event) {
        if (event.which == 13) {
            event.preventDefault();
            event.stopImmediatePropagation();
            $("#searchRequest").click();
        }
    });
    $("#searchRequest").on("click", function(event) {
        console.log("line 48");
        event.stopImmediatePropagation();
        searchInput = $("#movieSearch").val().trim().toLowerCase();
        // If movie already in Firebase, pull that
        console.log(snapshot.child(searchInput).exists());
        if (snapshot.child(searchInput).exists()) {
            currentMovieObj = snapshot.child(searchInput).val();
        } 
        else {
            currentMovieObj = {
                searchTerm: searchInput,
                numSearches: 0,
                mostRecentSearchTime: Date.now(),
                ongoingScore: 0
            }
            console.log(currentMovieObj);
        }
        console.log(currentMovieObj);
        // Update the object then push to DB. 
        updateMovieObj(currentMovieObj);
        database.ref(searchInput).set(currentMovieObj);
        // Update moviesInOrder, push that to DB & write to DOM
        updateMoviesInOrderArr();
        database.ref("moviesInOrder").set(moviesInOrder);
        updateMoviesButtons();
        $("#movieSearch").val(""); // clear input form
    });
    //console.log(snapshot.val()[searchInput]); // debug, validate that numSearches updates
});

// Grab existing movie from DB, need to change (1) numSearches, (2) mostRecentSearchTime, (3) ongoingScore (separate function)
function updateMovieObj(movieObj) {
    movieObj.numSearches++;
    movieObj.mostRecentSearchTime = Date.now();
    movieObj.ongoingScore = updateOngoingScore(movieObj);
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
    var counter = 0;
    if (moviesInOrder.length === 0) {
        moviesInOrder.push(currentMovieObj);
        console.log("line 93");
    } 
    else {
        //LEFT OFF HERE, need to account for: 1 movie in list matches current movie, 1 movie in list doesn't match current movie, > 1 movies in list
        // If only 1 item in array and it's for the same movie, replace
        if ((moviesInOrder.length === 1) && (currentMovieObj.searchTerm === moviesInOrder[0].searchTerm)) {
            console.log("line 99");
            moviesInOrder.splice(0, 1, currentMovieObj);
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
            var newMovieArrIndex = moviesInOrder.indexOf(currentMovieObj);
            moviesInOrder.splice(newMovieArrIndex, 1);
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
        // If movie in not array, find another movie w/ numSearches === 1
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



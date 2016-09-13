var testDate = 1468971000000; // Number of seconds since 1/1/1970 until start of boot camp (9/10/2016, 18:30:00 GMT-0500 (CDT))
var testDate2 = 1473523295344; // Number of seconds since 1/1/1970 until right now (9/10/2016, 11:01:33 GMT-0500 (CDT))

var testMovieSearch = {
    searchTerm: "Mean Girls",
    numSearches: 4,
    mostRecentSearchTime: testDate
}

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
database.ref(testMovieSearch.searchTerm).set(testMovieSearch);


// Add Submitted movie search
database.ref().on("value", function(snapshot){
    $("#submit").on("click", function() {
        var newSearchTermName = $("#movieSearch").val()
        // If movie already in Firebase, update the most recent search time and number of searches, then push to Firebase
        if (snapshot.child(newSearchTermName).exists()) {
            var currentObject = snapshot.child(newSearchTermName).val();
            var currentObjectSearches = snapshot.child(newSearchTermName).child("numSearches").val();
            console.log(currentObjectSearches);
            console.log(currentObject);
            currentObjectSearches++;
            currentObject = {
                searchTerm: newSearchTermName,
                numSearches: currentObjectSearches,
                mostRecentSearchTime: Date.now()               
            }
            database.ref(newSearchTermName).set(currentObject);
            console.log(snapshot.val());
        } else {
            var newObject = {
                searchTerm: newSearchTermName,
                numSearches: 1,
                mostRecentSearchTime: Date.now()
            }
            console.log(newObject);
            database.ref(newSearchTermName).set(newObject);

        }
        // Reorder the searches in Firebase, grab the top 10 searches (frequency, then last search time), then write to DOM
        var snapKeys = Object.keys(snapshot.val());
        console.log(snapKeys);
        // If it doesn't exist, create an array with a list of the keys in the database in order
        var tempArray = snapKeys.slice();
        for (var i = 1; i < snapKeys.length; i++) {
            console.log(snapshot.child(tempArray[i-1] + "/numSearches").val());
            var currentArrayItem = snapshot.child(tempArray[i] + "/numSearches").val()
            var priorArrayItem = snapshot.child(tempArray[i-1] + "/numSearches").val()
            // Bubble sort?
            if (currentArrayItem < priorArrayItem) {
                var holdingVar = tempArray[i];
                tempArray[i] = tempArray[i-1];
                tempArray[i-1] = holdingVar;
            }
        }
        // Add ordered movies array to Firebase
        if (snapshot.child("moviesInOrder").exists() === false) {
            database.ref("moviesInOrder").set(["a"]);
        }
    });
});






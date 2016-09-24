//Firebase

var config = {
   apiKey: "AIzaSyBDU_oaLw-ziSFeQpxeK1EuAaz_6ufnLf4",
   authDomain: "moviesgroupproject.firebaseapp.com",
   databaseURL: "https://moviesgroupproject.firebaseio.com",
   storageBucket: "moviesgroupproject.appspot.com",
};
firebase.initializeApp(config);

var database = firebase.database();

//Autocomplete Lists
var autocompleteList= new Array();  //JSON Object

//Scrolling booleans to see if the boxes are moving
var scrollingBoxA=false;
var scrollingBoxB=false;

//variables created due to lag in object creation causing animation bugs
var stopAnimation = $(".stopAnimation");
var twitterBoxA = $("#twitterContentBoxA");
var twitterBoxB = $("#twitterContentBoxB");

var foundMovie = false;
var twitterScore = -1;

//Document on ready
$(document).ready(function(){
	//Enables tooltip
    $('[data-toggle="tooltip"]').tooltip();

    //Get listing of movies from DB
    queryDB();

    //Twitter button javascript (from twitter.com)
    window.twttr = (function(d, s, id) {
  		var js, fjs = d.getElementsByTagName(s)[0], t = window.twttr || {};
		if (d.getElementById(id)) return t;
		js = d.createElement(s);
		js.id = id;
		js.src = "https://platform.twitter.com/widgets.js";
		fjs.parentNode.insertBefore(js, fjs);
 
		t._e = [];
		t.ready = function(f) {
			t._e.push(f);
		};

		return t;
		}
	(document, "script", "twitter-wjs")
	);

});


//Opens a twitter link (hashtag or handle) click and opens a small window
$(".container").on("click", ".twitterClick", function() {
    newwindow=window.open($(this).attr("href"),'name','height=600,width=800,top=200,left=300,resizable');
	if (window.focus) {
		newwindow.focus()
	}
	return false;
});

//Opens a small window if tweet button is clicked
$(".twitter-hashtag-button").on("click", function() {
    newwindow=window.open($(this).attr("href"),'name','height=200,width=500,top=200,left=300,resizable');
	if (window.focus) {
		newwindow.focus()
	}
	return false;
});


//If Go! is clicked run the movie query
$("#searchRequest").on("click", function(){

	$("#twitterRate").html("<i class=\"fa fa-spinner fa-spin fa-2x fa-fw\"></i><span class=\"sr-only\">Loading...</span>");
	movieQuery();
});

//If enter is pressed run the movie query
$("input").keypress(function(event) {
    if (event.which == 13) {
        event.preventDefault();
        $("#twitterRate").html("<i class=\"fa fa-spinner fa-spin fa-2x fa-fw\"></i><span class=\"sr-only\">Loading...</span>");
        movieQuery();
    }
});

//Remove red background (if present) when entering text box
$("#movieSearch").on("focus", function(){

	$("#movieSearch").removeClass("changeForm");
	$("#movieSearch").attr("placeholder", "Search for a movie...");
});


//If mouseover on twitter feed, stop animation
$("#twitterBox").on("mouseover", function(){
		stopAnimation.stop(true);
});

//If mouse leaves twitter feed, restart animation
$("#twitterBox").on("mouseout", function(){
	if(scrollingBoxA){
		animateBoxA();
	}
	if(scrollingBoxB){
		animateBoxB();
	}
});

//Everytime a key is pressed update possibilities list
var lastentry = "";
$('#movieSearch').keyup(function(event) {
   if($('#movieSearch').val() != lastentry) {       
   		lastentry = $('#movieSearch').val();
   			updateList();
   }
   lastentry = $('#movieSearch').val();
});

//Get the string from the earch box and call the search function
function movieQuery(){
	var searchString = $("#movieSearch").val().trim();

	if(/<.*>/.test(searchString)){

		$("#movieSearch").addClass("changeForm");
		$("#movieSearch").val("");
		$("#movieSearch").attr("placeholder", "Please do not use HTML tags...");
	}
	else if (searchString === ''){
		$("#movieSearch").addClass("changeForm");
		$("#movieSearch").val("");
		$("#movieSearch").attr("placeholder", "Please type a movie...");
	}
	else{
		var movieName = searchString.replace(/\(.*?\)/g, "").trim();
		var movieYear = searchString.match(/\d{8}/);
		
		//Prevent searches on blank search string
		if(searchString !== "" && searchString !== null){
			if(movieYear!==null){

				omdbSearch(movieName, movieYear[0]);
				
			}
			else{
				omdbSearch(movieName,"");
			}

			//Seach OMDB API
			//omdbSearch(searchString);

			//For twitter search see omdbSearch() under foundMovie logic;
		}
	}
}

//Query the omdb
function omdbSearch(movieName, movieYear){

	var queryURL = "http://www.omdbapi.com/?t="+movieName+"&y="+movieYear+"&plot=short&r=json";

	$.ajax({url: queryURL, method: 'GET'})
	.done(function(response) {

		//Get values relevant to movie
		var title = response.Title;
		var plot = response.Plot;
		var year = response.Year;
		//var image;
		if(response.Poster === "N/A"){
			image = "<p>No Image Avaliable :(</p>";
		}
		else{
			//IMDB does not allow direct linking to images used by OMDB API
			omdbPosterSearch(response.imdbID);
			
		 }

		var actors = response.Actors;
		var rating = response.Rated;
		var imdbRate = response.imdbRating;

		//Get db response for true or false if movie found
		if(response.Response === "False"){
			foundMovie = false;
		}
		else{
			foundMovie = true;
		}

		//If a movie is found populate page
		if(foundMovie){

			$("#movieTitle").html(title);
			//$("#movieImage").html(image);
			$("#moviePlot").html(plot);
			$("#movieActors").html(actors);
			$("#rating").html(rating);
			$("#imdbRate").html(imdbRate);

			//Only search twitter if a movie is found
			twitterSearch(movieName);
		}

		//Reset all data from last movie (if searched) and no result for current search
		else{
			$("#movieTitle").html("Cannot Find Movie");
			$("#movieImage").html("");
			$("#moviePlot").html("N/A");
			$("#movieActors").html("N/A");
			$("#rating").html("N/A");
			$("#imdbRate").html("N/A");
			$("#twitterRate").html("<p>N/A</p>");

			//Stops twitter feed from last movie (if searched)
			resetAnimation();

		}
		//Show divs
			$("#movieData").removeClass("hidden");
			$("#movieData").addClass("visable");		
	});
}

function omdbPosterSearch(idNum, title){
	//OMDB has a poster API that doesn't used IMDB images
	//OMDB Poster API Key isn't activated at this time (still waiting), using themovieDB API temporarily.  
	//Using themovieDB solely would require rework of omdbSearch function.  
	//If key isn't activated eventually, will rewrite omdbSearch function for themovieDB API.

	var queryURL = "https://api.themoviedb.org/3/find/"+idNum+"?api_key=6da67bfb86c1874dd52d5307d2719d85&language=en-US&external_source=imdb_id";
	//var queryURL = "http://img.omdbapi.com/?i="+idNum+"&apikey=6dc4a274";
	console.log(idNum);
	$.ajax({url: queryURL, method: 'GET'})
	.done(function(response) {

		var	image = $('<img>').attr("src", "http://image.tmdb.org/t/p/w300"+response.movie_results[0].poster_path);
			image.attr("alt", title);
			$("#movieImage").html(image);
	});

}

function twitterSearch(movieName){

	//Remove 'The' and 'A' from title for better search
	movieName = movieName.replace(/the /i,'');
	if(movieName[0].toUpperCase() === 'A' && movieName[1] === ' '){
		movieName=movieName.substring(1);
	}
	//PHP file is hosted externally due to twitter keys cannot be public (for security reasons)
	//File can be viewed under php/getTweets.php
	var queryURL = "http://apparelart.com/Bootcamp/getTweets.php?tweet="+movieName;

	var positive =0;
	var negative =0;
	var tweets="";

	$.ajax({url: queryURL, method: 'GET'})
	 .done(function(response) {
	 	var resultObj = JSON.parse(response);
	 	for (var i = 0; i<resultObj.length;++i){
	 		
	 		if(resultObj[i].score ===4){
	 			positive+=1;
	 		}
	 		else{
	 			negative+=1;
	 		}
	 		tweets += formatTweet(resultObj[i]);
	 	}

	 	//Append all tweets to both twitter boxes
	 	twitterBoxB.html(tweets);
	 	twitterBoxA.html(tweets);
	 	resetAnimation();
		animateBoxA();
		console.log(positive, negative);

		if(positive === 0 && negative ===0){
			twitterScore = -1;
			$("#twitterRate").html("<p class=\"redText\">Cannot Find Tweets</p>");
		}
		else{
	 		twitterScore = Math.round( positive/(positive+negative) * 100 ) / 10;
	 		$("#twitterRate").html("<p>"+twitterScore+"</p>");
	 			 	// Added by Kristin - execute Firebase search & buttons generator
			databaseFunctions();
	 }
	 });
}

//Animation controls for Twitter Box A
function animateBoxA(){
	scrollingBoxA=true;
	var boxHeight = twitterBoxA.height();
	var animateHeight = (-1*boxHeight);
	var startBoxB = true;
	var currentPos = twitterBoxA.position();

	$("#twitterContentBoxA").animate({"top": animateHeight+"px"},{duration: (boxHeight+currentPos.top)*50, easing:"linear", 
		step: function(now, fx){

			var pos = twitterBoxA.position();

			if(Math.floor(pos.top) <= animateHeight+150 && startBoxB){ //Fix for low amount of  tweets
				startBoxB = false;
				animateBoxB();
			}
		},
		complete: function() {
			scrollingBoxA=false;
			twitterBoxA.css({"top":"150px"});
		}
	});
}

//Animation controls for Twitter Box B
function animateBoxB(){
	scrollingBoxB=true;
	var boxHeight = twitterBoxB.height();
	var animateHeight = (-1*boxHeight);
	var startBoxA = true;
	var currentPos = twitterBoxB.position();

	twitterBoxB.animate({"top": animateHeight+"px"},{duration: (boxHeight+currentPos.top)*50, easing:"linear", 
		step: function(now, fx){
			var pos = twitterBoxB.position();
			if(Math.floor(pos.top) <= animateHeight+150 && startBoxA){ //Fix for low amount of  tweets
				startBoxA = false;
				animateBoxA();
			}
		},
		complete: function() {
			scrollingBoxB=false;
			twitterBoxB.css({"top":"150px"});
		}
	});
}

function resetAnimation(){
	stopAnimation.stop(true);
	stopAnimation.finish();
	twitterBoxA.css({"top":"150px"});
	twitterBoxB.css({"top":"150px"});
	scrollingBoxA=false;
	scrollingBoxB=false;
}

function formatTweet(tweetObj){
	var line;
	var handle = "<a href=\"https://twitter.com/"+tweetObj.name+"/status/"+tweetObj.id+"\" class=\"twitterClick twitterLinkBold\">@"+tweetObj.name+"</a><br />";

	var messageArray = tweetObj.tweet.split(" ");
	var message="";

	for(var i =0; i< messageArray.length;++i){
		if(messageArray[i].includes("#")){
			messageArray[i] = messageArray[i].replace("#", "");
			message+="<a href=\"https://twitter.com/hashtag/"+messageArray[i]+"\" class=\"twitterClick twitterHandleLinkPink\">#"+messageArray[i]+" </a>";
		}
		else if(messageArray[i].includes("@")){
			messageArray[i] = messageArray[i].replace("@", "");
			message+="<a href=\"https://twitter.com/"+messageArray[i]+"\" class=\"twitterClick twitterHandleLinkGreen\">@"+messageArray[i]+" </a>";
		}
		else if(messageArray[i].includes("http")){
			message+="<a href=\""+messageArray[i]+"\" class=\"twitterClick twitterHandleLinkBrown\">"+messageArray[i]+" </a>";
		}
		else if(messageArray[i].includes("www")){
			message+="<a href=\""+messageArray[i]+"\" class=\"twitterClick twitterHandleLinkBrown\">"+messageArray[i]+" </a>";
		}
		else{
			message+=(messageArray[i]+" ");
		}
	}

	line = handle+message+"<br /><br />";
	return line;
}

//Add results from DB to autocomplete
function updateList(){

	$( "#movieSearch" ).autocomplete({
		//Makes autocomplete only max 10 possibilities
		source: function(request, response) {
	       var results = $.ui.autocomplete.filter(autocompleteList, request.term);
	       response(results.slice(0, 10));
    	},
    	minLength:2
	});
}

//Query entire DB, firebase does not have native "like" search capabilities
function queryDB(){
	database.ref().orderByChild('title').on("value", function(snapshot) {
		autocompleteList= new Array();
		var dbArray = $.map(snapshot.val(), function(arr) { 
			return arr;
		});
        for(var i=0;i<dbArray.length;++i){
            if(snapshot.val()!==null){
            	if(Object.keys(dbArray[i])[0]=="title"){
            		autocompleteList.push(dbArray[i].title);
            	}
            }
        }
    });

}

function isValidMovie(){
	return foundMovie;
}
function getTwitterScore(){
	return twitterScore;
}
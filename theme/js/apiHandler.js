

//Scrolling booleans to see if the boxes are moving
var scrollingBoxA=false;
var scrollingBoxB=false;

//variables created due to lag in object creation causing animation bugs
var stopAnimation = $(".stopAnimation");
var twitterBoxA = $("#twitterContentBoxA");
var twitterBoxB = $("#twitterContentBoxB");

//Document on ready
$(document).ready(function(){
	//Enables tooltip
    $('[data-toggle="tooltip"]').tooltip();

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

	$("#twitterRate").html("Getting Score...");
	movieQuery();
});

//If enter is pressed run the movie query
$("input").keypress(function(event) {
    if (event.which == 13) {
        event.preventDefault();
        movieQuery();
    }
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

//Get the string from the earch box and call the search function
function movieQuery(){
	var searchString = $("#movieSearch").val().trim();
	
	//Prevent searches on blank search string
	if(searchString !== "" && searchString !== null){

		//Seach OMDB API
		omdbSearch(searchString);

		//For twitter search see omdbSearch() under foundMovie logic;
	}
}

//Query the omdb
function omdbSearch(movieName){

	var queryURL = "http://www.omdbapi.com/?t=" + movieName + "&y=&plot=short&r=json";

	$.ajax({url: queryURL, method: 'GET'})
	.done(function(response) {

		//Get values relevant to movie
		var title = response.Title;
		var plot = response.Plot;
		var year = response.Year;
		var image = $('<img>').attr("src", response.Poster);
			image.attr("alt", title);
		var actors = response.Actors;
		var rating = response.Rated;
		var imdbRate = response.imdbRating;
		var foundMovie = response.Response;

		//If a movie is found populate page
		if(foundMovie !== "False"){

			$("#movieTitle").html(title);
			$("#movieImage").html(image);
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
			$("#twitterRate").html("N/A");

			//Stops twitter feed from last movie (if searched)
			resetAnimation();

		}
		//Show divs
			$("#movieData").removeClass("hidden");
			$("#movieData").addClass("visable");		
	});
}

function twitterSearch(movieName){

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
	 		//tweets+="@"+resultObj[i].name+"<br />"+resultObj[i].tweet+"<br /><br />";
	 	}

	 	//Append all tweets to both twitter boxes
	 	twitterBoxA.html(tweets);
	 	twitterBoxB.html(tweets);
	 	resetAnimation();
		animateBoxA();
	 	$twitterScore = Math.round( positive/(positive+negative) * 100 ) / 10;
	 	$("#twitterRate").html($twitterScore);
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
	//https://twitter.com/CPUHobbes/status/519635190927196160	
	//tweets+="@"+resultObj[i].name+"<br />"+resultObj[i].tweet+"<br /><br />";
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
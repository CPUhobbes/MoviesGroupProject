

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

});


$("#searchRequest").on("click", function(){

	$("#twitterRate").html("Getting Score...");
	movieQuery();
});

$("#twitterBox").on("mouseover", function(){
		stopAnimation.stop(true);
});

$("#twitterBox").on("mouseout", function(){

	if(scrollingBoxA){
		animateBoxA();
	}
	if(scrollingBoxB){
		animateBoxB();
	}

});

function movieQuery(){
	var searchString = $("#movieSearch").val().trim();
	
	//Search Twitter
	twitterSearch(searchString);

	//Seach OMDB API
	omdbSearch(searchString);

}

function omdbSearch(movieName){

	var queryURL = "http://www.omdbapi.com/?t=" + movieName + "&y=&plot=short&r=json";

	$.ajax({url: queryURL, method: 'GET'})
	.done(function(response) {
		//console.log(response);

		var title = response.Title;
		var plot = response.Plot;
		var year = response.Year;
		var image = $('<img>').attr("src", response.Poster);
			image.attr("alt", title);
		var actors = response.Actors;
		var rating = response.Rated;
		var imdbRate = response.imdbRating;
		var foundMovie = response.Response;

		if(foundMovie !== "False"){

			$("#movieTitle").html(title);
			$("#movieImage").html(image);
			$("#moviePlot").html(plot);
			$("#movieActors").html(actors);
			$("#rating").html(rating);
			$("#imdbRate").html(imdbRate);
		}
		else{
			$("#movieTitle").html("Cannot Find Movie");

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
	 		tweets+="@"+resultObj[i].name+"<br />"+resultObj[i].tweet+"<br /><br />";
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

	$("#twitterContentBoxA").animate({"top": animateHeight+"px"},{duration: (boxHeight+currentPos.top)*20, easing:"linear", 
		step: function(now, fx){

			var pos = twitterBoxA.position();

			if(Math.floor(pos.top) <= animateHeight+150 && startBoxB){
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

	twitterBoxB.animate({"top": animateHeight+"px"},{duration: (boxHeight+currentPos.top)*20, easing:"linear", 
		step: function(now, fx){
			var pos = twitterBoxB.position();
			if(Math.floor(pos.top) <= animateHeight+150 && startBoxA){
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


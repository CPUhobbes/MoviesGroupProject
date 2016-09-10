


$("#submit").on("click", function(){

movieQuery();


});





function movieQuery(){
	var searchString = $("#movieSearch").val().trim();
	var hashTag = searchString.replace(/\s/g, ''); //Remove Spaces

	var queryURL = "http://apparelart.com/Bootcamp/getTweets.php?tweet="+hashTag;
	

	//Seach OMDB API
	omdbSearch(searchString);
	twitterSearch(hashTag);



}

function omdbSearch(movieName){

	var queryURL = "http://www.omdbapi.com/?t=" + movieName + "&y=&plot=short&r=json";

	$.ajax({url: queryURL, method: 'GET'})
	.done(function(response) {
		console.log(response);

		var title = response.Title;
		var plot = response.Plot;
		var year = response.Year;
		var image = $('<img>').attr("src", response.Poster);
			image.attr("alt", title);
		var actors = response.Actors;
		var rating = response.Rated;
		var imdbRate = response.imdbRating;

		$("#movieName").html(title);
		$("#moviePicture").html(image);
		$("#movieText").html(plot);
		$("#movieActors").html(actors);
		$("#mpaa").html(rating);
		$("#movieRating").html(imdbRate);
	});

}


function twitterSearch(movieName){

	var queryURL = "http://apparelart.com/Bootcamp/getTweets.php?tweet="+movieName;

	$.ajax({url: queryURL, method: 'GET'})
	 .done(function(response) {
	 	var resultObj = JSON.parse(response);
	 	console.log(resultObj.length);
	 	for (var i = 0; i<resultObj.length;++i){
	 		$("#temp").append("Name: "+resultObj[i].name+"<br />Tweet: "+resultObj[i].tweet+"<br /><br />");


	 	}



	 });
}
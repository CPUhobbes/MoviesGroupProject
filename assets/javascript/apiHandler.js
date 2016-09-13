


$("#submit").on("click", function(){

movieQuery();


});





function movieQuery(){
	var searchString = $("#movieSearch").val().trim();
	
	//Seach OMDB API
	//omdbSearch(searchString);
	twitterSearch(searchString);
	//sentimentSearch();
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

	var positive =0;
	var negative =0;

	$.ajax({url: queryURL, method: 'GET'})
	 .done(function(response) {
	 	var resultObj = JSON.parse(response);
	 	console.log(resultObj.length);
	 	for (var i = 0; i<resultObj.length;++i){
	 		// $("#temp").append("Name: "+resultObj[i].name+"<br />Tweet: "+resultObj[i].tweet+"<br /><br />");
	 		if(resultObj[i].score ===4){
	 			positive+=1;
	 		}
	 		else{
	 			negative+=1;
	 		}



	 	}

	 	$("#temp").append(positive+" "+negative);

	 });
}

// function sentimentSearch(){
// 	var obj = {"data": [{"text": "I love Titanic."}, {"text": "I hate Titanic."}]};
// 	var queryURL = "http://www.sentiment140.com/api/bulkClassifyJson?appid=holygeezx@gmail.com";

	// $.ajax({url: queryURL, 
	// 	method: 'PUT', 
	// 	contentType: "application/json",
	// 	// crossDomain: true
	// 	AccessControlAllowOrigin: "http:www.apparelart.com",
	// 	// Content-Type: "application/json"



	// })
	//  .done(function(response) {
	 	
	//  	console.log(response);






	//  });
//}


function getCORS(url, success) {
	    var xhr = new XMLHttpRequest();
	    xhr.open('GET', url);
	    xhr.onload = success;
	    xhr.send();
	    return xhr;
	}
	
	// example request
	



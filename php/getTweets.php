<?php
    //Allow GET from another server
	header('Access-Control-Allow-Origin: *');

    //Oauth library
    require "twitteroauth/autoload.php";
    use Abraham\TwitterOAuth\TwitterOAuth;

    //Receieve GET request
    $tweet=$_GET["tweet"];
    
    //Twitter API Keys - THESE WERE INTENTIONALLY REMOVED FOR SECURITY
    $consumerkey = "";
    $consumersecret = "";
    $accesstoken = "";
    $accesstokensecret = "";

    //Twitter API connection
    $connection = new TwitterOAuth($consumerkey, $consumersecret, $accesstoken, $accesstokensecret);

    //Empty array (object) for SentimentAnalysis API call
    $post_data =array(data => array());

    //Format string for sentiment analysis
    $noSpaceTweet = str_replace(" ", "", $tweet);
    $sentimentQuery = array($noSpaceTweet, $tweet, $tweet, $tweet);
    
    //Format string for twitter
    $noSpaceTweet = "#".$noSpaceTweet;
    $quoteTweet = "\"".$tweet."\"";
    $catchAllTweet =  removeCommonWords($tweet);

    //%20%3A%29 is smiley face %20%3A%28 is frown which are positive and negative feelings per twitter api
    $twitterQueryArray = array(
    							$noSpaceTweet, 
    							$quoteTweet, 
    							$quoteTweet."%20%3A%29", 
    							$quoteTweet."%20%3A%28",
                                $catchAllTweet);  
    $tweetLength = count($twitterQueryArray);

    //Create twitter API query string done 4 times to get different types of results from twitter
    for($i =0;$i<$tweetLength;$i++){
        $query = array(
          	"q" => $twitterQueryArray[$i]."%20-RT",
          	"result_type" => "recent",
          	"lang" => "en",
          	"count" => "100",
        );
        
        //Results from twitter API
        $results = $connection->get('search/tweets', $query);

        //Parse through results and add them to Sentiment analysis object
        foreach ($results->statuses as $result) {
            $name = $result->user->screen_name;
            $text = $result->text;
            $id = $result ->id_str;
            $cleanText = removeHashtag($text);
            array_push(
				$post_data[data],  
				array(
					text => $cleanText, 
					query => $sentimentQuery[$i], 
					topic => "movies", 
					user=>$name, tweet => $text, 
					id => $id));
        }
    }
    //Run sentiment analysis
    sentimentAnalysis($post_data);
        

    //Format strings for sentiment analysis request
    function removeHashtag($string){
        //removes hashtags
        $string = preg_replace("(#+)", "", $string);
        $string = preg_replace("(\"+)", "", $string);
        //Removes @twitter handles
        $stringArray = explode(" ", $string);
        $tempString="";
        foreach($stringArray as $word){
            if(!preg_match("(@+)", $word, $match)  && !preg_match("(http+)", $word, $match) ){
                $tempString = $tempString." ".$word;
            }
        }
        return $tempString;
    }

    //Sentiment analysis API request
    function sentimentAnalysis($obj){

        $post_data = json_encode($obj);

        //CURL request
        $url = "http://www.sentiment140.com/api/bulkClassifyJson?appid=holygeezx@gmail.com";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL,$url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
        curl_setopt($ch, CURLOPT_HEADER, false);
        curl_setopt($ch, CURLOPT_URL, $url);

        //receive server response
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        //execute CURL request
        $server_output = curl_exec ($ch);

        //close CURL
        curl_close ($ch);

        // parse returned object
        returnResult($server_output);
    }

    //Parse result from Sentiment analysis result and return an object with results 
    function returnResult($obj){
        //Removes UTF-8 encoding
        $obj = preg_replace('/[^(\x20-\x7F)]*/','', $obj); 

        $obj = json_decode($obj, true);
        $count = count($obj[data]);

        $fomattedObj=array();

        //Parse though each result and if positive or negative add to object to be returned
        for($i =0; $i<$count;$i++){

            if($obj[data][$i][polarity] == 0){
                if(!in_array($obj[data][$i][user], array_column($fomattedObj, 'name'))){//Checks for duplicate names
                    array_push(
                    	$fomattedObj,  
                    	array(
                    		score => $obj[data][$i][polarity], 
                    		name => $obj[data][$i][user], 
                    		tweet => $obj[data][$i][tweet], 
                    		id=> $obj[data][$i][id]));
                }
            }

            elseif($obj[data][$i][polarity] == 4){
                if(!in_array($obj[data][$i][user], array_column($fomattedObj, 'name'))){//Checks for duplicate names
                    array_push(
                    	$fomattedObj,  
                    	array(
                    		score => $obj[data][$i][polarity], 
                    		name => $obj[data][$i][user], 
                    		tweet => $obj[data][$i][tweet], 
                    		id=> $obj[data][$i][id]));
                }
            }
        }

        //------  JSON ITERATOR TEST CODE  -------
        // $jsonIterator = new RecursiveIteratorIterator(
        // new RecursiveArrayIterator($fomattedObj),
        // RecursiveIteratorIterator::SELF_FIRST);

        // foreach ($jsonIterator as $key => $val) {
        //     if(is_array($val)) {
        //         echo "$key:\n";
        //     } 
        //     else {
        //         echo "$key => $val\n";
        //     }
        // }

        echo json_encode($fomattedObj);
    }

    function removeCommonWords($input){
 
    $commonWords = array('a', 'an', 'the', 'for', 'or', 'if', 'and');
 
    return preg_replace('/\b('.implode('|',$commonWords).')\b/','',$input);
}

?>
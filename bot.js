var request = require('request');
var fs = require("fs");
const Discord = require('discord.js');
const client = new Discord.Client();
var Twitter = require('twitter');

//ID for landing pad
var newMemberChannel = 295745377083326464;

//ID for subreddit-feed channel
var newRedditPostChannel = 296414495478382592;

//ID for botdump channel
var botLoggingChannel = 296674818026373123;

//ID for the intelligence channel
var intelligenceChannel = 296730066069618688;

//pretty self-explanatory, when the bot's connected properly, log it, for some reason this happens a couple times when the bot first starts
client.on('ready', () => {
    console.log('Connected!');
    findInfoChannel();
});

//message recieved event
client.on('message', msg => {
    //respond to the various commands
    if (msg.content === '!KONF subscribers') {
        checkSubCount();
    }
});

//the ID for channel #info
var infoChannelID = 296678122135355393;
//undefined varible which will become a GuildChannel object once the next loop runs at startup
var infoChannel;

function findInfoChannel() {
    client.channels.forEach(function (channel) {
        if (channel.id == infoChannelID) {
            //sets the info channel so we can use it in the mentions later
            infoChannel = channel;
        }
    });
}

//when someone joins this event is called, the variable member is of type GuildMember in Discord.JS
client.on('guildMemberAdd', member => {
    //welcome the new user
    sendMessage("Welcome " + member.user + "! Thanks for helping to Keep Our Net Free! Be sure to give " + infoChannel + " a read!", newMemberChannel);
    sendMessage("User " + member.user + " has joined. ID: " + member.id + " - Avatar URL: " + member.user.avatarURL + " - is a bot? " + member.user.bot + " - Created At:" + member.user.createdAt, botLoggingChannel);
});

//event for people leaving or being kicked, sent to the log only
client.on('guildMemberRemove', member => {
    sendMessage("User " + member.user + " has left. Username: " + member.user.username + " - Nickname(if any): " + member.nickname, botLoggingChannel);
});

//Current UTC time. Reddit uses seconds, not milliseconds like JS
var newestPostTimeUTC = Math.floor(new Date().getTime() / 1000);

function checkForNewPost() {
    //make a request to the api page for sub posts
    request('https://www.reddit.com/r/KeepOurNetFree/new/.json', function (error, response, body) {
        if (error) {
            //if it errors, log it
            console.log(error);
        }
        else {
            //A try/catch for if the postdata is invalid JSON, if there's no first child, no permalink, etc.
            try {
                var postData = JSON.parse(body);
                //get the time, title and url of the newest post, constructed from the JSON
                var checkPostTimeUTC = postData['data']['children'][0]['data'].created_utc;
                var checkPostTitle = postData['data']['children'][0]['data'].title;
                var checkPostURL = 'https://www.reddit.com' + postData['data']['children'][0]['data'].permalink;
                var postAuthor = postData['data']['children'][0]['data'].author;

                //if the previous post time is older than the one retrieved from the API, something new's been posted
                if (newestPostTimeUTC < checkPostTimeUTC) {
                    //set the old post time to the API post time
                    newestPostTimeUTC = checkPostTimeUTC;
                    //send the discord message and log it
                    sendMessage('New KONF reddit post "' + checkPostTitle + '" by *' + postAuthor + '* ' + checkPostURL, newRedditPostChannel);
                    console.log('New post by ' + postAuthor + ' ' + checkPostURL);
                }
            }
            catch (err) {
                console.log('Error while getting latest Reddit post: ' + err.message);
            }
        }
    });
}

//minutes between checking for a new reddit post
var minutes = 0.5;
var interval = minutes * 60 * 1000;

setInterval(checkForNewPost, interval);

function checkAllPosts(){
    request('https://www.reddit.com/r/all/top/.json?sort=top&t=day&count=0&limit=100', function (error, response, body) {
        if (error) {
            console.log(error);
        }
        else {
            try {
                var postData = JSON.parse(body);
                var currentPost = 0;

                //for each post on /r/all
                postData["data"]["children"].forEach(function(post){
                    currentPost += 1;
                    //if the post is from /r/KONF
                    if(post["data"]["subreddit_name_prefixed"] === "r/KeepOurNetFree"){
                        if(currentPost >= 25){
                            sendMessage("**Currently trending on /r/all ** " + 'https://www.reddit.com' + post["data"].permalink + "**Ranked: " + currentPost + "**", newRedditPostChannel);
                            sendMessage("**Post hit the front page:** " + 'https://www.reddit.com' + post["data"].permalink + "**Ranked: " + currentPost + "**", intelligenceChannel);
                        } else {
                            sendMessage("**Currently trending on /r/all ** " + 'https://www.reddit.com' + post["data"].permalink + "**Ranked: " + currentPost + "**", newRedditPostChannel);
                        }
                    }
                });
            }
            catch (err) {
                console.log('Error while getting /r/all: ' + err.message);
            }
        }
    });
}

//check every 6 hours for a post on /r/all
var allMinutes = 360;
var allInterval = minutes * 60 * 1000;

setInterval(checkAllPosts, allInterval);

var twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
 
var previousPostID = 0;
var queryURL = encodeURI("https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=comcast&exclude_replies=true");

function getLatestCCTweet(){
    twitterClient.get(queryURL, function(error, tweets, response) {
        if (!error) {
            if(tweets[0] != undefined){
                if(tweets[0]["id"] != previousPostID){
                    console.log("New tweet found!");
                    sendMessage("Latest tweet by @Comcast. *" + decodeURIComponent(tweets[0]["text"]) + "* at " + tweets[0]["created_at"] + " **Link: **" + "https://twitter.com/statuses/" + tweets[0]["id_str"], intelligenceChannel);
                    previousPostID = tweets[0]["id"];
                }
            }
        } else {
            console.log(error);
        }
    });
}

var TweetMinutes = 60;
var TweetInterval = TweetMinutes * 60 * 1000;

setInterval(getLatestCCTweet, TweetInterval);

var currentSubCount = 0;

function checkSubCount() {
    //make an API request to the about page of the sub
    request('https://www.reddit.com/r/KeepOurNetFree/about.json', function (error, response, body) {
        if (error) {
            console.log(error);
        }
        else {
            var subData = JSON.parse(body);
            //store the sub count
            var subscriberCount = subData['data'].subscribers;

            //print it out as a reply
            sendMessage('Current subscriber count: ' + subscriberCount, newRedditPostChannel);
            console.log('Current subscriber count: ' + subscriberCount);
        }
    });
}

//the send message function
function sendMessage(msg, channelID) {
    //loop through all channels the bot has read permissions in
    client.channels.forEach(function (channel) {
        if (channel.id == channelID) {
            if(channel.type == "text"){
                channel.send(msg).then(message => console.log(`Sent message: ${message.content}`)).catch(console.error);
            }
        }
    });
}

client.login(process.env.DISCORD_TOKEN);

var restartMinutes = 180;
var restartInterval = restartMinutes * 60 * 1000;
setInterval(function(){
    client.destroy().then(() => client.login(process.env.DISCORD_TOKEN));
}, restartInterval);

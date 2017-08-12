var request = require('request');
var fs = require("fs");
const Discord = require('discord.js');
const client = new Discord.Client();
var Twitter = require('twitter');

//ID for landing pad
var newMemberChannel = 295745377083326464;

//ID for subreddit-pr channel
var newRedditPostChannel = 296414495478382592;

//ID for botdump channel
var botLoggingChannel = 296674818026373123;

//ID for the intelligence channel
var intelligenceChannel = 296730066069618688;

//ID for a channel in my personal dev server when i'm testing locally
//var devChannelID = 270601378341191681;

//pretty self-explanatory, when the bot's connected properly, log it, for some reason this happens a couple times when the bot first starts
client.on('ready', () => {
    console.log('Connected!');
    findInfoChannel();
});

//message recieved event
client.on('message', msg => {
    //respond to the various commands
    if (msg.content === 'KONF help') {
        msg.reply('New members are welcomed automatically. Run "KONF subscribers" to see the current sub count.');
    }
    if (msg.content === 'KONF subscribers') {
        checkSubCount();
    }
    // if((msg.author.id == 163267288592547840 || msg.author.id == 158015835410137089 || msg.author.id == 295745698060828672 || msg.author.id == 261345443039019009) && msg.content.includes("KONF broadcast")){
    //     broadcastmsg = msg.content.replace("KONF broadcast", "");
    //     broadcastMessage(broadcastmsg);
    // }
    // if((msg.author.id == 163267288592547840 || msg.author.id == 158015835410137089 || msg.author.id == 295745698060828672 || msg.author.id == 261345443039019009) && msg.content.includes("KONF cleanB")){
    //     clearBroadcast();
    // }
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
    sendMessage("User " + member.user + " has left.", botLoggingChannel);
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
                console.log('Error while getting latest Reddit post: ' + err.message)
            }
        }
    });
}

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

//minutes between checking for a new reddit post
var minutes = 0.5;
var interval = minutes * 60 * 1000;

setInterval(checkForNewPost, interval);

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
    console.log("Sending message...");
    //loop through all channels the bot has read permissions in
    client.channels.forEach(function (channel) {
        if (channel.id == channelID) {
            if(channel.type == "text"){
                channel.send(msg).then(message => console.log(`Sent message: ${message.content}`)).catch(console.error);
            }
        }
    });
}

//sends a direct message to all members in the guild
// function broadcastMessage(msg) {
//     client.guilds.forEach(function (guild) {
//         guild.members.forEach(function (member) {
//             //checks if the user isn't a bot, we don't want to send messages pointlessly
//             if(!member.bot){
//                 console.log("Sending message to " + member.user.username);
//                 member.user.send(msg);
//             }
//         });
//     });
// }

//wipes all previous DM messages sent to user
// function clearBroadcast() {
//     //for each user in the bot client's cache (all previous DM conversations)
//     client.users.forEach(function(user){
//         //make sure they're not a bot
//         if(!user.bot){
//             //send them a message (yes, to delete previous messages we first need to send them one)
//             user.send("Cleaning...").then(function(msg){
//                 //fetch the sent message channel object, which is why we sent it to them
//                 msg.channel.fetchMessages().then(function(messages){
//                     //fetch all previous messages sent
//                     messages.forEach(function(msg){
//                         //loop through and delete them, log it
//                         console.log("Previous message to user " + user.username + " deleted: " + msg.content);
//                         msg.delete();
//                     });
//                 }).catch(console.error); // catches a failure to fetch previous messages
//             }).catch(console.error); // catches a failure to send the message
//         }
//     });
// }

function checkViralPosts(){
    console.log("Checking viral posts for NN...");

    request({
    headers: {
      'Authorization': "Client-ID 955b46c3898a829",
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    uri: 'https://api.imgur.com/3/gallery/hot',
    method: 'GET'
  }, function (err, res, body) {
        var data = JSON.parse(body);
        var posts = data["data"];
        posts.forEach(function(postData){
            var tags = postData["tags"];
            tags.forEach(function(tag){
                if(tag.name == "net_neutrality"){
                    console.log("Found viral NN post!");

                    fs.readFile('imgurPosts.json', 'utf8', function readFileCallback(err, data){
                        if (err){
                            console.log(err);
                        } else {
                            obj = JSON.parse(data);
                            var checked = 0;
                            obj["posts"].forEach(function(post){
                                if(post.link != postData.link){
                                    checked += 1;
                                }
                            });

                            if(checked == obj["posts"].length){
                                obj.posts.push({link: postData.link, datetime: postData.datetime});
                                var json = JSON.stringify(obj);
                                fs.writeFile('imgurPosts.json', json, 'utf8', function(){
                                    console.log("Written to JSON");
                                });
                                sendMessage("New viral Imgur Post! " + postData.link, intelligenceChannel);
                            } else {
                                console.log("Post already recorded");
                            }
                    }});
                }
            });
        });
    });
}

var imgurMinutes = 30;
var imgurInterval = imgurMinutes * 60 * 1000;

setInterval(function() {checkViralPosts();}, imgurInterval);

client.login('');

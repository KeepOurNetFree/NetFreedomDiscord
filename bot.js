var request = require('request');
const Discord = require("discord.js");
const client = new Discord.Client();

var newMemberChannel = 295745377083326464;
var newRedditPostChannel = 295748944347004948;

var devChannelID = 270601378341191681;

client.on('ready', () => {
  console.log("Connected!");
});

client.on('message', msg => {
    if (msg.content === 'KONF test') {
        msg.reply('Up and running! ;D');
    }
    if (msg.content === 'KONF subscribers') {
        checkSubCount();
    }
});

client.on('guildMemberAdd', member => {
    sendMessage("Welcome " + member.user + " to Keep Our Net Free!", devChannelID);
});

var newestPostTitle = "";

function checkForNewPost () {
    request("https://www.reddit.com/r/KeepOurNetFree/new/.json", function (error, response, body) {
        if(error){
           console.log(error);
        } else {
            var postData = JSON.parse(body);
            var checkPost = postData["data"]["children"][0]["data"].title;
            var checkPostURL = "https://www.reddit.com" + postData["data"]["children"][0]["data"].permalink;
            
            if(newestPostTitle != checkPost){
                newestPostTitle = checkPost;
                sendMessage("New KONF reddit post! \"" + newestPostTitle + "\" " + checkPostURL, devChannelID);
            } else {
                console.log("No new posts D:");
            }
        }
    });
}

var minutes = 1;
var interval = minutes * 60 * 1000;
var subCountInterval = (minutes * 30) * 60 * 1000;

setInterval(checkForNewPost, interval);

var currentSubCount = 0;

function checkSubCount () {
    request("https://www.reddit.com/r/KeepOurNetFree/about.json", function(error, response, body) {
        if(error){
            console.log(error);
        } else {
            var subData = JSON.parse(body);
            var subscriberCount = subData["data"].subscribers;
            
            if(subscriberCount - currentSubCount >= 1000){
                sendMessage("Current subscriber count: " + subscriberCount, devChannelID);
            } else {
                console.log("Sub change over past 30 minutes: " + subscriberCount - currentSubCount);
            }
        } 
    });
}

setInterval(checkForNewPost, subCountInterval);

function sendMessage (msg, channelID) {
    client.guilds.forEach(function(guild){
        guild.channels.forEach(function(channel){
           if(channel.id == channelID){
               channel.sendMessage(msg);
               console.log("Sent message: " + msg);
           }
        });
    });
}

client.login('');
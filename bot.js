var request = require('request');
const Discord = require("discord.js");
const client = new Discord.Client();

var newMemberChannel = 295745377083326464;
var newRedditPostChannel = 295748944347004948;

//var devChannelID = 270601378341191681;

client.on('ready', () => {
  console.log("Connected!");
});

client.on('message', msg => {
  if (msg.content === 'KONF test') {
      msg.reply('Up and running! ;D');
  }
});

client.on('guildMemberAdd', member => {
    sendMessage("Welcome " + member.user + " to Keep Our Net Free!", newMemberChannel);
});

var newestPostTitle = "";

function checkForNewPost () {
    request('https://www.reddit.com/r/KeepOurNetFree/new/.json', function (error, response, body) {
        if(error){
           console.log(error);
        } else {
            var postData = JSON.parse(body);
            var checkPost = postData["data"]["children"][0]["data"].title;
            var checkPostURL = postData["data"]["children"][0]["data"].url;
            
            if(newestPostTitle != checkPost){
                newestPostTitle = checkPost;
                sendMessage("New KONF reddit post! \"" + newestPostTitle + "\" " + checkPostURL, newRedditPostChannel);
            } else {
                console.log("No new posts D:");
            }
        }
    });
}

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

var minutes = 1;
var interval = minutes * 60 * 1000;

setInterval(checkForNewPost, interval);

client.login('');
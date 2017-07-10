var request = require('request');
const Discord = require('discord.js');
const client = new Discord.Client();

//ID for landing pad
var newMemberChannel = 295745377083326464;

//ID for subreddit-pr channel
var newRedditPostChannel = 296414495478382592;

//ID for botdump channel
var botLoggingChannel = 296674818026373123;

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
    if(msg.author.id == 163267288592547840 || msg.author.id == 158015835410137089 || msg.author.id == 295745698060828672 || msg.author.id == 261345443039019009 && msg.content.includes("KONF broadcast")){
        broadcastmsg = msg.content.replace("KONF broadcast", "");
        broadcastMessage(broadcastmsg);
    }
});

//the ID for channel #info
var infoChannelID = 296678122135355393;
//undefined varible which will become a GuildChannel object once the next loop runs at startup
var infoChannel;

function findInfoChannel() {
    client.guilds.forEach(function (guild) {
        guild.channels.forEach(function (channel) {
            if (channel.id == infoChannelID) {
                //sets the info channel so we can use it in the mentions later
                infoChannel = channel;
            }
        });
    });
}

//when someone joins this event is called, the variable member is of type GuildMember in Discord.JS
client.on('guildMemberAdd', member => {
    //welcome the new user
    sendMessage("Welcome " + member.user + "! Thanks for helping to Keep Our Net Free! Be sure to give " + infoChannel + " a read!", newMemberChannel);
    sendMessage("User " + member.user + " has joined.", botLoggingChannel);
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
    //loop through all guilds the bot's in, currently only 1, the KONF server
    client.guilds.forEach(function (guild) {
        //in each guild loop through every channel, if it matches the channel we want the message to send to, send it
        guild.channels.forEach(function (channel) {
            if (channel.id == channelID) {
                //send the message and log it
                channel.sendMessage(msg);
                console.log('Sent message: ' + msg);
            }
        });
    });
}

//sends a direct message to all members in the guild
function broadcastMessage(msg) {
    client.guilds.forEach(function (guild) {
        guild.members.forEach(function (member) {
            console.log("Sending message to " + member.user.username);
            member.user.send(msg);
        });
    });
}

client.login('');

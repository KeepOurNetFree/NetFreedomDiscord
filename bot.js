var request = require('request');
const Discord = require('discord.js');
const client = new Discord.Client();

var newMemberChannel = 295745377083326464;
var newRedditPostChannel = 295748944347004948;

//var devChannelID = 270601378341191681;

client.on('ready', () => {
    console.log('Connected!');
});

client.on('message', msg => {
    if (msg.content === 'KONF help') {
        msg.reply('New members are welcomed automatically. Run "KONF subscribers" to see the current sub count.');
    }
    if (msg.content === 'KONF subscribers') {
        checkSubCount();
    }
});

client.on('guildMemberAdd', member => {
    sendMessage('Welcome ' + member.user + ' to Keep Our Net Free!', newMemberChannel);
});

//Current UTC time. Reddit uses seconds, not milliseconds like JS
var newestPostTimeUTC = Math.floor(new Date().getTime() / 1000);

function checkForNewPost() {
    request('https://www.reddit.com/r/KeepOurNetFree/new/.json', function (error, response, body) {
        if (error) {
            console.log(error);
        }
        else {
            //A try/catch for if the postdata is invalid JSON, if there's no first child, no permalink, etc.
            try {
                var postData = JSON.parse(body);
                var checkPostTimeUTC = postData['data']['children'][0]['data'].created_utc;
                var checkPostTitle = postData['data']['children'][0]['data'].title;
                var checkPostURL = 'https://www.reddit.com' + postData['data']['children'][0]['data'].permalink;

                if (newestPostTimeUTC < checkPostTimeUTC) {
                    newestPostTimeUTC = checkPostTimeUTC;
                    sendMessage('New KONF reddit post! "' + checkPostTitle + '" ' + checkPostURL, newRedditPostChannel);
                    console.log('New reddit post! ' + checkPostURL);
                }
            }
            catch (err) {
                console.log('Error while getting latest Reddit post: ' + err.message)
            }
        }
    });
}

var minutes = 1;
var interval = minutes * 60 * 1000;

setInterval(checkForNewPost, interval);

var currentSubCount = 0;

function checkSubCount() {
    request('https://www.reddit.com/r/KeepOurNetFree/about.json', function (error, response, body) {
        if (error) {
            console.log(error);
        }
        else {
            var subData = JSON.parse(body);
            var subscriberCount = subData['data'].subscribers;

            sendMessage('Current subscriber count: ' + subscriberCount, newRedditPostChannel);
            console.log('Current subscriber count: ' + subscriberCount);
        }
    });
}

function sendMessage(msg, channelID) {
    client.guilds.forEach(function (guild) {
        guild.channels.forEach(function (channel) {
            if (channel.id == channelID) {
                channel.sendMessage(msg);
                console.log('Sent message: ' + msg);
            }
        });
    });
}

client.login('');

const Discord = require("discord.js");
const client = new Discord.Client();

client.on('ready', () => {
  console.log("Connected!");
});

client.on('message', msg => {
  if (msg.content === 'test') {
    msg.channel.send('Up and running ;D');
  }
});

client.on('guildMemberAdd', member => {
   member.guild.channels.forEach(function(channel){
       if(channel.id == 295745377083326464){
           channel.sendMessage("Welcome @" + member.user + " to Keep Our Net Free!");
           console.log("Member " + member.user.username + " joined");
       }
   });
});

client.login('Mjk1OTQzNjcxMjk0MDY2Njk5.C7rDCA.M3HrWkkL9MnJ2DuqFGJC1Zy-46E');
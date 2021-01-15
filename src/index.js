/**
 * 
 * todo:
 * 
 * -upvote
 * -addme songname
 * -rework addme into new features
 * 
 */

require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const timer = require('./timer')
const karaoke = require('./karaoke')
const auth = require('./auth');
process.on("unhandledRejection", console.error);

//declare prefix
var prefix = 'k ' 


//declare dafault karaoke host role
var hostRole = 'Karaoke Host'

//bot login with client token
bot.login(TOKEN);

//listening to ready event
bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
  bot.user.setPresence({
    status: "online",  // You can show online, idle... Do not disturb is dnd
    activity: {
        name: `${prefix} help`,  // The message shown
        type: "PLAYING" // PLAYING, WATCHING, LISTENING, STREAMING,
    }
});
});

//listening to message events
bot.on('message', msg => {


  //listen for help
  if(msg.content == `${prefix}help`){

    //help message embed structure
    const embed = new Discord.MessageEmbed()
                    .setColor('#8cd9ff')
                    .setTitle('Karrie commands')
                    .setDescription('List of all available Karrie commands')
                    .setAuthor('Karrie')
                    .attachFiles(['./res/karrie.png'])
                    .setThumbnail('attachment://karrie.png')
                    .addFields({ name: '\u200B', value: '\u200B' },
                                {name : '**__General commands:__**', value : "\u200b"},
                                {name :`\`${prefix}help\``, value:`Shows available commands for Karrie`,inline: true},
                                {name :`\`${prefix}ping\``, value:`Checks your ping with the bot`,inline: true},
                                { name: '\u200B', value: '\u200B' },
                                {name:'**__Karaoke commands:__**', value : "\u200b"},
                                {name :`\`${prefix}quickstart\``, value:`Starts karaoke session with the people in the same voice channel`,inline: true},
                                {name :`\`${prefix}start\``, value:`Starts karaoke session the manual way`,inline: true},
                                {name :`\`${prefix}stop\``, value:`Stops ongoing karaoke session`,inline: true},
                                {name :`\`${prefix}addme\``, value:`Adds you to the karaoke queue`,inline: true},
                                {name :`\`${prefix}removeme\``, value:`Removes you from the karaoke queue`,inline: true},
                                {name :`\`${prefix}done\``, value:`Pass the turn to the next person in queue`,inline: true},
                                { name: '\u200B', value: '\u200B' },
                                {name:'**__Admin commands:__**\n__*Only those who has admin permissions can use these commands*__', value : "\u200b"},
                                {name :`\`${prefix}hostrole <VALUE>\``, value:`Change the role to be recognized by Karrie as a karaoke host`,inline: true},
                                {name :`\`${prefix}setprefix <VALUE>\``, value:`Change the prefix for Karrie commands.`,inline: true},
                                { name: '\u200B', value: '\u200B' },
                                {name:`**__Karaoke host commands:__**\n__*Only those who has admin permissions or ${hostRole} role can use these commands*__`, value : "\u200b"},
                                {name :`\`${prefix}settimer <VALUE_IN_SECONDS>\``, value:`Change the duration of a person is given to sing. To disable, set this to 0`,inline: true},
                                {name :`\`${prefix}skip\``, value:`Skip the current person in karaoke queue`,inline: true}
                                )
                  
                    .setTimestamp()
	                 

 

    msg.channel.send(embed)

  }

  //listen for ping
  if(msg.content == `${prefix}ping`){

     // It sends the user "Pinging"
     msg.channel.send("Pinging...").then(m =>{
      // The math thingy to calculate the user's ping
        var ping = m.createdTimestamp - msg.createdTimestamp;

      // Basic embed
        var embed =  ` Your ping is ${ping} ms from Karrie`
        
        // Then It Edits the message with the ping variable embed that you created
        m.edit(`${msg.author} ${embed}`)
    });
  }

  //listen for settimer
  if(msg.content.startsWith(`${prefix}settimer`)){

    //admin authentication
    if(!auth.authenticate(msg.member.roles.cache,hostRole) && !msg.member.hasPermission('ADMINISTRATOR')){
      return msg.channel.send(`YOU ARE NOT WORTHY ${msg.author}`)
    }

    var newDuration = msg.content.substr(`${prefix}settimer `.length)
    //disable timer
    if(!parseInt(newDuration)){
      timer.setDuration(parseInt(newDuration))
      return msg.channel.send(`Timer has been disabled!`)
    }

    //min and max limit(3 to 7 minutes)
    if(parseInt(newDuration) > 420 || parseInt(newDuration) < 0){
      return msg.channel.send('Please enter a valid integer less than \`420\` seconds!')
    }

    timer.setDuration(parseInt(newDuration))
    return msg.channel.send(`Duration has been updated to \`${newDuration}\` seconds per person!`)
    


  }

  //listen for setprefix
  if(msg.content.startsWith(`${prefix}setprefix`)){

    //admin check
    if(!auth.authenticate(msg.member.roles.cache,hostRole) && !msg.member.hasPermission('ADMINISTRATOR')){
      return msg.channel.send(`YOU ARE NOT WORTHY ${msg.author}`)
    }
    
    

    var newPrefix = msg.content.substr(`${prefix}setprefix `.length)
    if(!newPrefix){
      msg.reply(' No prefix detected!')
      return
    }

    //sets new prefix
    prefix = newPrefix+" "
    msg.reply(` You have set the prefix to : ${newPrefix}`)

    //update bots presence
    bot.user.setPresence({
      status: "online",  // You can show online, idle... Do not disturb is dnd
      game: {
          name: `${prefix} help`,  // The message shown
          type: "PLAYING" // PLAYING, WATCHING, LISTENING, STREAMING,
      }
  });
  }

  //listen for skip
  if(msg.content == `${prefix}skip`){

    //admin authentication
    if(!auth.authenticate(msg.member.roles.cache,hostRole) && !msg.member.hasPermission('ADMINISTRATOR')){
      return msg.channel.send(`YOU ARE NOT WORTHY ${msg.author}`)
    }

    karaoke.skip(prefix, (err,data)=>{
      if(err){
        return msg.channel.send(err)
      }
      return msg.channel.send(data)
    })
  }

  //listen for quickstart
  if(msg.content == `${prefix}quickstart`){
    //set vc id to auth
    var guild = msg.guild
    var member = guild.members.cache.get(msg.author.id)
    var channel = bot.channels.cache.get(member.voice.channelID) // different declaration (using bot)
    auth.setSessionID(member.voice.channelID)

    //check if the user is in a voice channel
    if(!channel){
      return msg.channel.send('You are not in a voice channel!')
    }

    //minimum 3 people are required in a channel to initialize a vote
    var channelSize = channel.members.size
    if(channelSize < 3){
      return msg.channel.send('A minimum of 3 people is required to start a quickstart session!')
    }

    //creating queue
    var queue = []

    //creating custom embed
    const embed = new Discord.MessageEmbed()
    .setColor('#8cd9ff')
    .addFields(
      { name: `${msg.author.username} wants to start a karaoke session!`, value: `react with 🎙️ to participate \`(${channelSize *(2/3)} participants needed.)\`` },
    )
    .setTimestamp()
  
    //listen for emoji votes
    msg.channel.send(embed).then((sentMsg)=>{
      sentMsg.react('🎙️')
      const filter = (reaction, user) => {
        return reaction.emoji.name === '🎙️'
      };
      
      const collector = sentMsg.createReactionCollector(filter, { time: 9000 });
    
      //on every reaction confirmed, push said user to queue
      collector.on('collect', (reaction, user) => {
        var reactedMember = guild.members.cache.get(user.id)
        if(!reactedMember) return // bots reaction
        if(auth.vcAuth(reactedMember.voice.channelID)){
          queue.push(user)
        }
        else{
          if(user.bot){
            return
          }
          msg.channel.send(`${user}, please join the voice channel, \`${member.voice.channel.name}\` to participate!`)
        }
        
      });

      collector.on('end', collected => {
        //checks if the collected size is equals of expected number of people to start
        if(queue.length < channelSize *(2/3)){
          return msg.channel.send('Not enough votes to begin the session :(')
        }

        //sets the queue and begins the session
        karaoke.setQueue(queue)
        karaoke.start(prefix,(err,data)=>{
          if(err){
            return msg.channel.send(err)
          }
          return msg.channel.send(data)
        })
      });
    })

    
  }

  //listen for start
  if(msg.content == `${prefix}start`){
    var guild = msg.guild
    var member = guild.members.cache.get(msg.author.id)

    //vc check
    if(!member.voice.channel){
      return msg.channel.send(`You are not in a voice channel, ${msg.author}`)
    }

    //set vc id to auth
    auth.setSessionID(member.voice.channelID)

    karaoke.start(prefix,(err,data)=>{
      if(err){
        return msg.channel.send(err)
      }
      return msg.channel.send(data)
    })
  }

  //listen for stop
  if(msg.content == `${prefix}stop`){
    //admin check
    //admin authentication
    if(!auth.authenticate(msg.member.roles.cache,hostRole) && !msg.member.hasPermission('ADMINISTRATOR')){
      return msg.channel.send(`YOU ARE NOT WORTHY ${msg.author}`)
    }

    karaoke.stop(prefix,(err,data)=>{
        if(err){
          return msg.channel.send(err)
        }
        return msg.channel.send(data)
    })
  }

  //listen for addme
  if(msg.content == `${prefix}addme`){
    //vc auth
    var guild = msg.guild
    var member = guild.members.cache.get(msg.author.id)
    var channel = msg.guild.channels.cache.get(auth.getSessionID())
    
    if(!channel){
      return msg.channel.send(`No session active! Please use \`${prefix}start\` to start a session!`)
    }
    
    if(!auth.vcAuth(member.voice.channelID)){
      return msg.channel.send(`${msg.author}, please join the voice channel, \`${channel.name}\` to participate!`)
    }

    //add author to karaoke queue
    karaoke.addme(msg.author, prefix, (err,data)=>{
      if(err){
        return msg.channel.send(err)
      }
      return msg.channel.send(data)
    })
  }

  //listen for removeme
  if(msg.content == `${prefix}removeme`){
    karaoke.removeme(msg.author, prefix, (err,data)=>{
      if(err){
        return msg.channel.send(err)
      }
      return msg.reply(data)
    })
  }

  //listen for done
  if(msg.content == `${prefix}done`){
   karaoke.done(msg.author,prefix,(err,data)=>{
     if(err){
       return msg.channel.send(err)
     }
     return msg.channel.send(data)
   })
  }
  //listen for queue
  if(msg.content == `${prefix}queue`){
   karaoke.showqueue(prefix,(err,data)=>{
     if(err){
      return  msg.channel.send(err)
     }
     const embed = new Discord.MessageEmbed()
     .setColor('#8cd9ff')
     .setAuthor('Karrie')
     .addField('Queue for current karaoke session',`${data}`)
     .setTimestamp()


     return msg.channel.send(embed)
   })
  }
 

  //listen for hostrole
  if(msg.content.startsWith(`${prefix}hostrole`)){

     //admin check
     if(!msg.member.hasPermission('ADMINISTRATOR')){
      return msg.channel.send(`YOU ARE NOT WORTHY ${msg.author}`)
    }
    
    

    var newRole = msg.content.substr(`${prefix}hostrole `.length)
    if(!newRole){
      msg.reply(' No input detected!')
      return
    }

    hostRole = newRole
    return msg.channel.send(`Karrie now knows \`${newRole}\` are karaoke hosts!`)
  }

});

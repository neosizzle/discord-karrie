/**
 * 
 * todo:
 * -adda new field for session id(the vc where the karaoke session is)(auth)
 * 
 * 
 * -upvote
 * -addme songname
 * 
 * 
 */

require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;

//required modules
const auth = require('./auth');
const karaoke = require('./karaoke')



process.on("unhandledRejection", console.error);

require('../db/mongoose')//establishing connection to db
const Guild = require('../models/Guild')

//instansiate prefix
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
        name: `k help`,  // The message shown
        type: "PLAYING" // PLAYING, WATCHING, LISTENING, STREAMING,
    }
});
});

//joined a server
bot.on("guildCreate", async (guild) => {
  console.log("Joined a new guild: " + guild.name)

  //create new guild obejct with guildid
  var newGuild = new Guild({
    guildId : guild.id
  })

  //attempt to save guild in db with default values
  try{
    await newGuild.save()

  }catch(e){
    console.error(e)
  }
  
  //send welc msg
  let defaultChannel = "";
  guild.channels.cache.forEach((channel) => {
    if(channel.type == "text" && defaultChannel == "") {
      if(channel.permissionsFor(guild.me).has("SEND_MESSAGES")) {
        defaultChannel = channel;
      }
    }
  })

  defaultChannel.send(`Thanks for having me! Use \`${prefix}start\` to start a karaoke session or use \`${prefix}help\` to view my commands.`)
  

})

//left a server
bot.on("guildDelete", async(guild)=>{
  console.log("Left guild: " + guild.name)
  

  //attempt to delete guild in db
  try{
    await Guild.deleteOne({guildId : guild.id})
    console.log('Guild removed!')
  }catch(e){
    console.error(e)
  }
})

//listening to message events
bot.on('message', async msg => {
  //change the prefix to listen for according to the server
  if(!msg.author.bot){
    try{
      var guild = await Guild.findOne({guildId : msg.guild.id})
      prefix = guild.prefix
    }catch(e){
      //'that gay prefix error that i cant find... yet'
      return
    }

  }


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
                                {name :`\`${prefix}skip\``, value:`Skip the current person in karaoke queue`,inline: true},
                                {name :`\`${prefix}stop\``, value:`Stops ongoing karaoke session`,inline: true}
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
    //get guild id
    var ReceivedGuildlId = msg.guild.id 

    //admin authentication
    if(!auth.authenticate(msg.member.roles.cache,hostRole) && !msg.member.hasPermission('ADMINISTRATOR')){
      return msg.channel.send(`YOU ARE NOT WORTHY ${msg.author}`)
    }

    var newDuration = msg.content.substr(`${prefix}settimer `.length)


    //min and max limit(3 to 7 minutes)
    if(parseInt(newDuration) > 420 || parseInt(newDuration) < 0){
      return msg.channel.send('Please enter a valid integer less than \`420\` seconds!')
    }

    //disable timer
    if(!parseInt(newDuration)){
      try{
       await Guild.updateOne({guildId : ReceivedGuildlId}, {duration : 0})
       return msg.channel.send(`Timer has been disabled!`)
      }catch(e){
        console.error(e)
      }

    }

    

    //change the duration in db
    try{
      await Guild.updateOne({guildId : ReceivedGuildlId}, {duration : parseInt(newDuration*1000)})
      return msg.channel.send(`Duration has been updated to \`${newDuration}\` seconds per person!`)
     }catch(e){
       console.error(e)
     }
    
    


  }

  //listen for setprefix
  if(msg.content.startsWith(`${prefix}setprefix`)){

    //get guild id
    var ReceivedGuildlId = msg.guild.id

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
    newPrefix += " "
    try{
      await Guild.updateOne({guildId : ReceivedGuildlId}, {prefix : newPrefix})
      return   msg.reply(` You have set the prefix to : ${newPrefix}`)
    }catch(e){
      console.error(e)
    }
  }

  //listen for skip
  if(msg.content == `${prefix}skip`){

      //get credentials from msg
      var guildId = msg.guild.id
      var channel = msg.channel.id


      //looks for current guild in Db
      try{
        var guild = await Guild.findOne({guildId : guildId})
      }catch(e){
        console.error(e)
      }

    //admin authentication
    if(!auth.authenticate(msg.member.roles.cache,guild.hostRole) && !msg.member.hasPermission('ADMINISTRATOR')){
      return msg.channel.send(`YOU ARE NOT WORTHY ${msg.author}`)
    }

    karaoke.skip(prefix,{guildId : guildId, channelId : channel, userId : guild.queue[0]}, (data,credentials)=>{
      if(!data){
        return bot.channels.cache.get(credentials.channelId).send(`Its ${bot.users.cache.find(user => user.id === credentials.userId)}'s turn to sing now!`)
      }
      return bot.channels.cache.get(credentials.channelId).send(data)
    })
  }

  //listen for quickstart
  if(msg.content == `${prefix}quickstart`){


    //get credentials
    var channel = msg.channel
    var guild = msg.guild
    var member = guild.members.cache.get(msg.author.id)
    var voiceChannel = bot.channels.cache.get(member.voice.channelID) // different declaration (using bot)
    //var voiceChannel = msg.member.voice

    //looks for current guild in Db
    try{
      var currentGuild = await Guild.findOne({guildId : guild.id})
    }catch(e){
      console.error(e)
    }

    //set session id into guild in db
    auth.setSessionID(member.voice.channelID,{guildId : currentGuild.guildId})

    //set ongoing uninterruptable event in db (disables other karaoke session starting events)
    try{
      await Guild.updateOne({guildId : guild.id},{ongoingEvent : true})
    }catch(e){
      console.error(e)
    }

    //check if the user is in a voice channel
    if(!channel){
      return msg.channel.send('You are not in a voice channel!')
    }

    //minimum 3 people are required in a channel to initialize a vote
    var channelSize = voiceChannel.members.size

    if(channelSize < 3){
      //set ongoing uninterruptable event in db (disables other karaoke session starting events)
      try{
        await Guild.updateOne({guildId : guild.id},{ongoingEvent : false})
      }catch(e){
        console.error(e)
      }

      return msg.channel.send('A minimum of 3 people is required to start a quickstart session!')
    }

    

    //creating custom embed
    const embed = new Discord.MessageEmbed()
    .setColor('#8cd9ff')
    .addFields(
      { name: `${msg.author.username} wants to start a karaoke session!`, value: `react with 🎙️ to participate \`(${Math.round(channelSize *(2/3))} participants needed.)\`` },
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
      collector.on('collect', async (reaction, user) => {
        var reactedMember = guild.members.cache.get(user.id)
        var isAuthed = await auth.vcAuth(reactedMember.voice.channelID,{guildId : guild.id})
        if(user.bot) return // bots reaction
        if(isAuthed){

          //creating queue and pushing user id
          var newQueue = currentGuild.queue

          //ignores duplicates
          if(newQueue.indexOf(user.id) != -1){
            return
          } 

          newQueue.push(user.id)
          

          //updates db with new queue
          try{
            await Guild.updateOne({guildId : guild.id},{queue : newQueue})
          }catch(e){
            console.error(e)
          }

        }
        else{
          //reacted user is not in the voice channel
       return msg.channel.send(`${user}, please join the voice channel, \`${member.voice.channel.name}\` to participate!`)
        }
        
        
      });

      collector.on('end', async collected => {

        //looks for current guild in Db
        try{
          var currentGuild = await Guild.findOne({guildId : guild.id})

          //stop uninterruptable  event
          await Guild.updateOne({guildId : guild.id} , {ongoingEvent : false, voiceChannelId : ''})

          //checks if the collected size is equals of expected number of people to start
          if(currentGuild.queue.length < channelSize *(2/3)){
            return msg.channel.send('Not enough votes to begin the session :(')
          }

          //sets the queue and begins the session
          karaoke.start(prefix,{guildId : currentGuild.guildId, channelId : msg.channel.id, userId : msg.author.id},(data,credentials)=>{
            return bot.channels.cache.get(credentials.channelId).send(data)
          })

        }catch(e){
          console.error(e)
        }

      });
    })

    
  }

  //listen for start
  if(msg.content == `${prefix}start`){


    var guild = msg.guild
    var channel = msg.channel
    var member = guild.members.cache.get(msg.author.id)

    //looks for current guild in Db
    try{
      var currentGuild = await Guild.findOne({guildId : guild.id})
    }catch(e){
      console.error(e)
    }

    //if ongoing event is true, cancel the action
    if(currentGuild.ongoingEvent){
      return msg.channel.send(`You cant do that right now!`)
    }


    //vc check
    if(!member.voice.channel){
      return msg.channel.send(`You are not in a voice channel, ${msg.author}`)
    }

    //set vc id to auth
    auth.setSessionID(member.voice.channelID,{guildId : guild.id, channelId : channel.id, userId : msg.author.id})
    
 
    //starts karaoke session
    karaoke.start(guild.prefix,{guildId : guild.id, channelId : channel.id, userId : msg.author.id,type : 'session expire'},(data,credentials)=>{
      return bot.channels.cache.get(credentials.channelId).send(data)
    })

  }

  //listen for stop
  if(msg.content == `${prefix}stop`){
    //get credentials from msg
    var guild = msg.guild
    var channel = msg.channel

    //looks for current guild in Db
    try{
      var currentGuild = await Guild.findOne({guildId : guild.id})
    }catch(e){
      console.error(e)
    }

    //admin check
    //admin authentication
    if(!auth.authenticate(msg.member.roles.cache,currentGuild.hostRole) && !msg.member.hasPermission('ADMINISTRATOR')){
      return msg.channel.send(`YOU ARE NOT WORTHY ${msg.author}`)
    }

    karaoke.stop(prefix,{guildId : guild.id, channelId : channel.id},(data,{guildId,channelId})=>{
      return bot.channels.cache.get(channelId).send(data)
    })
  }

  //listen for addme
  if(msg.content == `${prefix}addme`){
    //get credentials from msg
    var guild = msg.guild.id
    var channel = msg.channel.id
    var user = msg.author.id
    var member = msg.guild.members.cache.get(msg.author.id)
    var voiceChannel = member.voice.channelID

    
    if(!channel){
      return msg.channel.send(`No session active! Please use \`${prefix}start\` to start a session!`)
    }

    var vcName = msg.guild.channels.cache.get(await auth.getSessionID({guildId : guild, channelId : channel, userId : user})).name
    
    //vc auth
    if(! await auth.vcAuth(voiceChannel,{guildId : guild, channelId : channel, userId : user})){
      return msg.channel.send(`Please join the voice channel \`${vcName}\` to participate!`)
    }
    

    // if(!auth.vcAuth(member.voice.channelID)){
    //   return msg.channel.send(`${msg.author}, please join the voice channel, \`${channel.name}\` to participate!`)
    // }

    //add author to karaoke queue
    karaoke.addme(prefix,{guildId : guild, channelId : channel,userId : user}, (data,credentials)=>{
      if(data){
        return bot.channels.cache.get(credentials.channelId).send(data)
      }
      return bot.channels.cache.get(credentials.channelId).send(`Its ${bot.users.cache.find(user => user.id === credentials.userId)}'s turn to sing now!`)
      
    })
  }

  //listen for removeme
  if(msg.content == `${prefix}removeme`){

    //get credentials from msg
    var guild = msg.guild.id
    var channel = msg.channel.id
    var user = msg.author.id

    karaoke.removeme(prefix,{guildId: guild, channelId:channel,userId:user}, (data,credentials)=>{
      return bot.channels.cache.get(credentials.channelId).send(data)
    })
  }

  //listen for done
  if(msg.content == `${prefix}done`){

    //get credentials from msg
    var guild = msg.guild.id
    var channel = msg.channel.id
    var user = msg.author.id


   karaoke.done(prefix,{guildId : guild, channelId : channel,userId : user}, (data,credentials)=>{
      if(data){
        return bot.channels.cache.get(credentials.channelId).send(data)
      }
      return bot.channels.cache.get(credentials.channelId).send(`Its ${bot.users.cache.find(user => user.id === credentials.userId)}'s turn to sing now!`)
      
    })
  }
  //listen for queue
  if(msg.content == `${prefix}queue`){

    //get credentials from msg
    var guild = msg.guild.id
    var channel = msg.channel.id
    var user = msg.author.id


      //looks for current guild in Db
      try{
        var guild = await Guild.findOne({guildId : guild})
      }catch(e){
        console.error(e)
      }
  
      //no session
      if(!guild.session){
          return bot.channels.cache.get(channel).send(`No session active! Please use \`${prefix}start\` to start a session!`)      
        }
  
      //string concat
      var queueString = ``
      for(i = 0; i < guild.queue.length; i++){
        var username = bot.users.cache.get(guild.queue[i])
        queueString += `${i+1}. ${username}\n`
      }
  
      //no one in queue
      if(guild.queue == ``){
        return bot.channels.cache.get(channel).send(`Queue is empty! Please use \`${prefix}addme\` to start singing!`)      
      
      }
      
      //create embed
      const embed = new Discord.MessageEmbed()
     .setColor('#8cd9ff')
     .setAuthor('Karrie')
     .addField('Queue for current karaoke session',`${queueString}`)
     .setTimestamp()


     //return embed to chanel
      queueString = ``
      return bot.channels.cache.get(channel).send(embed)

  }
 

  //listen for hostrole
  if(msg.content.startsWith(`${prefix}hostrole`)){

    //get credentials from msg
    var guild = msg.guild
    var channel = msg.channel
    var member = guild.members.cache.get(msg.author.id)



     //admin check
     if(!msg.member.hasPermission('ADMINISTRATOR')){
      return msg.channel.send(`YOU ARE NOT WORTHY ${msg.author}`)
    }
    
    

    var newRole = msg.content.substr(`${prefix}hostrole `.length)
    if(!newRole){
      msg.reply(' No input detected!')
      return
    }

    //looks for current guild in Db
    try{
      await Guild.updateOne({guildId : guild.id}, {hostRole : newRole})
    }catch(e){
      console.error(e)
    }

    return msg.channel.send(`Karrie now knows \`${newRole}\` are karaoke hosts!`)
  }

});


/**
 * 
 * todo:
 * 
 * -deployment
 */

require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const timer = require('./timer')
const karaoke = require('./karaoke')
const auth = require('./auth')

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
    game: {
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
                    .setAuthor('Karrie')
                    .setDescription('List of all available Karrie commands')
                    .attachFiles(['./res/karrie.png'])
                    .setThumbnail('attachment://karrie.png')
                    .addFields(
                      { name: '**General commands:**',
                       value: `${prefix}help \`Shows available commands for Karrie\`
                              ${prefix}ping \`Checks your ping with the bot\`` },
                      
                      { name: '**Karaoke commands:**',
                       value: `${prefix}start \`Starts karaoke session\`
                              ${prefix}stop \`Stops current karaoke session\`
                              ${prefix}addme \`Adds you to the karaoke queue\`
                              ${prefix}removeme \`Removes you from the karaoke queue\`
                              ${prefix}done \`Pass the turn to the next person in queue\`
                              `},
                      {name:'**Admin commands** \n__*Only those who has admin permissions can use these commands*__',
                       value :`${prefix}hostrole <VALUE> \` Change the role to be recognized by Karrie as a karaoke host.\`
                                ${prefix}setprefix <VALUE> \` Change the prefix for Karrie commands.\`
                                `},
                      {name:`**Karaoke host commands** \n__*Only those who has admin permissions or ${hostRole} role can use these commands*__`,
                        value:`${prefix}settimer <VALUE_IN_SECONDS> \` Change the duration of a person is given to sing.\`
                                ${prefix}skip \` Skip the current person in karaoke queue\``}
                    )
                    .setTimestamp()
	                  .setFooter('nszl#8082');

 

    msg.channel.send(embed)


    // msg.channel.send(`
    // ⠀
    // __Karrie commands__ 
    // **General commands:**
    // ${prefix}help \` Shows available commands for Karrie\`
    // ${prefix}ping \` Checks your ping with the bot\`
      
    // **Karaoke commands:**
    // ${prefix}start \` Starts karaoke session\`
    // ${prefix}stop \` Stops current karaoke session\`
    // ${prefix}addme \` Adds you to the karaoke queue(can only be used in a session)\`
    // ${prefix}removeme \` Removes you from the karaoke queue(can only be used in a session)\`
    // ${prefix}done \` Pass the turn to the next person in queue(can only be used in a session)\`
  
    

    // **Admin commands:**
    // _Only those who has the role \'Karaoke Host\' or admin rights may use these commands_
    // ${prefix}settimer <VALUE_IN_SECONDS> \` Change the duration of a person is given to sing.\`
    // ${prefix}setprefix <VALUE> \` Change the prefix for Karrie commands.\`
    // ${prefix}skip \` Skip the current person in karaoke queue\`
    // ${prefix}hostrole <VALUE> \` Change the role to be recognized by Karrie as a karaoke host.\`
    // `)
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
        m.edit(msg.author + embed)
    });
  }

  //listen for settimer
  if(msg.content.startsWith(`${prefix}settimer`)){

    //admin authentication
    if(!auth.authenticate(msg.member.roles.cache,hostRole) && !msg.member.hasPermission('ADMINISTRATOR')){
      return msg.channel.send(`YOU ARE NOT WORTHY ${msg.author}`)
    }

    var newDuration = msg.content.substr(`${prefix}settimer `.length)

    //min and max limit(3 to 7 minutes)
    if(!parseInt(newDuration) || parseInt(newDuration) > 420){
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

  //listen for start
  if(msg.content == `${prefix}start`){
    karaoke.start((err,data)=>{
      if(err){
        return msg.channel.send(err)
      }
      return msg.channel.send(data)
    })
  }

  //listen for stop
  if(msg.content == `${prefix}stop`){
    karaoke.stop(prefix,(err,data)=>{
        if(err){
          return msg.channel.send(err)
        }
        return msg.channel.send(data)
    })
  }

  //listen for addme
  if(msg.content == `${prefix}addme`){
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

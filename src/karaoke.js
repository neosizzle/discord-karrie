var turnTimer = require('./turnTimer')
var sessionTimer = require('./sessionTimer')
var Guild = require('../models/Guild')

//declare session variable and queue 
var queue = []
var session = false



//set queue in bulk
const setQueue = (arr)=>{
  queue = arr
  return
}

//get queue
const getQueue = ()=>{
  return queue
}

//start karaoke session
const start = async (prefix,credentials,callback)=>{

  //get the guild from db using guildid
  try{
    var guild = await Guild.findOne({guildId : credentials.guildId})
  }catch(e){
    return console.error(e)
  }
    //throws error when there is already an active session
    if(guild.session){
        return callback(`Session already active!`, credentials)
    }

    //update the guild session to true
    try{
      await Guild.updateOne({guildId : guild.guildId} , {session : true})
    }catch(e){
      console.error(e)
    }
    callback(`Session starting..`, credentials)


    //quickstart check
    if(guild.queue.length != 0){

      //user fetch module
      const fetch = require('node-fetch')

      //bot token
      const token = process.env.TOKEN

      //send get request to discord api to fetch user
      const fetchUser = async id => {
        const response = await fetch(`https://discord.com/api/v8/users/${id}`, {
          headers: {
            Authorization: `Bot ${token}`
          }
        })
        if (!response.ok) throw new Error(`Error status code: ${response.status}`)
        return await response.json()
      }

      var userObj = await fetchUser(guild.queue[0])

      //timer check
        if(guild.duration == 0){
          callback(`Its ${userObj.username}'s turn to sing now!`, credentials)
          return
        }

        //timer is enabled, start queue as usual
        //update the guild inturn to true
        try{
          await Guild.updateOne({guildId : guild.guildId} , {inTurn : true})
        }catch(e){
          console.error(e)
        }


        callback(`Each person is allowed \`${guild.duration / 1000}\` seconds to sing!`,credentials)
        callback(`Its ${userObj.username}'s turn to sing now!`, credentials)

        //start turn timer
        return turnTimer.startCountdown(credentials, async (credentials)=>{
          done(prefix,credentials, callback)
        })

        
    }

    //timer check
    if(guild.duration == 0){
      return
    }

    callback(`Each person is allowed \`${guild.duration / 1000}\` seconds to sing!`,credentials)

 
        //start counting down for idle session
        sessionTimer.startCountdown(credentials,async (credentials)=>{
          try{
            await Guild.updateOne({guildId : credentials.guildId},{session : false, inTurn : false, queue : []})
            return callback('Times up, session closing..', credentials)

          }catch(e){
            return console.error(e)
          }
        })
  

    return
    
}

//stops karaoke session
const stop = async (prefix,credentials,callback)=>{
  //get the guild from db using guildid
  try{
    var guild = await Guild.findOne({guildId : credentials.guildId})
  }catch(e){
    return console.error(e)
  }

    //throws error when there is no session
    if(!guild.session){
        return callback(`No session active! Please use \`${prefix}start\` to start a session!`,credentials)
    }

    //update properties in db
    try{
      await Guild.updateOne({guildId : credentials.guildId}, {session : false, inTurn : false, queue : [],voiceChannelId : ''})

      //stopping timer
      turnTimer.stopCountdown(credentials)
      sessionTimer.stopCountdown(credentials)
      return callback(`Karaoke session stopped!`,credentials)
    }catch(e){
      console.error(e)
    }
  
    
}

//adds person in queue
const addme = async (prefix,credentials,callback)=>{

  //looks for current guild in Db
  try{
    var guild = await Guild.findOne({guildId : credentials.guildId})
  }catch(e){
    console.error(e)
  }

    //no session
    if(!guild.session){
        return callback(` No session active! Please use \`${prefix}start\` to start a session!`,credentials)       
      }

    //user in queue
    if(guild.queue.includes(credentials.userId)){
        return callback(`Please wait until your turn has finished!`,credentials)       
      }

      //adds user to queue
      try{
        var tempQueue = guild.queue
        tempQueue.push(credentials.userId)
        await Guild.updateOne({guildId : credentials.guildId} , {queue : tempQueue})

      }catch(e){
          console.error(e)
      }
      callback(` You have been added into the queue! type \`${prefix}queue\` to view your position!`, credentials)

      //timer check with first person in queue
      if((!guild.duration || guild.inTurn) && guild.queue.length == 1){
      callback(null, credentials)//Its xs turn to sing now
      return
    }

    //check if the current user is the first on the queue
    if(guild.queue.length == 1){

      //update guild proterties
      try{
        await Guild.updateOne({guildId : credentials.guildId}, {inTurn : true})
      }catch(e){
        console.error(e)
      }

      

      callback(null,credentials)// its xs turn to sing now

      //stopping idle session coutndown
      sessionTimer.stopCountdown(credentials)

    
        //starts turn countdown
        turnTimer.startCountdown(credentials, async (credentials) => {
        return done(prefix,credentials, callback)
      })
      
      

      
    }

    return

}

//removes person in queue
const removeme = async (prefix,credentials, callback)=>{

  //looks for current guild in Db
  try{
    var guild = await Guild.findOne({guildId : credentials.guildId})
  }catch(e){
    console.error(e)
  }

    //no session
    if(!guild.session){
        return callback(` No session active! Please use \`${prefix}start\` to start a session!`,credentials)       
      }

    //user not in queue
    if(!guild.queue.includes(credentials.userId)){
        return callback(`You are not in the queue!`, credentials)
        
      }

    //user is singing now, use the done command instead
    if(credentials.userId == guild.queue[0]){
      return callback(`Use \`${prefix}done\` instead!`, credentials)
    }

    //remove the user in queue
    var tempQueue = guild.queue
      tempQueue = tempQueue.filter((userId)=>{
        return userId != credentials.userId
      })
      
    //update the queue in guild
    try{
      await Guild.updateOne({guildId : credentials.guildId} , {queue : tempQueue})

    }catch(e){
        console.error(e)
    }
      
      return callback(`You have been removed from the queue!`,credentials)
}

//person done with their turn
const done = async (prefix,credentials,callback)=>{

  //get guild from DB
  try{
    var guild = await Guild.findOne({guildId : credentials.guildId})
    
  }catch(e){
    console.error(e)
  }
    //no session
    if(guild.session == false){
        callback(` No session active! Please use \`${prefix}start\` to start a session!`,credentials)     
        return   
      }

      

    //user not in top of queue
    if(credentials.userId != guild.queue[0]){
      const fetch = require('node-fetch')

        //bot token
        const token = process.env.TOKEN

        //send get request to discord api to fetch user
        const fetchUser = async id => {
          const response = await fetch(`https://discord.com/api/v8/users/${id}`, {
            headers: {
              Authorization: `Bot ${token}`
            }
          })
          if (!response.ok) throw new Error(`Error status code: ${response.status}`)
          return await response.json()
        }

        var userObj = await fetchUser(credentials.userId)
        callback(`Its not your turn, ${userObj.username}`, credentials)
        return
        
      }

      

      //callback to index
      callback('Thank you for you performance!' , credentials)

      //shift the queue on db
      try{
        var tempQueue = guild.queue
        tempQueue.shift()
        await Guild.updateOne({guildId : credentials.guildId}, {queue : tempQueue})
      }catch(e){
        console.error(e)
      }
      
      //queue has no people left
      if(guild.queue.length == 0){

        //update guild properties in db
        try{
          await Guild.updateOne({guildId : credentials.guildId}, {inTurn : false})
        }catch(e){
          console.error(e)
        }

        //stop turn timer
        turnTimer.stopCountdown(credentials)

          
          callback(`Current queue is empty! Use \`${prefix}addme\` to sing!`,credentials)


          //start idle session timer
          sessionTimer.startCountdown(credentials,(credentials)=>{
            return stop(prefix,credentials,callback)
          })
        return
      }


      //timer disabled
      if(!guild.duration){
        //last person in queue
        if(guild.queue.length==0){
          //update guild properties in db
            try{
              await Guild.updateOne({guildId : credentials.guildId}, {inTurn : false})
            }catch(e){
              console.error(e)
            }
          return callback(`Queue is empty! use \`${prefix}addme\` to start singing!`,credentials)
          
        }

        callback(null,{guildId : credentials.guildId, channelId : credentials.channelId, userId : guild.queue[0]})//its xs turn to sing now
        return;
      }


      
      var newCreds = {
        guildId : credentials.guildId,
        channelId : credentials.channelId,
        userId : guild.queue[0]
      }

      //callback next singer to index
      callback(null,newCreds)//its xs turn to sing now

        //starts turn timer
        turnTimer.startCountdown(newCreds,(credentials)=>{
        
        done(credentials, prefix, callback)
      })

    


}


//skip the current person at queue
const skip = async (prefix,credentials,callback)=>{

  //looks for current guild in Db
  try{
    var guild = await Guild.findOne({guildId : credentials.guildId})
  }catch(e){
    console.error(e)
  }

  //no session
  if(!guild.session){
    return callback(` No session active! Please use \`${prefix}start\` to start a session!`,null)       
  }

  //no one to skip
  if(guild.queue.length == 0){
    return callback(`There is no one to skip!`, credentials)
  }

    //user fetch module
    const fetch = require('node-fetch')

    //bot token
    const token = process.env.TOKEN

    //send get request to discord api to fetch user
    const fetchUser = async id => {
      const response = await fetch(`https://discord.com/api/v8/users/${id}`, {
        headers: {
          Authorization: `Bot ${token}`
        }
      })
      if (!response.ok) throw new Error(`Error status code: ${response.status}`)
      return await response.json()
    }

    var userObj = await fetchUser(guild.queue[0])
    callback(`${userObj.username} has been skipped!`, credentials)

    //skipping, basiaclly calling done on current person
    turnTimer.stopCountdown(credentials)
    return done(prefix,credentials, callback)
    
    
  

}

module.exports = {
    setQueue,
    getQueue,
    start,
    stop,
    addme,
    removeme,
    done,
    skip
}


var timer = require('./timer')
var auth = require('./auth')

//declare session variable and queue 
var queue = []
var session = false

//declare inturn status
var inTurn = false

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
const start = (callback)=>{
    //throws error when there is already an active session
    if(session){
        return callback(' Karaoke session is already active!',null)
    }
    session = true
    callback(null, `Karaoke session started!`)

    //quickstart check
    if(queue.length != 0){
      inTurn = true
      callback(`Its ${queue[0]}'s turn to sing now!`)
      timer.startTurnTimer(() => { 
        done(queue[0], prefix, callback)
      })
    }

    //timer check
    if(!timer.getDuration()){
      return
    }

    callback(null , `Timer is enabled! each person has up to \`${timer.getDuration()} seconds\` to sing.`)
    //start counting down for idle session
    timer.startSessionCountdown(()=>{
      callback('Times up! session closing...', null)
      session = false
      inTurn = false
      queue = []
    })
}

//stops karaoke session
const stop = (prefix,callback)=>{
    //throws error when there is no session
    if(!session){
        return callback(`No session active! Please use \`${prefix}start\` to start a session!`,null)
    }
    session = false
    queue = []
    timer.stopTimer()
    return callback(null, `Karaoke session stopped!`)
}

//adds person in queue
const addme = (user,prefix,callback)=>{
    //no session
    if(!session){
        return callback(` No session active! Please use \`${prefix}start\` to start a session!`,null)       
      }

    //user in queue
    if(queue.includes(user)){
        return callback(`Please wait until your turn has finished!`,null)       
      }

      callback(null,` You have been added into the queue, ${user}! type \`${prefix}queue\` to view your position!`)
      queue.push(user)

      //timer check
      if(!timer.getDuration() || inTurn){
      return
    }

    //check if the current user is the first on the queue
    if(queue.length == 1){
      inTurn = true
      timer.stopTimer()
      callback(`Its ${queue[0]}'s turn to sing now!`)
      timer.startTurnTimer(() => {
        done(queue[0], prefix, callback)
      })
    }

}

//removes person in queue
const removeme = (user, prefix, callback)=>{
    //no session
    if(!session){
        return callback(` No session active! Please use \`${prefix}start\` to start a session!`,null)       
      }

    //user not in queue
    if(!queue.includes(user)){
        return callback(`You are not in the queue!`, null)
        
      }

    //user is singing now, use the done command instead
    if(user == queue[0]){
      return callback(`${user}, use ${prefix}done instead!`, null)
    }

      queue = queue.filter((name)=>{
        name != user
      })
      return callback(null,` You have been removed from the queue!`)
}

//person done with their turn
const done = (user,prefix,callback)=>{
    //no session
    if(!session){
        return callback(` No session active! Please use \`${prefix}start\` to start a session!`,null)       
      }

    //user not in queue
    if(user!= queue[0]){
        return callback(`Its not your turn, ${user} !`, null)
        
      }


      callback(null,`Thank you for your performance, ${user}!`)
      timer.stopTimer()
      queue.shift()
      //queue has no people left
      if(queue.length == 0){
        inTurn = false
        callback(`Current queue is empty! Use \`${prefix}addme\` to sing!`,null)
        timer.stopTimer()
        timer.startSessionCountdown(()=>{
          callback('Times up! session closing..',null)
          session = false
        })
        return
      }
      callback(null,`Its ${queue[0]}'s turn to sing now!`)
      timer.startTurnTimer(()=>{
        done(queue[0], prefix, callback)
      })
      return
    


}

//send the current queue
const showqueue = (prefix,callback)=>{
    //no session
    if(!session){
        return callback(` No session active! Please use \`${prefix}start\` to start a session!`,null)       
      }

      //string concat
    var queueString = ``
    for(i = 0; i < queue.length; i++){
      queueString += `${i+1}. ${queue[i].username}\n`
    }

    //no one in queue
    if(queue == ``){
      return callback(`Queue is empty! use \`${prefix}addme\` to start singing!`,null)
    
    }
    
    return callback(null,`\`${queueString}\``)
    queueString = ``
}

//skip the current person at queue
const skip = (prefix,callback)=>{
  //no session
  if(!session){
    return callback(` No session active! Please use \`${prefix}start\` to start a session!`,null)       
  }

  //no one to skip
  if(queue.length == 0){
    return callback(`There is no one to skip!`, null)
  }

  //skipping, basiaclly calling done on current person
  callback(null,`${queue[0]} had been skipped!`)
  done(queue[0], prefix, callback)

}

module.exports = {
    setQueue,
    getQueue,
    start,
    stop,
    addme,
    removeme,
    done,
    showqueue,
    skip
}
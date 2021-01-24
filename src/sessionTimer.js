//timer duration in ms
var duration = null
//turn and session timer
var timer = null
//timer map
var timerMap = new Map()
//global date array
var futureDates = []
//guild model to access timers for every guild
const Guild = require('../models/Guild')


//gets a key by its value in a map
const getByValue = (map, guildId) =>{
    for (let [key, value] of map.entries()) {
      if (value.guildId === guildId)
        return key;
    }
  }
  

//removes a value from an array (for timermap)
const removeItemOnce = (arr, value)=> {
    var index = arr.indexOf(value);
    if (index > -1) {
      arr.splice(index, 1);
    }
    return arr;
  }

   

//start countdown
const startCountdown = async (credentials , callback)=>{

  
        //get guild duration from db
        try{
            var guild = await Guild.findOne({guildId : credentials.guildId})
            duration = guild.duration
        }catch(e){
            return console.error(e)
        }
    
        var d = new Date
        var f = new Date
        f.setSeconds(d.getSeconds()+duration/1000)
        //adds future date to map
        timerMap.set(f,credentials)
    
        //adds future date to array
        futureDates.push(f)
        
        //sorts the arr accoring to date
        futureDates = futureDates.sort(function(date1,date2){return date1.getTime() - date2.getTime()});
    
    
        //if there is no timer, start it
        if(!timer){
            //it will check every seconds to compare the date given and the current date. once the dates are the same, exec the function inside
         timer = setInterval(() => {
            d = new Date
            // console.log('Session Timer')
            // console.log(futureDates)
            // console.log(`${d}`)
            // console.log(`${futureDates[0]} \n`)
    
            //stops timer if and only if there are no future dates pending
            if(futureDates.length == 0){
            clearInterval(timer)
            timer = null          
        }
              
          
            if (d >= futureDates[0]) {
               //callback to the maps credentials
               callback(timerMap.get(futureDates[0]))
    
                //remove date from map and sorted array
                timerMap.delete(futureDates[0])
                futureDates.shift()
                return
               
    
            }
    
              
        }, 1000)
          
    
    }

  
}

const stopCountdown = (credentials)=>{
    var dateToDelete = getByValue(timerMap,credentials.guildId)
    timerMap.delete(dateToDelete)
    removeItemOnce(futureDates, dateToDelete)
    return
}


module.exports = {
    startCountdown,
    stopCountdown,
    
}


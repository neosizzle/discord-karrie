//timer duration in ms
var duration = 9000
//turn and session timer
var timer = null


const startTimer = (duration, callback)=>{
    var d = new Date
    var f = new Date
    f.setSeconds(d.getSeconds()+duration/1000)

    //it will check every seconds to compare the date given and the current date. once the dates are the same, exec the function inside
     timer = setInterval(() => {
         d = new Date

        //  console.log(d)
        //  console.log(f)
         if (d >= f) {
             clearInterval(timer)
             callback()
         }
     }, 1000)

}

//set duration
const setDuration = (value)=>{
    duration = (value*1000)
}


//return duration
const getDuration = ()=>{
    return (duration/1000)
}

//start sessionTimer
const startSessionCountdown = async (callback)=>{

    startTimer(duration, ()=>{
        callback()
    })
    
}

//start turn timer
const startTurnTimer = (callback)=>{
    startTimer(duration, ()=>{
        callback()
    })
}

//stop turn timer
const stopTimer = ()=>{
    clearInterval(timer)
}



module.exports = {
    getDuration,
    setDuration,
    startSessionCountdown,
    startTurnTimer,
    stopTimer
}
//this file is created for handling uninteruptable events made by karrie

var ongoingEvent = false

//activate event
const activateEvent = ()=>{
    ongoingEvent = true
}

//stop even
const stopEvent = ()=>{
    ongoingEvent = false
}

//check if an event is ongoing
const checkEvent = ()=>{
    return ongoingEvent
}

module.exports = {
    activateEvent,
    stopEvent,
    checkEvent
}
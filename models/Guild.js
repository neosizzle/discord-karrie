//this file declares the guild schema for data storage
const mongoose = require('mongoose')

const guildSchema = new  mongoose.Schema({

    //guild id for every unique server
    guildId : {
        type : String,
        required : true,
        unique : true,
    },

    //server prefix
    prefix : {
        type : String,
        default : 'k '
    },

    //karaoke host role 
    hostRole : {
        type : String,
        default : 'Karaoke Host'
    },

    //queue of array of user IDs
    queue: [{
        type: String
    }],

    //on going karaoke session
    session : {
        type : Boolean,
        default : false
    },

    //in karaoke turn
    inTurn : {
        type : Boolean,
        default : false
    },

    //ongoing uninterruptable event
    ongoingEvent : {
        type : Boolean,
        default : false
    },

    //timer duration
    duration : {
        type : Number,
        default : 180000
    },

    //activity voice channel
    voiceChannelId : {
        type : String
    }

})

//attatching guild schema to guild model
const Guild = mongoose.model("Guild",guildSchema)

module.exports = Guild
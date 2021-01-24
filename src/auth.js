const Guild = require('../models/Guild')


const setSessionID = async (id,credentials)=>{
    //updats vc id in db
    try{
       await Guild.updateOne({guildId : credentials.guildId}, {voiceChannelId : id})
      }catch(e){
        console.error(e)
      }
}

const getSessionID = async (credentials)=>{
    
    //gets vc id from db
    try{
        var guild = await Guild.findOne({guildId : credentials.guildId})
        return guild.voiceChannelId
       }catch(e){
         console.error(e)
       }
}

const authenticate = (roles,authRole)=>{

    if (roles.find(role => role.name == authRole))return true;
    return false
}

const vcAuth = async (id,credentials)=>{

    //gets vc id from db
    try{
        var guild = await Guild.findOne({guildId : credentials.guildId})

       }catch(e){
         console.error(e)
       }


    return (id == guild.voiceChannelId)
}


module.exports = {
    setSessionID,
    getSessionID,
    authenticate,
    vcAuth
}
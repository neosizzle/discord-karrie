sessionID = null

const setSessionID = (id)=>{
    sessionID = id
}

const getSessionID = ()=>{
    return sessionID
}

const authenticate = (roles,authRole)=>{

    if (roles.find(role => role.name == authRole))return true;
    return false
}

const vcAuth = (id)=>{
    return id == sessionID
}


module.exports = {
    setSessionID,
    getSessionID,
    authenticate,
    vcAuth
}
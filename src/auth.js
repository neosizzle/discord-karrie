
const authenticate = (roles,authRole)=>{

    if (roles.find(role => role.name == authRole))return true;
    return false
}


module.exports = {
    authenticate
}
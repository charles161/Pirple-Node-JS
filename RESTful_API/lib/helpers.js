var crypto = require("crypto");
var config = require("../config");
var helpers = {};

helpers.hash = function (str) {
    if (typeof str == "string" && str.length > 0) {
        var hash = crypto
            .createHmac("sha256", config.hashingSecret)
            .update(str)
            .digest("hex");
        return hash;
    } else {
        return false;
    }
};

//parse a json string to an object
helpers.parseBufferToJson = (buffer) => {
    try {
        return JSON.parse(buffer)
    } catch (error) {
        return {}
    }
}

helpers.generateToken = (len) => {
    len = typeof (len) == 'number' && len > 0 ? len : false;
    if (len) {
        let possible = 'abcdefghijklmnopqrstuvwxyz0123456789'
        let str = ''
        for (i = 1; i <= len; i++) {
            let randomCharacter = possible.charAt(Math.floor(Math.random() * possible.length))
            str += randomCharacter
        }
        return str
    }
    else {
        return false
    }
}

module.exports = helpers;

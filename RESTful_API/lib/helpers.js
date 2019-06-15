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

module.exports = helpers;

//request handlers
var _data = require("./data");
var helpers = require("./helpers");
var handler = {
    not_found: (data, callback) => {
        callback(404, {});
    },
    ping: (data, callback) => {
        callback(200);
    },
    users: (data, callback) => {
        var acceptablemethods = ["post", "get", "put", "delete"];
        if (acceptablemethods.indexOf(data.method) > -1) {
            handler._users[data.method](data, callback);
        } else {
            callback(405);// status code for methd not allowed

        }
    },
    _users: {
        //required: firstname, lastname,phone,passowrd,tosAgreement
        post: function (data, callback) {
            //check that all parameters are there
            console.log(data.payload)
            var firstName =
                typeof data.payload.firstName == "string" &&
                    data.payload.firstName.trim().length > 0
                    ? data.payload.firstName.trim()
                    : false;
            var lastName =
                typeof data.payload.lastName == "string" &&
                    data.payload.lastName.trim().length > 0
                    ? data.payload.lastName.trim()
                    : false;
            var phone =
                typeof data.payload.phone == "string" &&
                    data.payload.phone.trim().length == 10
                    ? data.payload.phone.trim()
                    : false;
            var password =
                typeof data.payload.password == "string" &&
                    data.payload.password.trim().length > 0
                    ? data.payload.password.trim()
                    : false;
            var tosAgreement =
                typeof data.payload.tosAgreement == "boolean" &&
                    data.payload.tosAgreement
                    ? true
                    : false;

            if (firstName && lastName && phone && password && tosAgreement) {
                //make sure that the user doesnt already exist
                _data.read("users", phone, (err, data) => {
                    if (err) {
                        //hash the password
                        var hashedpassword = helpers.hash(password);
                        if (hashedpassword) {
                            var userObject = {
                                firstName,
                                lastName,
                                phone,
                                hashedpassword,
                                tosAgreement: true
                            };
                            _data.create("users", phone, userObject, function (err) {
                                if (!err) {
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, {
                                        Error: "could not create new user"
                                    });
                                }
                            });
                        }
                        else {
                            callback(500, {
                                Error:
                                    "Hashing error"
                            });
                        }
                    } else {
                        callback(500, {
                            Error:
                                "The user with that phone number aready exists"
                        });
                    }
                });
            } else {
                callback(400, { Error: "Missing required fields" });
            }
        },
        //users -get
        // required data = phone
        //optional data  = none
        //TODO: only let authenticated users access their object
        get: function (data, callback) {
            //check phone number is valid
            console.log(data.queryObject)
            phone = typeof (data.queryObject.phone) == "string" && data.queryObject.phone.trim().length == 10 ? data.queryObject.phone : false;
            if (phone) {
                _data.read("users", phone, (err, data) => {
                    if (!err && data) {
                        delete data.hashedpassword;
                        callback(200, data)
                    }
                    else {
                        callback(404)
                    }
                })
            }
            else {
                callback(400, { "Error": "missing required field" })
            }
        },
        put: function (data, callback) { },
        delete: function (data, callback) { }
    }
};

module.exports = handler;

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
                                    delete userObject.hashedpassword
                                    callback(200, userObject);
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
                    }
                });
            } else {
                callback(400, { Error: "Missing required fields" });
            }
        },
        //users -get
        // required data = phone
        //optional data  = none

        get: function (data, callback) {
            //check phone number is valid
            console.log(data.queryObject)
            let phone = typeof (data.queryObject.phone) == "string" && data.queryObject.phone.trim().length == 10 ? data.queryObject.phone : false;
            if (phone) {
                let token = typeof data.headers.token == 'string' ? data.headers.token : false
                handler._tokens.verifyToken(token, phone, (isvalid) => {
                    if (isvalid) {
                        _data.read("users", phone, (err, data) => {
                            if (!err && data) {
                                delete data.hashedpassword;
                                callback(200, data)
                            }
                            else {
                                callback(404, { "Error": "User not found" })
                            }
                        })
                    }
                    else {
                        callback(403, { 'Error': "Missing token i headres or token is invelid" })
                    }
                })

            }
            else {
                callback(400, { "Error": "missing required field" })
            }
        },


        //required: phone
        //optional : firstName, lastName and password (atleast one must be specified)
        put: function (data, callback) {
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

            if (phone) {
                let token = typeof data.headers.token == 'string' ? data.headers.token : false
                handler._tokens.verifyToken(token, phone, (isvalid) => {
                    if (isvalid) {
                        if (firstName || lastName || password) {
                            _data.read("users", phone, (err, data) => {
                                if (!err && data) {
                                    if (firstName) {
                                        data.firstName = firstName
                                    }
                                    if (lastName) {
                                        data.lastName = lastName
                                    }
                                    if (password) {
                                        data.hashedpassword = helpers.hash(password)
                                    }
                                    _data.update('users', phone, data, (err) => {
                                        if (err) {
                                            callback(500, { Error: 'Could not update the user' })
                                        }
                                        else {
                                            callback(200)
                                        }
                                    })
                                }
                                else {
                                    callback(400, { Error: 'The user does not exist' })
                                }
                            })
                        }
                        else {
                            callback(400, { Error: 'missing required field' })
                        }
                    }
                    else {
                        callback(403, { 'Error': "Missing token in headers or token is invelid" })
                    }
                })

            }
            else {
                callback(400, { Error: 'missing required field' })
            }
        },
        //users - delete
        //required field: phone
        // TODO: cleanup data related to the useer
        delete: function (data, callback) {
            var phone =
                typeof (data.queryObject.phone) == "string" && data.queryObject.phone.trim().length == 10 ? data.queryObject.phone : false;

            if (phone) {
                let token = typeof data.headers.token == 'string' ? data.headers.token : false
                handler._tokens.verifyToken(token, phone, (isvalid) => {
                    if (isvalid) {
                        _data.read("users", phone, (err, data) => {
                            if (!err && data) {
                                _data.delete('users', phone, err => {
                                    if (!err) {
                                        callback(200, { Message: 'User deleted successfully' })
                                    } else {
                                        callback(400, { Error: 'Could not delete the specified user' })
                                    }
                                })
                            }
                            else {
                                callback(400, { Error: 'The user does not exist' })
                            }
                        })
                    }
                    else {
                        callback(403, { 'Error': "Missing token i headres or token is invelid" })
                    }
                })

            }
            else {
                callback(400, { Error: 'missing required field' })
            }
        }
    },
    tokens: (data, callback) => {
        var acceptablemethods = ["post", "get", "put", "delete"];
        if (acceptablemethods.indexOf(data.method) > -1) {
            handler._tokens[data.method](data, callback);
        } else {
            callback(405);// status code for methd not allowed

        }
    },
    _tokens: {
        post: (data, callback) => {
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
            if (phone && password) {
                //lookup the user who mathces the phone number
                _data.read('users', phone, (err, data) => {
                    if (!err && data) {
                        hashed_pwd = helpers.hash(password)
                        if (hashed_pwd == data.hashedpassword) {
                            //create a new token and set expiration for 1 hour
                            let tokenId = helpers.generateToken(20)
                            let expires = Date.now() + 1000 * 60 * 60;
                            let tokenObj = {
                                phone: phone,
                                id: tokenId,
                                expires: expires
                            }
                            _data.create('tokens', tokenId, tokenObj, (err) => {
                                if (err) {
                                    callback(500, { "Error": "Could not create token" })
                                }
                                else {
                                    callback(200, tokenObj)
                                }
                            })
                        }
                        else {
                            callback(400, { "Error": "Passwords does not match" })
                        }
                    }
                    else {
                        callback(400, { "Error": "the user does not exist" })
                    }
                })
            }
            else {
                callback(400, { "Error": "Missing required fields" })
            }
        }, get: (data, callback) => {
            //check phone number is valid
            console.log(data.queryObject)
            let id = typeof (data.queryObject.id) == "string" && data.queryObject.id.trim().length == 20 ? data.queryObject.id : false;
            if (id) {
                _data.read("tokens", id, (err, data) => {
                    if (!err && data) {
                        callback(200, data)
                    }
                    else {
                        callback(404, { "Error": "Token not found" })
                    }
                })
            }
            else {
                callback(400, { "Error": "missing required field" })
            }

        }, put: (data, callback) => {
            var id =
                typeof data.payload.id == "string" &&
                    data.payload.id.trim().length == 20
                    ? data.payload.id.trim()
                    : false;
            var extend = typeof data.payload.extend == 'boolean' ? data.payload.extend : false;
            if (id && extend) {
                _data.read("tokens", id, (err, data) => {
                    if (!err && data) {
                        if (data.expires > Date.now()) {
                            data.expires = Date.now() + 1000 * 60 * 60;
                            _data.update('tokens', id, data, (err) => {
                                if (err) {
                                    callback(500, { "Error": "Could not create token" })
                                }
                                else {
                                    callback(200, data)
                                }
                            })

                        }
                        else {
                            callback(404, { "Error": "Token already expired" })
                        }
                    }
                    else {
                        callback(404, { "Error": "Token not found" })
                    }
                })
            }
            else {
                callback(400, { "Error": "missing required field" })
            }
        }, delete: (data, callback) => {
            var id =
                typeof (data.queryObject.id) == "string" && data.queryObject.id.trim().length == 20 ? data.queryObject.id : false;

            if (id) {
                _data.read("tokens", id, (err, data) => {
                    if (!err && data) {
                        _data.delete('tokens', id, err => {
                            if (!err) {
                                callback(200, { "Message": "token deleted successfully" })
                            } else {
                                callback(400, { Error: 'Could not delete the specified token' })
                            }
                        })
                    }
                    else {
                        callback(400, { Error: 'The token does not exist' })
                    }
                })
            }
            else {
                callback(400, { Error: 'missing required field' })
            }
        },
        verifyToken: (id, phone, callback) => {
            _data.read("tokens", id, (err, data) => {
                if (!err && data) {
                    if (data.phone == phone && data.expires > Date.now()) {
                        callback(true)
                    }
                    else {
                        callback(false)
                    }
                }
                else {
                    callback(false)
                }
            }
            );
        }
    }
};

module.exports = handler;

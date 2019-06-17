//request handler
var _data = require("./data");
var helpers = require("./helpers");
var config = require("../config");
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

        delete: function (data, callback) {
            var phone =
                typeof (data.queryObject.phone) == "string" && data.queryObject.phone.trim().length == 10 ? data.queryObject.phone : false;

            if (phone) {
                let token = typeof data.headers.token == 'string' ? data.headers.token : false
                handler._tokens.verifyToken(token, phone, (isvalid) => {
                    if (isvalid) {
                        _data.read("users", phone, (err, data) => {
                            if (!err && data) {
                                _data.delete('users', phone, function (err) {
                                    if (!err) {
                                        // Delete each of the checks associated with the user
                                        var userChecks = typeof (data.checks) == 'object' && data.checks instanceof Array ? data.checks : [];
                                        var checksToDelete = userChecks.length;
                                        if (checksToDelete > 0) {
                                            var checksDeleted = 0;
                                            var deletionErrors = false;
                                            // Loop through the checks
                                            userChecks.forEach(function (checkId) {
                                                // Delete the check
                                                _data.delete('checks', checkId, function (err) {
                                                    if (err) {
                                                        deletionErrors = true;
                                                    }
                                                    checksDeleted++;
                                                    if (checksDeleted == checksToDelete) {
                                                        if (!deletionErrors) {
                                                            callback(200);
                                                        } else {
                                                            callback(500, { 'Error': "Errors encountered while attempting to delete all of the user's checks. All checks may not have been deleted from the system successfully." })
                                                        }
                                                    }
                                                });
                                            });
                                        } else {
                                            callback(200);
                                        }
                                    } else {
                                        callback(500, { 'Error': 'Could not delete the specified user' });
                                    }
                                });
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
    },
    checks: (data, callback) => {
        var acceptablemethods = ["post", "get", "put", "delete"];
        if (acceptablemethods.indexOf(data.method) > -1) {
            handler._checks[data.method](data, callback);
        } else {
            callback(405);// status code for methd not allowed
        }
    },
    _checks: {
        post: (data, callback) => {
            // Validate inputs
            var protocol = typeof (data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
            var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
            var method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
            var successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
            var timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
            if (protocol && url && method && successCodes && timeoutSeconds) {

                // Get token from headers
                var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

                // Lookup the user phone by reading the token
                _data.read('tokens', token, function (err, tokenData) {
                    if (!err && tokenData) {
                        var userPhone = tokenData.phone;

                        // Lookup the user data
                        _data.read('users', userPhone, function (err, userData) {
                            if (!err && userData) {
                                var userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                // Verify that user has less than the number of max-checks per user
                                if (userChecks.length < config.maxChecks) {
                                    // Create random id for check
                                    var checkId = helpers.generateToken(20);

                                    // Create check object including userPhone
                                    var checkObject = {
                                        'id': checkId,
                                        'userPhone': userPhone,
                                        'protocol': protocol,
                                        'url': url,
                                        'method': method,
                                        'successCodes': successCodes,
                                        'timeoutSeconds': timeoutSeconds
                                    };

                                    // Save the object
                                    _data.create('checks', checkId, checkObject, function (err) {
                                        if (!err) {
                                            // Add check id to the user's object
                                            userData.checks = userChecks;
                                            userData.checks.push(checkId);

                                            // Save the new user data
                                            _data.update('users', userPhone, userData, function (err) {
                                                if (!err) {
                                                    // Return the data about the new check
                                                    callback(200, checkObject);
                                                } else {
                                                    callback(500, { 'Error': 'Could not update the user with the new check.' });
                                                }
                                            });
                                        } else {
                                            callback(500, { 'Error': 'Could not create the new check' });
                                        }
                                    });



                                } else {
                                    callback(400, { 'Error': 'The user already has the maximum number of checks (' + config.maxChecks + ').' })
                                }


                            } else {
                                callback(403);
                            }
                        });


                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(400, { 'Error': 'Missing required inputs, or inputs are invalid' });
            }
        },
        get: (data, callback) => {
            // Check that id is valid

            var id = typeof (data.queryObject.id) == 'string' && data.queryObject.id.trim().length == 20 ? data.queryObject.id.trim() : false;
            if (id) {
                // Lookup the check
                _data.read('checks', id, function (err, checkData) {
                    if (!err && checkData) {
                        // Get the token that sent the request
                        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
                        // Verify that the given token is valid and belongs to the user who created the check
                        console.log("This is check data", checkData);
                        handler._tokens.verifyToken(token, checkData.userPhone, function (tokenIsValid) {
                            if (tokenIsValid) {
                                // Return check data
                                callback(200, checkData);
                            } else {
                                callback(403);
                            }
                        });
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(400, { 'Error': 'Missing required field, or field invalid' })
            }
        },
        put: (data, callback) => {
            // Check for required field
            var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

            // Check for optional fields
            var protocol = typeof (data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
            var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
            var method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
            var successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
            var timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

            // Error if id is invalid
            if (id) {
                // Error if nothing is sent to update
                if (protocol || url || method || successCodes || timeoutSeconds) {
                    // Lookup the check
                    _data.read('checks', id, function (err, checkData) {
                        if (!err && checkData) {
                            // Get the token that sent the request
                            var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
                            // Verify that the given token is valid and belongs to the user who created the check
                            handler._tokens.verifyToken(token, checkData.userPhone, function (tokenIsValid) {
                                if (tokenIsValid) {
                                    // Update check data where necessary
                                    if (protocol) {
                                        checkData.protocol = protocol;
                                    }
                                    if (url) {
                                        checkData.url = url;
                                    }
                                    if (method) {
                                        checkData.method = method;
                                    }
                                    if (successCodes) {
                                        checkData.successCodes = successCodes;
                                    }
                                    if (timeoutSeconds) {
                                        checkData.timeoutSeconds = timeoutSeconds;
                                    }

                                    // Store the new updates
                                    _data.update('checks', id, checkData, function (err) {
                                        if (!err) {
                                            callback(200);
                                        } else {
                                            callback(500, { 'Error': 'Could not update the check.' });
                                        }
                                    });
                                } else {
                                    callback(403);
                                }
                            });
                        } else {
                            callback(400, { 'Error': 'Check ID did not exist.' });
                        }
                    });
                } else {
                    callback(400, { 'Error': 'Missing fields to update.' });
                }
            } else {
                callback(400, { 'Error': 'Missing required field.' });
            }
        },
        delete: (data, callback) => {
            // Check that id is valid
            var id = typeof (data.queryObject.id) == 'string' && data.queryObject.id.trim().length == 20 ? data.queryObject.id.trim() : false;
            if (id) {
                // Lookup the check
                _data.read('checks', id, function (err, checkData) {
                    if (!err && checkData) {
                        // Get the token that sent the request
                        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
                        // Verify that the given token is valid and belongs to the user who created the check
                        handler._tokens.verifyToken(token, checkData.userPhone, function (tokenIsValid) {
                            if (tokenIsValid) {
                                // Delete the check data
                                _data.delete('checks', id, function (err) {
                                    if (!err) {
                                        // Lookup the user's object to get all their checks
                                        _data.read('users', checkData.userPhone, function (err, userData) {
                                            if (!err) {
                                                var userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                                // Remove the deleted check from their list of checks
                                                var checkPosition = userChecks.indexOf(id);
                                                if (checkPosition > -1) {
                                                    userChecks.splice(checkPosition, 1);
                                                    // Re-save the user's data
                                                    userData.checks = userChecks;
                                                    _data.update('users', checkData.userPhone, userData, function (err) {
                                                        if (!err) {
                                                            callback(200);
                                                        } else {
                                                            callback(500, { 'Error': 'Could not update the user.' });
                                                        }
                                                    });
                                                } else {
                                                    callback(500, { "Error": "Could not find the check on the user's object, so could not remove it." });
                                                }
                                            } else {
                                                callback(500, { "Error": "Could not find the user who created the check, so could not remove the check from the list of checks on their user object." });
                                            }
                                        });
                                    } else {
                                        callback(500, { "Error": "Could not delete the check data." })
                                    }
                                });
                            } else {
                                callback(403);
                            }
                        });
                    } else {
                        callback(400, { "Error": "The check ID specified could not be found" });
                    }
                });
            } else {
                callback(400, { "Error": "Missing valid id" });
            }
        }
    }
};

module.exports = handler;

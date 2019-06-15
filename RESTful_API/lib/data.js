/*
library for storing and editing data

*/

var fs = require("fs");
var path = require("path");
var helpers = require("./helpers")

//continer for the module(to be exported)
var lib = {};

//base directooyr of the data  folder
lib.baseDir = path.join(__dirname, "/../.data/");
//for writing data to a file
lib.create = function (dir, file, data, callback) {
    //open file for writing
    fs.open(lib.baseDir + dir + "/" + file + ".json", "wx", function (
        err,
        fileDescriptor
    ) {
        //filedesctiptor is a way to uniquely identify a file
        if (!err && fileDescriptor) {
            //convert data to string
            var stringData = JSON.stringify(data);
            fs.writeFile(fileDescriptor, stringData, function (err) {
                if (!err) {
                    fs.close(fileDescriptor, function (err) {
                        if (!err) {
                            callback(false);
                        } else {
                            callback("Error closing fs");
                        }
                    });
                } else {
                    callback("Error writing to new file");
                }
            });
        } else {
            callback("Could not create a new file, maybe file already exists");
        }
    });
};

//for reading a file
lib.read = function (dir, file, callback) {
    fs.readFile(lib.baseDir + dir + "/" + file + ".json", "utf8", function (
        err,
        data
    ) {
        if (!err && data) {
            callback(false, helpers.parseBufferToJson(data));
        }
        else {
            callback(err, data);
        }
    });
};

//for updating a file
lib.update = function (dir, file, data, callback) {
    //open the file for writing
    fs.open(lib.baseDir + dir + "/" + file + ".json", "r+", function (
        err,
        filedesc
    ) {
        if (!err && filedesc) {
            // convert data to string
            var stringdata = JSON.stringify(data);

            //Truncate the file(for overwrite file) , truncates - removes data
            fs.ftruncate(filedesc, function (err) {
                if (!err) {
                    fs.writeFile(filedesc, stringdata, function (err) {
                        if (!err) {
                            fs.close(filedesc, function (err) {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback("Error closing fs");
                                }
                            });
                        } else {
                            callback("Error writing to existing file");
                        }
                    });
                }
            });
        } else {
            callback(
                "could not open the file for upadting , it may not exist yet"
            );
        }
    });
};

lib.delete = function (dir, file, callback) {
    //unlink the file
    fs.unlink(lib.baseDir + dir + "/" + file + ".json", function (err) {
        if (!err) {
            callback(false);
        } else {
            callback("error deleting file");
        }
    });
};
module.exports = lib;

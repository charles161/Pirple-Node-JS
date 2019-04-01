var http = require("http");
var url = require("url");
var stringDecoder = require("string_decoder").StringDecoder;
var log = console.log;
var config = require("./config");
var fs = require("fs");

var handler = {
    not_found: (data, callback) => {
        callback(404, {});
    },
    hello: (data, callback) => {
        callback(200, { message: "Hello World" });
    }
};

var router = {
    hello: handler.hello
};

var unifiedServer = (req, res) => {
    var trimmedPath = url
        .parse(req.url, true)
        .pathname.replace(/^\/+|\/+$/g, "");
    log(trimmedPath);

    var queryObject = url.parse(req.url, true).query;
    log(queryObject);

    var method = req.method.toLowerCase();
    log(method);

    var headers = req.headers;
    //log(headers);

    var decoder = new stringDecoder("utf-8");
    var buffer = "";
    req.on("data", data => {
        buffer += decoder.write(data);
    });

    req.on("end", () => {
        buffer += decoder.end();
        var data = {
            payload: buffer,
            trimmedPath: trimmedPath,
            headers: headers,
            method: method,
            queryObject: queryObject
        };
        var chosenHandler =
            typeof router[trimmedPath] !== "undefined"
                ? router[trimmedPath]
                : handler.not_found;

        chosenHandler(data, (statusCode, payload) => {
            statusCode = typeof statusCode == "number" ? statusCode : 200;
            payload = typeof payload == "object" ? payload : {};
            var payloadString = JSON.stringify(payload);
            res.setHeader("Content-Type", "application/json");
            res.writeHead(statusCode);
            res.end(payloadString);
        });
    });
};

var httpServer = http.createServer((req, res) => {
    unifiedServer(req, res);
});

httpServer.listen(config.httpPort, () => {
    log("listening on port " + config.httpPort);
});

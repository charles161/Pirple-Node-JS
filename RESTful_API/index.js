// http - define what the server does and then say it to listen on a speicfic port

var http = require("http");
var https = require("https");

var url = require("url");
var stringDecoder = require("string_decoder").StringDecoder;
var log = console.log;
var config = require("./config");
var fs = require("fs");
var handler = require("./lib/handlers");
var _data = require('./lib/data')
var helpers = require('./lib/helpers')


_data.update("test", "new1", { name: 'charles', age: 230 }, (err) => {
    console.log(err)
})

// define a request handler
// var handler = {
//     ping: (data, cb) => {
//         cb(200, { name: 'charles' });
//     },
//     users: (data, cb) => {
//         cb(200, { name: 'users' });
//     },
//     not_found: (data, cb) => {
//         cb(200, { name: 'not found' })
//     }
// }

//define a request router
var router = {
    ping: handler.ping,
    users: handler.users,
    tokens: handler.tokens
};

//all the server logic for both http and https server
var unifiedServer = (req, res) => {
    log("req");
    //get the url and parse it
    var parsedUrl = url.parse(req.url, true);
    //log("parsed url", parsedUrl);

    //get the path
    var path = parsedUrl.pathname;
    //log("full path", path);
    var trimmedPath = path.replace(/^\/+|\/+$/g, "");
    //log("trimmed path", trimmedPath);

    //get query string object
    var queryObject = parsedUrl.query;

    // get the HTTP method
    var method = req.method.toLowerCase();

    // grt the headers as an object
    var headers = req.headers;
    //log("headers", headers, "\n\n");

    // get the payload if any from the post method
    //what are streams : these are bits of information coming in little bit at a time
    //payload is a stream
    var decoder = new stringDecoder("utf-8");
    var buffer = "";
    req.on("data", data => {
        // log("data", data);
        buffer += decoder.write(data);
        // log("buffer\n", buffer);
    });

    req.on("end", () => {
        //this function is called every time regardless of its methods or payload
        buffer += decoder.end();
        var data = {
            payload: helpers.parseBufferToJson(buffer),
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
            //convert payload to string
            var payloadString = JSON.stringify(payload);
            // due to this the response received by the user is a string. but we nee d the user to receive a json object
            // so we attach in the content type headers
            res.setHeader("Content-Type", "application/json");
            res.writeHead(statusCode);
            res.end(payloadString);
            console.log(payloadString);
        });
        // log("Request received with the payload: ", buffer);
    });
};

// instantiate the http server
var httpServer = http.createServer((req, res) => {
    unifiedServer(req, res);
});

// instantiate the https server
var httpsServerOptions = {
    key: fs.readFileSync("./https/key.pem"),
    cert: fs.readFileSync("./https/cert.pem")
};
var httpsServer = https.createServer(httpsServerOptions, (req, res) => {
    log("https");
    unifiedServer(req, res);
});

// start the http server and make it listen on port 3000
httpServer.listen(config.httpPort, () => {
    log("listening on port " + config.httpPort);
});

// start the https server and make it listen on port 3000
httpsServer.listen(config.httpsPort, () => {
    log("listening on httpsPort " + config.httpsPort);
});

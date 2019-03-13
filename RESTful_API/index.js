// http - define what the server does and then say it to listen on a speicfic port

var http = require("http");
var url = require("url");
var stringDecoder = require("string_decoder").StringDecoder;
var log = console.log;

// the server should respond to all requests with a string
var server = http.createServer((req, res) => {
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
            //convert payload to string
            var payloadString = JSON.stringify(payload);
            // due to this the response received by the user is a string. but we nee d the user to receive a json object
            // so we attach in the content type headers
            res.setHeader("Content-Type", "application/json");
            res.writeHead(statusCode);
            res.end(payloadString);
        });
        // log("Request received with the payload: ", buffer);
    });
});

// start the server and make it listen on port 3000
server.listen(3000, () => {
    log("listening on port 3000");
});

// define a request handler
var handler = {
    sample: (data, callback) => {
        callback(406, { name: "Sample handler" });
    },
    not_found: (data, callback) => {
        callback(404, {});
    }
};

//define a request router
var router = {
    sample: handler.sample
};

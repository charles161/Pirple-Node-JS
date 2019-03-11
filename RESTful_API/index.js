// http - define what the server does and then say it to listen on a speicfic port

var http = require("http");
var url = require("url");
var log = console.log;

// the server should respond to all requests with a string
var server = http.createServer((req, res) => {
    //get the url and parse it
    var parsedUrl = url.parse(req.url, true);
    log("parsed url", parsedUrl);
    //get the path
    var path = parsedUrl.pathname;
    log("full path", path);
    var trimmedPath = path.replace(/^\/+|\/+$/g, "");
    log("trimmed path", trimmedPath);
    //send the response
    res.end("Hello world");

    //log the request path
    console.log("request received path :" + trimmedPath);
});

// start the server and make it listen on port 3000
server.listen(3000, () => {
    console.log("listening on port 3000");
});

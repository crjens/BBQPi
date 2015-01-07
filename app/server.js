var http = require('http');
var os = require('os');
var express = require('express');
//var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
//var methodOverride = require('method-override');
//var power = require('./cs5463');
//var db = require('./database');
//var basicAuth = require('basic-auth');

var PythonShell = require('python-shell');

//var t = (new Date()).getTime();

//var data = {
//    probe1: [90, 101, 122, 123, 144, 165, 186, 197, 198, 199],
//    probe2: [87, 111, 132, 133, 134, 145, 156, 167, 178, 189],
//    probe3: [91, 110, 120, 130, 140, 150, 160, 170, 180, 190],
//    probe4: [100, 150, 200, 250, 300, 300, 305, 295, 300, 305],
//    time: [t, t + 10 * 60000, t + 20 * 60000, t + 30 * 60000, t + 40 * 60000, t + 50 * 60000, t + 60 * 60000, t + 70 * 60000, t + 80 * 60000, t + 90 * 60000],
//    templabel: "°F",
//    timelabel: "seconds",
//    probe1label: "Thigh",
//    probe2label: "Leg",
//    probe3label: "Breast",
//    probe4label: "Grill",
//};


//var pyshell = new PythonShell('display.py', {
//    mode: 'json'
//});
//var output = '';
//pyshell.stdout.on('data', function (data) {
//    console.log('from py: ' + data);
//});
//pyshell.send(data).end(function (err) {
//    if (err) console.log(err);
//});


var app = express();


  app.set('port', 80);
  app.use(logger);
  //app.use(auth);
//  app.use(bodyParser.urlencoded({ extended: true }))
  //app.use(bodyParser.json());
  //app.use(bodyParser.json({ type: 'application/vnd.api+json' }))
  app.use(favicon(__dirname + '/images/favicon.png'));
//  app.use(express.bodyParser({ keepExtensions: true, uploadDir: options.uploadTmpPath}));
//  app.use(methodOverride('X-HTTP-Method-Override'));
  app.use(express['static'](__dirname));
  app.use(logErrors);
  app.use(clientErrorHandler);
  app.use(errorHandler);
  

// Show ip address(es) on display
var networkInterfaces = os.networkInterfaces();

var ips = [];
ips.push("Raspberry Pi BBQ Monitor");
ips.push("(http port " + app.get('port') + ")");
ips.push("");
for (var devName in networkInterfaces) {
    var iface = networkInterfaces[devName];

    for (var i = 0; i < iface.length; i++) {
        var alias = iface[i];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
            ips.push(devName + ": " + alias.address);
    }
}

console.log(networkInterfaces);
var pyshell = new PythonShell('displayip.py', {
    mode: 'json'
});
pyshell.send(ips).end(function (err) {
    if (err) console.log(err);
});
  

function logger(req, res, next) {
  console.log('%s %s', req.method, req.url);
  //console.log(req.headers.authorization);
  //console.log(req.headers);
  
  next();
}

function logErrors(err, req, res, next) {
  console.log(err);
  console.error(err.stack);
  next(err);
}

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.send(500, { error: 'Server error' });
  } else {
    next(err);
  }
}

function errorHandler(err, req, res, next) {
  res.status(500);
  res.render('error', { error: err });
}


app.get('/', function (req, res) {

    var text = req.query.text;
    console.log('text: ' + text);
    
    res.send('text: ' + text);
});


// Express route for any other unrecognised incoming requests 
app.get('*', function (req, res) {
    res.send(404, 'Unrecognised API call');
});


var server = app.listen(app.get('port'), function () {
    console.log('App Server running at port ' + app.get('port'));
});


// this function is called when you want the server to die gracefully
// i.e. wait for existing connections
var gracefulShutdown = function () {
    console.log("Received kill signal, shutting down gracefully.");
    //power.Stop();
    server.close(function () {
        console.log("Closed out remaining connections.");
        process.exit()
    });

    // if after 
    setTimeout(function () {
        console.error("Could not close connections in time, forcefully shutting down");
        process.exit()
    }, 10 * 1000);
}

// listen for TERM signal .e.g. kill 
process.on('SIGTERM', gracefulShutdown);

// listen for INT signal e.g. Ctrl-C
process.on('SIGINT', gracefulShutdown);
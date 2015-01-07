var http = require('http'); 
var express = require('express');
//var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
//var methodOverride = require('method-override');
//var power = require('./cs5463');
//var db = require('./database');
//var basicAuth = require('basic-auth');

var PythonShell = require('python-shell');



var t = (new Date()).getTime();

var data = {
    probe1: [90, 101, 122, 123, 144, 165, 186, 197, 198, 199],
    probe2: [87, 111, 132, 133, 134, 145, 156, 167, 178, 189],
    probe3: [91, 110, 120, 130, 140, 150, 160, 170, 180, 190],
    probe4: [100, 150, 200, 250, 300, 300, 305, 295, 300, 305],
    time: [t, t + 10 * 60000, t + 20 * 60000, t + 30 * 60000, t + 40 * 60000, t + 50 * 60000, t + 60 * 60000, t + 70 * 60000, t + 80 * 60000, t + 90 * 60000],
    templabel: "°F",
    timelabel: "seconds",
    probe1label: "Thigh",
    probe2label: "Leg",
    probe3label: "Breast",
    probe4label: "Grill",
};


var pyshell = new PythonShell('display.py', {
    mode: 'json'
});
var output = '';
pyshell.stdout.on('data', function (data) {
    console.log('from py: ' + data);
});
pyshell.send(data).end(function (err) {
    if (err) console.log(err);
});


var app = express();


  app.set('port', /*process.env.PORT ||*/ 3000);
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

app.get('*', function(req, res){ 
	res.send(404, 'Unrecognised API call'); 
}); 



// Express route to handle errors

app.use(function(err, req, res, next){ 
	if (req.xhr) { 
		res.send(500, 'Oops, Something went wrong!'); 
	} else { 
		next(err); 
	}
});

app.listen(3000); 
console.log('App Server running at port 3000');
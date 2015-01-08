var http = require('http');
var os = require('os');
var express = require('express');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var raspBBQ = require('./raspBBQ.js');
var db = require('./database.js');
//var basicAuth = require('basic-auth');
//var netUtils = require('./utils.js');
var PythonShell = require('python-shell');
var path = require('path');

var sendText = function (msg) {
//    netUtils.sendText(msg);
}


var app = express();


  app.set('port', 80);
  app.use(logger);
  //app.use(auth);
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json());
  app.use(bodyParser.json({ type: 'application/vnd.api+json' }))
  app.use(favicon(__dirname + '/public/images/favicon.png'));
  app.use(express['static'](path.join(__dirname, 'public')));
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





app.get('/runs', function (req, res, next) {
    db.getAllRuns(function (err, results) {
        if (err) {
            console.log(err);
            next(err);
        }
        else
            res.send(results);
    });
});

app.get('/readRunData', function (req, res, next) {
    var runId = req.query.runId;
    //console.log('runId=' + runId);
    db.readRunData(runId, function (err, results) {
        if (err) {
            console.log(err);
            next(err);
        }
        else {

            if (runId == _currentRunId && _settings != null) {
                var rundata = {
                    templabel: "°F",
                    timelabel: "seconds",
                    probe1label: _settings.p1.name,
                    probe2label: _settings.p2.name,
                    probe3label: _settings.p3.name,
                    probe4label: _settings.p4.name,
                    probe1: [],
                    probe2: [],
                    probe3: [],
                    probe4: [],
                    time: []
                };

                var index;
                for (index = 0; index < results.length; ++index) {
                    var r = results[index];
                    if (r.T1 != null)
                        rundata.probe1.push(r.T1);
                    if (r.T2 != null)
                        rundata.probe2.push(r.T2);
                    if (r.T3 != null)
                        rundata.probe3.push(r.T3);
                    if (r.T4 != null)
                        rundata.probe4.push(r.T4);
                    rundata.time.push((new Date(r.Timestamp)).getTime());
                }
                _rundata = rundata;
                updateDisplay(_rundata);
            }
            res.send(results);
        }
    });
});

var sendAlerts = function (temp, probe) {
    if (temp != null) {
        if (probe.lowsent == null && probe.low != null && temp > probe.low) {
            sendText(probe.name + ' at: ' + temp.toFixed(1) + " \u00B0F");
            probe.lowsent = new Date();
        }

        if (probe.highsent == null && probe.high != null && temp > probe.high) {
            sendText(probe.name + ' at: ' + temp.toFixed(1) + " \u00B0F");
            probe.highsent = new Date();
        }
    }
}

var _updateIntervalSec = 30;
var _currentRunId = null, _currentIntervalId = null;

var ReadProbes = function () {
    raspBBQ.readTemp(0, function (err, t1) {
        if (err)
            console.log('readTemp0 error: ' + err);

        sendAlerts(t1, _settings.p1);
        console.log('channel1 temp: ' + t1);

        raspBBQ.readTemp(1, function (err, t2) {
            if (err)
                console.log('readTemp1 error: ' + err);

            sendAlerts(t2, _settings.p2);
            console.log('channel2 temp: ' + t2);

            raspBBQ.readTemp(2, function (err, t3) {
                if (err)
                    console.log('readTemp2 error: ' + err);

                sendAlerts(t3, _settings.p3);
                console.log('channel3 temp: ' + t3);

                raspBBQ.readTemp(3, function (err, t4) {
                    if (err)
                        console.log('readTemp3 error: ' + err);

                    sendAlerts(t4, _settings.p4);
                    console.log('channel4 temp: ' + t4);

                    var ts = new Date();

                    if (_rundata != null) {
                        if (t1 != null)
                            _rundata.probe1.push(t1);
                        if (t2 != null)
                            _rundata.probe2.push(t2);
                        if (t3 != null)
                            _rundata.probe3.push(t3);
                        if (t4 != null)
                            _rundata.probe4.push(t4);
                        _rundata.time.push(ts.getTime());

                        //updateDisplay(_rundata);
                    }

                    db.insertRunData(_currentRunId, t1, t2, t3, t4, ts, function (err) {
                        if (err)
                            console.log('error inserting data: ' + err);
                    });
                });
            });
        });
    });
}

var _rundata = null;
var _settings = null;
/*{
    description: "",
    food: "other",
    weight: 0,
    p1: { low: null, high: null, name: 'probe1'},
    p2: { low: null, high: null, name: 'probe2' },
    p3: { low: null, high: null, name: 'probe3' },
    p4: { low: null, high: null, name: 'probe4' },
    running: _currentRunId == null ? false : true

};*/

var updateDisplay = function (data) {
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


    var pyshell = new PythonShell('display.py', {
        mode: 'json'
    });
    //var output = '';
    //pyshell.stdout.on('data', function (data) {
    //    console.log('from py: ' + data);
    //});
    pyshell.send(data).end(function (err) {
        if (err) console.log(err);
    });
}

var getLastTemp = function (probe) {
    var temp = 0;
    if (probe != null && probe.length > 0) {
        return probe[probe.length - 1];
    }

    return temp;
}

app.get('/bbqTemps', function (req, res) {

    var p1=0, p2=0, p3=0, p4 = 0;

    if (_rundata != null) {
        p1 = getLastTemp(_rundata.probe1);
        p2 = getLastTemp(_rundata.probe2);
        p3 = getLastTemp(_rundata.probe3);
        p4 = getLastTemp(_rundata.probe4);
    }

    res.send([{ pitProbe: p1 }, { foodProbe: p2 }, { probe3: p3 }, { probe4: p4 }]);
});

app.get('/bbqInit/:targetFood/:targetPit/:maxPit/:minPit', function (req, res) {

    console.log(req.params);
    res.send([{}]);

});

app.get('/settings', function (req, res, next) {
    if (_settings == null) {
        db.getLastRun(function (err, data) {
            if (err)
                next(err);
            else {
                if (data.length == 0) {
                    _settings = {
                        description: "",
                        food: "other",
                        weight: 0,
                        p1: { low: null, high: null, name: 'probe1' },
                        p2: { low: null, high: null, name: 'probe2' },
                        p3: { low: null, high: null, name: 'probe3' },
                        p4: { low: null, high: null, name: 'probe4' },
                        running: _currentRunId == null ? false : true
                    }
                } else {
                    data = data[0];
                    _settings = {
                        description: data.Description,
                        food: data.Food,
                        weight: data.Weight,
                        p1: {
                            name: data.P1Name,
                            low: data.P1Low,
                            high: data.P1High
                        },
                        p2: {
                            name: data.P2Name,
                            low: data.P2Low,
                            high: data.P2High
                        },
                        p3: {
                            name: data.P3Name,
                            low: data.P3Low,
                            high: data.P3High
                        },
                        p4: {
                            name: data.P4Name,
                            low: data.P4Low,
                            high: data.P4High
                        },
                        running: _currentRunId == null ? false : true
                    };
                }

                res.jsonp(_settings);
            }
        });
    }
    else {
        _settings.running = _currentRunId == null ? false : true;
        res.jsonp(_settings);
    }
});


app.post('/settings', function (req, res, next) {
    _settings = req.body.settings;

    db.updateRun(_currentRunId, _settings.description, _settings.weight, _settings.food,
                    _settings.p1.name, _settings.p2.name, _settings.p3.name, _settings.p4.name,
                    _settings.p1.low, _settings.p1.high, _settings.p2.low, _settings.p2.high, _settings.p3.low, _settings.p3.high, _settings.p4.low, _settings.p4.high,
        function (err) {
            if (err)
                next(err);
            else
                res.send('success');
        });
});

app.post('/deleteRun', function (req, res, next) {
    var runId = req.query.runId;
    console.log('delete: ' + runId);
    db.deleteRun(runId, function (err) {
        if (err)
            next(err);
        else
            res.send('success');
    });
});

app.post('/startRun', function (req, res, next) {

    var runId = req.query.runId;

    // stop current run
    if (_currentIntervalId != null)
        clearInterval(_currentIntervalId);
    _currentRunId = null;

    _settings = req.body.settings;
    _settings.p1.lowsent = null;
    _settings.p1.highsent = null;
    _settings.p2.lowsent = null;
    _settings.p2.highsent = null;
    _settings.p3.lowsent = null;
    _settings.p3.highsent = null;
    _settings.p4.lowsent = null;
    _settings.p4.highsent = null;

    if (runId == null || runId < 0) {
        db.startRun(_settings.description, _settings.weight, _settings.food,
                    _settings.p1.name, _settings.p2.name, _settings.p3.name, _settings.p4.name,
                    _settings.p1.low, _settings.p1.high, _settings.p2.low, _settings.p2.high, _settings.p3.low, _settings.p3.high, _settings.p4.low, _settings.p4.high,
        function (err, result) {
            if (err) {
                console.log(err);
                next(err);
            }
            else {
                _currentRunId = result;
                console.log('started run: ' + _currentRunId);
                ReadProbes();
                _currentIntervalId = setInterval(ReadProbes, _updateIntervalSec * 1000);

                res.contentType('json');
                res.send({ runId: _currentRunId });
            }
        });
    } else {

        _currentRunId = runId;

        db.updateRun(_currentRunId, _settings.description, _settings.weight, _settings.food,
                    _settings.p1.name, _settings.p2.name, _settings.p3.name, _settings.p4.name,
                    _settings.p1.low, _settings.p1.high, _settings.p2.low, _settings.p2.high, _settings.p3.low, _settings.p3.high, _settings.p4.low, _settings.p4.high,
        function (err) {
            if (err)
                next(err);
            else {
                console.log('continued run: ' + _currentRunId);
                ReadProbes();
                _currentIntervalId = setInterval(ReadProbes, _updateIntervalSec * 1000);

                res.contentType('json');
                res.send({ runId: _currentRunId });
            }
        });



    }
});

app.post('/stopRun', function (req, res, next) {

    // stop current run
    if (_currentIntervalId != null)
        clearInterval(_currentIntervalId);
    _currentRunId = null;

    //res.contentType('json');
    res.send('success');
});

app.get('/', function (req, res) {
    console.log('sending index.html');
    res.sendFile('index.html');
});

// Express route for any other unrecognised incoming requests 
app.get('*', function (req, res) {
    res.status(404).send('Unrecognised API call');
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
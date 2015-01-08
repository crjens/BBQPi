var sqlite3 = require('sqlite3');
var TableStates = { Configuration: false, Readings: false };
var databaseFile = 'bbq.db';
var dbLocked = false;

var sql = new sqlite3.Database(databaseFile, function (err) {

    if (err) {
        console.log("Error opening database: " + databaseFile + " : " + err);
    } else {

        console.log('opened database: ' + databaseFile);
        sql.run('PRAGMA foreign_keys=on');
        sql.run("create table if not exists Configuration (id INTEGER primary key, Description Text, Weight real, Food Text, P1Name Text, P2Name Text, P3Name Text, P4Name Text, P1Low real, P1High real, P2Low real, P2High real, P3Low real, P3High real, P4Low real, P4High real, Timestamp TEXT);", function (err) {
            if (err) {
                console.log("Error creating Configuration table: " + err);
                TableStates.Configuration = "Error";
            } else {

                // insert first probe if none exist
                //powerDb.run("Insert into Probes (id, Type, Board, CurrentChannel, VoltageChannel) select 1,'30A',0,0,0 where (select count(*) from Probes) = 0;");

                console.log('Configuration table ready');
                TableStates.Configuration = true;
            }
        });

        sql.run("create table if not exists Readings (id INTEGER primary key, RunId int, T1 real, T2 real, T3 real, T4 real, Timestamp TEXT, foreign key(RunId) references Configuration(id));", function (err) {
            if (err) {
                console.log("Error creating Readings table: " + err);
                TableStates.Readings = "Error";
            } else {

                sql.run("create index if not exists Readings_RunId_idx on Readings(RunId);");
                sql.run("create index if not exists Readings_Timestamp_idx on Readings(Timestamp);");

                // insert first probe if none exist
                //powerDb.run("Insert into Probes (id, Type, Board, CurrentChannel, VoltageChannel) select 1,'30A',0,0,0 where (select count(*) from Probes) = 0;");

                console.log('Readings table ready');
                TableStates.Readings = true;
            }
        });
        
    }
});


var WaitForTable = function (tableName, callback) {
    if (TableStates[tableName] == true && !dbLocked)
        callback();
    else if (TableStates[tableName] == "Error")
        callback("Table " + tableName + " failed to initialize");
    else {
        console.log("waiting for table: " + tableName);
        setTimeout(WaitForTable, 100, tableName, callback);
    }
}


String.prototype.escape = function (str) { return (this.replace(/'/g, "''")) }

var db =
{
    insertRunData: function (runId, t1, t2, t3, t4, ts, callback) {
        if (t1 != null)
            t1 = t1.toFixed(1);
        if (t2 != null)
            t2 = t2.toFixed(1);
        if (t3 != null)
            t3 = t3.toFixed(1);
        if (t4 != null)
            t4 = t4.toFixed(1);
        var sqlTxt = "Insert into Readings Values(null," + runId + ',' + t1 + ',' + t2 + ',' + t3 + "," + t4 + ",'" + ts.toISOString() + "');"

        sql.exec(sqlTxt, function (err) {
            if (err)
                console.log("Sql error executing statement: " + sqlTxt + " err: " + err);

            callback(err);
        });
    },
    // return data for a given RunId
    readRunData: function (runId, callback) {

        WaitForTable("Readings", function (err) {

            if (err)
                return callback(err);

            if (runId == null || runId =='undefined' || runId < 0)
                return callback("Must specify a valid runId");

            var sqlTxt = "Select * from Readings where RunId = " + runId + ";";

            sql.all(sqlTxt, function (err, results) {
                if (err) {
                    console.log(sqlTxt);
                    console.log("select err: " + err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        });
    },
    startRun: function (description, weight, food, p1Name, p2Name, p3Name, p4Name, p1Low, p1High, p2Low, p2High, p3Low, p3High, p4Low, p4High, callback) {
        var time = (new Date()).toISOString();
        var sqlTxt = "Insert into Configuration Values(null, '" + description.escape() + "'," + weight + ",'" + food.escape() + "','" + p1Name.escape() + "','" + p2Name.escape() + "','" + p3Name.escape() + "','" + p4Name.escape() + "'," + p1Low + "," + p1High + "," + p2Low + "," + p2High + "," + p3Low + "," + p3High + "," + p4Low + "," + p4High + ",'" + time + "');";
        sql.exec(sqlTxt, function (err) {
            if (err) {
                console.log("Sql error executing statement: " + sqlTxt + " err: " + err);
                callback(err);
            } else {
                // get id of inserted row
                sqlTxt = "Select id from Configuration where Timestamp='" + time + "';";
                sql.all(sqlTxt, function (err, results) {
                    if (err) {
                        console.log(sqlTxt);
                        console.log("select err: " + err);
                        callback(err);
                    } else {
                        callback(null, results[0].id);
                    }
                });
            }
        });
    },
    getLastRun: function (callback) {
        sqlTxt = "Select * from Configuration order by id desc limit 1;";
        sql.all(sqlTxt, function (err, results) {
            if (err) {
                console.log(sqlTxt);
                console.log("select err: " + err);
                callback(err);
            } else {
                callback(null, results);
            }
        });
    },
    updateRun: function (runId, description, weight, food, p1Name, p2Name, p3Name, p4Name, p1Low, p1High, p2Low, p2High, p3Low, p3High, p4Low, p4High, callback) {

        var sqlTxt = "Replace into Configuration Values(" + runId + ",'" + description.escape() + "'," + weight + ",'" + food.escape() + "','" + p1Name.escape() + "','" + p2Name.escape() + "','" + p3Name.escape() + "','" + p4Name.escape() + "'," + p1Low + "," + p1High + "," + p2Low + "," + p2High + "," + p3Low + "," + p3High + "," + p4Low + "," + p4High + ", (select Timestamp from Configuration where id=" + runId + "));";

        sql.exec(sqlTxt, function (err) {
            if (err)
                console.log("Sql error executing statement: " + sqlTxt + " err: " + err);

            callback(err);
        });
    },
    getAllRuns: function (callback) {
        
        WaitForTable("Configuration", function (err) {

            if (err)
                return callback(err);

            var sqlTxt = "Select * from Configuration order by Timestamp desc;";

            sql.all(sqlTxt, function (err, results) {
                if (err) {
                    console.log(sql);
                    console.log("select err: " + err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        });
    },
    deleteRun: function (runId, callback) {
        var sqlTxt = "delete from Readings where RunId=" + runId + ";";
        console.log(sqlTxt);
        sql.all(sqlTxt, function (err) {
            if (err) {
                console.log(sql);
                console.log("delete1 err: " + err);
                callback(err);
            } else {
                sqlTxt = "delete from Configuration where id=" + runId + ";";
                console.log(sqlTxt);
                sql.all(sqlTxt, function (err) {
                    if (err) {
                        console.log(sql);
                        console.log("delete2 err: " + err);
                        callback(err);
                    } else {
                        callback(null);
                    }
                });
            }
        });
    }
};

module.exports = db;

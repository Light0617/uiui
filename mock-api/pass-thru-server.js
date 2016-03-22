var express = require('express')
var bodyParser = require('body-parser')
var request = require('request');
var fs = require('fs');
var mkdirp = require('mkdirp');
var pathHelper =require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var app = express();

var jsonParser = bodyParser.json();
var jobSeed = 0;

var authToken = '';
var getJob = function(name) {
    return {
        id: (jobSeed++) + '',
        title: name,
        user: "user1",
        tenant: "tenant1",
        status: "IN_PROGRESS",
        startDate: null,
        endDate: null,
        parentJobId: 00021,
        reports: null
    }
};

var getRemoteUrl = function(path) {
    var remoteHost = process.argv[2];
    if (!remoteHost) {
        return null;
    }
    return [ remoteHost, path].join('');
};

var getCacheFileName  = function (path) {
    return [__dirname , '/cached-responses/', path, '/data.json'].join('');
};

var saveResponse = function (path, body) {
    var cacheFileName = getCacheFileName(path);
    mkdirp(pathHelper.dirname(cacheFileName), function (err) {
        if (err) {
            console.error(err);
        }
        else {

            fs.writeFile(cacheFileName, body ,function (err) {
                if (err) {
                    console.error(err);
                }
            });
        }
    });


};

var getRemoteResponse = function (req, res) {
    var remoteUrl = getRemoteUrl(req.url);
    if (!remoteUrl) {
        res.sendStatus(404);
        return;
    }
    console.log(remoteUrl);

    var options = { url: remoteUrl, method: 'GET', headers: { 'x-auth-token': authToken}};
    request(options, function (error, response, body){
        if (!error && response.statusCode == 200) {
            saveResponse(req.path, body);
            res.send(body);
        } else {
            res.sendStatus(response.statusCode, error);
        }
    });
};
app.get('*', jsonParser, function(req, res) {
    fs.readFile(getCacheFileName(req.path), function (err, data) {
        if (err) {
            getRemoteResponse(req,res);
        }
        else {
            res.send(data);
        };
    });
});

app.post('/v1/security/tokens', jsonParser, function(req, res) {
    var remoteUrl = getRemoteUrl(req.url);
    if (!remoteUrl) {
        authToken = '000000-000000-000000-000000';
        res.set('x-auth-token', authToken);
        res.sendStatus(200);
        return;
    }

    var options = { url: remoteUrl, method: 'POST', headers: { 'Authorization': req.get('Authorization')}};
    request(options, function (error, response){
        if (!error && response.statusCode == 200) {
            authToken = response.headers['x-auth-token'];
            res.set('x-auth-token', authToken);
            res.sendStatus(200);
        } else {
            res.sendStatus(response.statusCode, error);
        }

    });
});

app.post('*', jsonParser, function(req, res) {
    return res.json(getJob("Started Action..."))
});

app.delete('*', jsonParser, function(req, res) {
    return res.json(getJob("Deleting Item(s)"))
});

app.listen(8080);
console.log('running api on port 8080')

console.log('\nPress Ctrl +C to stop...\n')

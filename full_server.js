/**
 * Created by Evan on 10/24/2016.
 */
//<editor-fold desc="Classes">
var OutgoingMessage = (function () {
    function OutgoingMessage(thisID, forID, data) {
        this.thisID = thisID;
        this.forID = forID;
        this.data = data;
    }
    return OutgoingMessage;
})();
var MessageEnvironment = (function () {
    function MessageEnvironment() {
        this.outgoing = [];
    }
    MessageEnvironment.prototype.checkForMessage = function (forID) {
        for (var i = 0; i < this.outgoing.length; i++) {
            console.log(i);
            if ((this.outgoing[i].forID == forID) || (this.outgoing[i].forID == "ANY")) {
                return this.outgoing[i];
            }
        }
        return null;
    };
    MessageEnvironment.prototype.postMessage = function (forID, data) {
        var newMsg = new OutgoingMessage(this.outgoing.length, forID, data);
        this.outgoing.push(newMsg);
    };
    MessageEnvironment.prototype.deleteMessage = function (msg) {
        for (var i = 0; i < this.outgoing.length; i++) {
            if (this.outgoing[i] === msg) {
                this.outgoing.splice(i, 1);
            }
        }
    };
    return MessageEnvironment;
})();
var Player = (function () {
    function Player(token) {
        this.token = token;
    }
    ;
    Player.prototype.is = function (player) {
        if (player.token === this.token) {
            return true;
        }
        else {
            return false;
        }
    };
    return Player;
})();
var Game = (function () {
    function Game(id, name, player) {
        this.id = id;
        this.name = name;
        this.player1 = player;
        this.messages = new MessageEnvironment();
    }
    ;
    Game.prototype.is = function (game) {
        return (this.id === game.id);
    };
    Game.prototype.canJoin = function () {
        return (!(this.player2));
    };
    Game.prototype.join = function (player) {
        this.player2 = player;
    };
    Game.prototype.remove = function (player) {
        if (this.player1) {
            if (this.player1.is(player)) {
                this.player1 = null;
            }
        }
        if (this.player2) {
            if (this.player2.is(player)) {
                this.player2 = null;
            }
        }
    };
    Game.prototype.isFull = function () {
        if (this.player1 == null || this.player2 == null) {
            return false;
        }
        return true;
    };
    Game.prototype.isEmpty = function () {
        if (this.player1 == null && this.player2 == null) {
            return true;
        }
        return false;
    };
    Game.prototype.postMessage = function (token, data) {
        console.log("Posting message: " + token + ", " + data);
        var opponent = null;
        if (this.isFull()) {
            if (this.player1.token == token) {
                opponent = this.player2;
            }
            else if (this.player2.token == token) {
                opponent = this.player1;
            }
            else if (token == "ANY") {
                this.messages.postMessage("ANY", data);
                return;
            }
            else {
                return;
            }
            this.messages.postMessage(opponent.token, data);
        }
    };
    Game.prototype.pingMessage = function (token, request, response) {
        var msg = this.messages.checkForMessage(token);
        if (msg == null) {
            response.writeHead(404, { 'Content-Type': 'text/html' });
            response.end("404: Content not found");
        }
        else {
            console.log("Read message: " + token + ", " + msg.data);
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.end(msg.data);
            this.messages.deleteMessage(msg);
        }
    };
    return Game;
})();
var GameCollection = (function () {
    function GameCollection() {
        this.games = [];
    }
    GameCollection.prototype.add = function (game) {
        this.games.push(game);
    };
    GameCollection.prototype.get = function (id) {
        for (var i = 0; i < this.games.length; i++) {
            if (this.games[i].id == id) {
                return this.games[i];
            }
        }
        return null;
    };
    GameCollection.prototype.size = function () {
        return this.games.length;
    };
    GameCollection.prototype.remove = function (game) {
        for (var i = 0; i < this.games.length; i++) {
            if (this.games[i].is(game)) {
                this.games.splice(i, 1);
            }
        }
    };
    GameCollection.prototype.toString = function () {
        return JSON.stringify(this.games);
    };
    return GameCollection;
})();
//</editor-fold>
var APIHandler = (function () {
    function APIHandler() {
        //<editor-fold desc="Functions and vars">
        this.games = new GameCollection();
        this.tokens = {};
    }
    //</editor-fold>
    APIHandler.get = function (request, response) {
        var http = require("http"), url = require("url"), path = require("path"), fs = require("fs");
        var uri = url.parse(request.url).pathname;
        //var filename = path.join(process.cwd(), uri);
        var isFileRequest;
        console.log("Request acknowledged");
        if (request.method === "GET") {
            console.log("GET acknowledged");
            if (request.url === "/api") {
                var xmlName = path.join(__dirname, 'root.xml');
                fs.readFile(xmlName, 'binary', function (err, file) {
                    response.writeHead(200, { "Content-Type": "text/xml" });
                    response.end(file, "binary", function (err) {
                        response.end();
                    });
                    return;
                });
            }
            else if (request.url === "/api/updates") {
                var fileName = path.join(__dirname, 'updates.xml');
                fs.readFile(fileName, "binary", function (err, file) {
                    response.writeHead(200, { "Content-Type": "text/xml" });
                    response.end(file, "binary", function (err) {
                        response.end();
                    });
                    return;
                });
            }
            else if (uri == "/api/img") {
                var fileName = path.join(__dirname, 'img.xml');
                fs.readFile(fileName, "binary", function (err, file) {
                    response.writeHead(200, { "Content-Type": "text/xml" });
                    response.end(file, "binary", function (err) {
                        response.end();
                    });
                    return;
                });
            }
            else if (uri == "/api/name") {
                var fileName = path.join(__dirname, 'name.xml');
                fs.readFile(fileName, "binary", function (err, file) {
                    response.writeHead(200);
                    response.end(file, "binary", function (err) {
                        response.end();
                    });
                    return;
                });
            }
            else if (request.url === "/api/getgames") {
                APIHandler.getGames(request, response);
            }
            else if (request.url === "/api/getgamecount") {
                APIHandler.getGameCount(request, response);
            }
            else if (request.url === "/api/gettoken") {
                APIHandler.getToken(request, response);
            }
            else if (uri.indexOf('/api/img') === 0 || uri.indexOf('/api/name') === 0) {
                console.log("Directory accessed");
                var fileName = path.join(__dirname, uri);
                fs.readFile(fileName, "binary", function (err, file) {
                    response.writeHead(200);
                    response.end(file, "binary", function (err) {
                        response.end();
                    });
                    return;
                });
            }
            else {
                response.writeHead(404, { "Content-Type": "text/plain" });
                response.end("404: Content not found\n");
            }
        }
    };
    APIHandler.post = function (request, response) {
        console.log("POST acknowledged");
        if (request.url === "/api/makegame") {
            APIHandler.makeGame(request, response);
        }
        else if (request.url === "/api/joingame") {
            APIHandler.joinGame(request, response);
        }
        else if (request.url === "/api/leavegame") {
            APIHandler.leaveGame(request, response);
        }
        else if (request.url === "/api/getrelaydata") {
            APIHandler.getRelayData(request, response);
        }
        else if (request.url === "/api/postrelaydata") {
            APIHandler.postRelayData(request, response);
        }
        else {
            console.log(request.url);
            response.writeHead(404, { "Content-Type": "text/plain" });
            response.end("404: Content not found\n");
        }
    };
    APIHandler.makeGame = function (request, response) {
        var requestbody = "";
        request.on('data', function (data) {
            requestbody += data;
        });
        request.on('end', function (end) {
            try {
                var payload = JSON.parse(requestbody);
                var gameName = payload.name;
                var gameID = this.games.size();
                var starterIP = request.headers['x-forwarded-for'];
                var gameStarter = new Player(starterIP);
                var newGame = new Game(gameID, gameName, gameStarter);
                this.games.add(newGame);
                response.writeHead(200, { 'Content-Type': 'text/html' });
                response.end("New game made! " + newGame.id + ", " + newGame.name + ", " + newGame.player1.ip);
            }
            catch (e) {
                console.log(e);
            }
        });
    };
    APIHandler.getGames = function (request, response) {
        var gamesString = this.games.toString();
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(gamesString);
    };
    APIHandler.getGameCount = function (request, response) {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(this.games.size() + "");
    };
    APIHandler.getToken = function (request, response) {
        var gamesString = this.games.toString();
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(request.headers['x-forwarded-for']);
    };
    APIHandler.leaveGame = function (request, response) {
        var requestbody = "";
        request.on('data', function (data) {
            requestbody += data;
        });
        request.on('end', function (end) {
            try {
                console.log("leaving game...");
                var payload = JSON.parse(requestbody);
                var gameID = payload.id;
                var chosenGame = this.games.get(gameID);
                var starterIP = request.headers['x-forwarded-for'];
                var chosenPlayer = new Player(starterIP);
                if (chosenGame) {
                    chosenGame.postMessage("ANY", "DISCONNECTED");
                    chosenGame.remove(chosenPlayer);
                    if (chosenGame.isEmpty()) {
                        this.games.remove(chosenGame);
                    }
                    response.writeHead(200, { 'Content-Type': 'text/html' });
                    response.end("Successfully left game: " + chosenGame.id);
                }
                else {
                    response.writeHead(200, { 'Content-Type': 'text/html' });
                    response.end("Game does not exist.");
                }
            }
            catch (e) {
                console.log("leaving game error");
                console.log(e);
            }
        });
    };
    APIHandler.joinGame = function (request, response) {
        var requestbody = "";
        request.on('data', function (data) {
            requestbody += data;
        });
        request.on('end', function (end) {
            try {
                var payload = JSON.parse(requestbody);
                var gameID = payload.id;
                var chosenGame = this.games.get(gameID);
                if (!chosenGame.canJoin()) {
                    response.writeHead(200, { 'Content-Type': 'text/html' });
                    response.end("That game is full!");
                }
                else {
                    var starterIP = request.headers['x-forwarded-for'];
                    var gameStarter = new Player(starterIP);
                    chosenGame.join(gameStarter);
                    chosenGame.postMessage(starterIP, "CONNECTED");
                    response.writeHead(200, { 'Content-Type': 'text/html' });
                    response.end("Successfully joined game: " + chosenGame.id);
                }
            }
            catch (e) {
                console.log(e);
            }
        });
    };
    APIHandler.getRelayData = function (request, response) {
        var requestbody = "";
        request.on('data', function (data) {
            requestbody += data;
        });
        request.on('end', function (end) {
            try {
                var payload = JSON.parse(requestbody);
                var token = payload.token;
                var gameID = payload.id;
                var chosenGame = this.games.get(gameID);
                if (chosenGame) {
                    chosenGame.pingMessage(token, request, response);
                }
            }
            catch (e) {
                console.log(e);
            }
        });
    };
    APIHandler.postRelayData = function (request, response) {
        console.log("Acknowledging data post");
        var requestbody = "";
        request.on('data', function (data) {
            console.log("Getting data: " + data);
            requestbody += data;
        });
        request.on('end', function (end) {
            try {
                console.log("Data complete: " + requestbody);
                requestbody = requestbody.replace(/(\r\n|\n|\r)/gm, "");
                console.log("Data scrubbed: " + requestbody);
                var payload = JSON.parse(requestbody);
                var token = payload.token;
                var gameID = payload.id;
                var data = payload.data;
                var chosenGame = this.games.get(gameID);
                console.log(chosenGame.id + " " + chosenGame.name);
                console.log("token: " + token + " " + "data: " + data);
                if (chosenGame == null) {
                    console.log("Looks like it is somehow undefined...");
                }
                chosenGame.postMessage(token, data);
                response.writeHead(200, { 'Content-Type': 'text/html' });
                response.end("Posted: " + data);
            }
            catch (e) {
                console.log("POSTING DATA ERROR");
                console.log(e);
            }
        });
    };
    APIHandler.getClientAddress = function (req) {
        return (req.headers['x-forwarded-for'] || '').split(',')[0]
            || req.connection.remoteAddress;
    };
    return APIHandler;
})();
/**
 * Created by Evan on 10/24/2016.
 */
var DirectoryServer = (function () {
    function DirectoryServer() {
    }
    DirectoryServer.prototype.startServer = function () {
        var http = require('http');
        var fs = require('fs');
        var path = require('path');
        http.createServer(function (request, response) {
            if (request.method === "GET") {
                GETHandler.catch(request, response);
            }
            if (request.method === "POST") {
                POSTHandler.catch(request, response);
            }
        }).listen(8080);
        console.log('Server running...');
    };
    return DirectoryServer;
})();
/**
 * Created by Evan on 10/24/2016.
 */
var FileHandler = (function () {
    function FileHandler() {
    }
    FileHandler.get = function (request, response) {
        var http = require('http');
        var fs = require('fs');
        var path = require('path');
        console.log('request starting... ' + request.url);
        var filePath = '.' + request.url;
        if (filePath == './')
            filePath = './index.html';
        var extname = path.extname(filePath);
        var contentType = 'text/html';
        switch (extname) {
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.jpg':
                contentType = 'image/jpg';
                break;
            case '.wav':
                contentType = 'audio/wav';
                break;
        }
        fs.readFile(filePath, function (error, content) {
            if (error) {
                if (error.code == 'ENOENT') {
                    fs.readFile('./404.html', function (error, content) {
                        response.writeHead(200, { 'Content-Type': contentType });
                        response.end(content, 'utf-8');
                    });
                }
                else {
                    response.writeHead(500);
                    response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                    response.end();
                }
            }
            else {
                response.writeHead(200, { 'Content-Type': contentType });
                response.end(content, 'utf-8');
            }
        });
    };
    return FileHandler;
})();
/**
 * Created by Evan on 10/24/2016.
 */
var GETHandler = (function () {
    function GETHandler() {
    }
    GETHandler.catch = function (request, response) {
        var url = require('url');
        var uri = url.parse(request.url).pathname;
        if (uri.indexOf('/api/') == 0) {
            APIHandler.get(request, response);
        }
        else {
            FileHandler.get(request, response);
        }
    };
    return GETHandler;
})();
/**
 * Created by Evan on 10/24/2016.
 */
//<editor-fold desc="Classes">
var Utils = (function () {
    function Utils() {
    }
    Utils.isAString = function (input) {
        var startMark = input.indexOf("\"");
        var endMark = input.lastIndexOf("\"");
        /*var newString = input.substring(startMark, endMark);
         if(newString.length > 0){
         return true;
         }
         else{
         return false;
         }*/
        if (startMark != endMark) {
            return true;
        }
        else {
            return false;
        }
    };
    Utils.replaceAll = function (str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace);
    };
    Utils.isNormalInteger = function (str) {
        var n = ~~Number(str);
        return String(n) === str && n >= 0;
    };
    Utils.shaveQuotes = function (input) {
        return input.substring(1, input.length - 1);
    };
    Utils.getMiddleText = function (input) {
        var startMark = input.indexOf(".");
        var endMark = input.lastIndexOf(".");
        return input.substring(startMark + 1, endMark);
    };
    return Utils;
})();
///<reference path="Utils.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
var StringBuilder = (function () {
    function StringBuilder() {
        this.strings = [];
        this.indentation = 0;
    }
    StringBuilder.prototype.removeCommentsMode = function (input) {
        this.removeComments = input;
    };
    StringBuilder.prototype.setIdentation = function (indentation) {
        this.indentation = indentation;
    };
    StringBuilder.prototype.append = function (input) {
        var n = this.indentation;
        while (n > 0) {
            this.strings.push("\t");
            n--;
        }
        this.strings.push(input);
    };
    StringBuilder.prototype.toString = function () {
        if (this.strings.length > 0) {
            var joined = this.strings.join();
            if (this.removeComments) {
                joined = Utils.replaceAll(joined, ",", "");
            }
            return joined;
        }
        else if (this.strings.length == 1) {
            return this.strings[0];
        }
        else {
            return "";
        }
    };
    return StringBuilder;
})();
///<reference path="StringBuilder.ts"/>
///<reference path="Environment.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
var Layout = (function () {
    function Layout(rootTag) {
        this.rootTag = "";
        this.namespaces = [];
        this.attributes = [];
        this.children = [];
        this.rootTag = rootTag;
    }
    Layout.prototype.setRoot = function (tag) {
        this.rootTag = tag;
    };
    Layout.prototype.addNamespace = function (name, uri) {
        this.namespaces.push([name, uri]);
    };
    Layout.prototype.hasAttribute = function (attr_name) {
        for (var i = 0; i < this.attributes.length; i++) {
            if (this.attributes[i][1] == attr_name) {
                return i;
            }
        }
        return -1;
    };
    Layout.prototype.getAttribute = function (attr_name) {
        for (var _i = 0, _a = this.attributes; _i < _a.length; _i++) {
            var attribute = _a[_i];
            if (attribute[1] == attr_name) {
                return attribute[2];
            }
        }
    };
    Layout.prototype.addAttribute = function (namespace, attr_name, value) {
        console.log("Adding attribute: " + namespace + ", " + attr_name + ", " + value);
        var hasAttr = this.hasAttribute(attr_name);
        if (hasAttr != -1) {
            this.attributes[hasAttr] = [namespace, attr_name, value];
            return;
        }
        else {
            this.attributes.push([namespace, attr_name, value]);
        }
    };
    Layout.prototype.addChild = function (child) {
        this.children.push(child);
    };
    Layout.prototype.emitXML = function () {
        return this.emitXMLIndent(0);
    };
    Layout.prototype.emitXMLIndent = function (tabNum) {
        var builder = new StringBuilder();
        builder.setIdentation(tabNum);
        var rootPrefix = "<" + this.rootTag + "\n";
        var rootSuffix = "</" + this.rootTag + ">";
        builder.append(rootPrefix);
        for (var _i = 0, _a = this.namespaces; _i < _a.length; _i++) {
            var xmlns = _a[_i];
            builder.append("\t" + "xmlns:" + xmlns[0] + "=\"" + xmlns[1] + "\"\n");
        }
        for (var _b = 0, _c = this.attributes; _b < _c.length; _b++) {
            var attr = _c[_b];
            builder.append("\t" + attr[0] + ":" + attr[1] + "=\"" + attr[2] + "\"\n");
        }
        if (this.children.length == 0) {
            builder.append("/>\n");
        }
        else {
            builder.append(">\n");
            for (var _d = 0, _e = this.children; _d < _e.length; _d++) {
                var child = _e[_d];
                builder.append("\n" + child.emitXMLIndent(tabNum + 1));
            }
            builder.append(rootSuffix);
        }
        builder.removeCommentsMode(true);
        return builder.toString();
    };
    Layout.prototype.copy = function (environment) {
        console.log("Starting copy...");
        //construct json object
        var jsonObj = {};
        jsonObj.root = this.rootTag;
        jsonObj.namespaces = {};
        for (var _i = 0, _a = this.namespaces; _i < _a.length; _i++) {
            var namespace = _a[_i];
            jsonObj.namespaces[namespace[0]] = namespace[1];
        }
        jsonObj.children = [];
        for (var _b = 0, _c = this.attributes; _b < _c.length; _b++) {
            var attribute = _c[_b];
            if (jsonObj[attribute[0]] == null) {
                jsonObj[attribute[0]] = {};
            }
            jsonObj[attribute[0]][attribute[1]] = attribute[2];
        }
        var wrappedLayout = Layout.fromJSON(environment, jsonObj);
        for (var _d = 0, _e = this.children; _d < _e.length; _d++) {
            var child = _e[_d];
            wrappedLayout.addChild(child.copy(environment));
        }
        console.log("Wrapped");
        return wrappedLayout;
    };
    Layout.fromJSON = function (environment, json) {
        var jsonRoot = json.root;
        var result = new Layout(jsonRoot);
        var jsonNamespaces = json.namespaces;
        for (var key in jsonNamespaces) {
            result.addNamespace(key, jsonNamespaces[key]);
        }
        var jsonChildren = json.children;
        for (var entry in jsonChildren) {
            var child = environment.getVariable(entry).content;
            result.addChild(child);
        }
        var numObjs = Object.keys(json).length;
        console.log("Number of json params: " + numObjs);
        for (var i = 3; i < numObjs; i++) {
            var namespace = Object.keys(json)[i];
            console.log("Namespace: " + namespace);
            var jsonAttrs = json[namespace];
            console.log("Num attributes: " + Object.keys(jsonAttrs).length);
            for (var key in jsonAttrs) {
                result.addAttribute(namespace, key, jsonAttrs[key]);
            }
        }
        return result;
    };
    return Layout;
})();
///<reference path="Layout.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
var NamedVariable = (function () {
    function NamedVariable(name, content) {
        this.name = name;
        this.content = content;
    }
    NamedVariable.prototype.toString = function () {
        return "Name: " + this.name + "\nLayout:\n" + this.content.emitXML() + "\nJSON:\n" + JSON.stringify(this.content);
    };
    return NamedVariable;
})();
///<reference path="NamedVariable.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
var NamedVariableCollection = (function () {
    function NamedVariableCollection() {
        this.variables = [];
    }
    NamedVariableCollection.prototype.add = function (variable) {
        this.variables.push(variable);
    };
    NamedVariableCollection.prototype.containsName = function (name) {
        for (var _i = 0, _a = this.variables; _i < _a.length; _i++) {
            var variable = _a[_i];
            console.log(variable.name + " vs " + name);
            if (variable.name == name) {
                return true;
            }
        }
        return false;
    };
    NamedVariableCollection.prototype.get = function (name) {
        for (var _i = 0, _a = this.variables; _i < _a.length; _i++) {
            var variable = _a[_i];
            if (variable.name == name) {
                return variable;
            }
        }
        return null;
    };
    NamedVariableCollection.prototype.toString = function () {
        var builder = new StringBuilder();
        for (var _i = 0, _a = this.variables; _i < _a.length; _i++) {
            var variable = _a[_i];
            builder.append(variable.toString());
            builder.append("\n");
        }
        return builder.toString();
    };
    return NamedVariableCollection;
})();
/**
 * Created by Evan on 10/19/2016.
 */
var FilePayload = (function () {
    function FilePayload() {
        this.files = {};
    }
    FilePayload.prototype.addFile = function (filename, file) {
        this.files[filename] = file;
    };
    FilePayload.prototype.toZip = function () {
        var zip = require('adm-zip');
        var zipper = new zip();
        for (var filename in this.files) {
            var tempBuffer = new Buffer(this.files[filename]);
            zipper.addFile(filename, tempBuffer, '', 0644 << 16);
        }
        console.log(zipper.getEntries().length);
        for (var _i = 0, _a = zipper.getEntries(); _i < _a.length; _i++) {
            var entry = _a[_i];
            console.log(entry.name);
            entry.isDirectiory = false;
        }
        return zipper.toBuffer();
    };
    return FilePayload;
})();
///<reference path="NamedVariableCollection.ts"/>
///<reference path="Layout.ts"/>
///<reference path="NamedVariable.ts"/>
///<reference path="Command.ts"/>
///<reference path="FilePayload.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
var Environment = (function () {
    function Environment() {
        this.project = new FilePayload();
        this.variables = new NamedVariableCollection();
    }
    Environment.prototype.addNewVariable = function (name, content) {
        var newVar = new NamedVariable(name, content);
        this.variables.add(newVar);
    };
    Environment.prototype.getVariable = function (name) {
        //check for indexed children
        return this.variables.get(name);
    };
    Environment.prototype.runCommand = function (chosenCommand) {
        try {
            chosenCommand.run(this);
        }
        catch (e) {
            console.log(e);
        }
    };
    Environment.prototype.hasVariable = function (variableName) {
        if (this.variables.containsName(variableName)) {
            return true;
        }
        return false;
    };
    Environment.prototype.getAllVariables = function () {
        return this.variables;
    };
    Environment.prototype.getResult = function () {
        return this.project.toZip();
    };
    Environment.prototype.addToProject = function (filename, filetext) {
        this.project.addFile(filename, filetext);
    };
    return Environment;
})();
///<reference path="Environment.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
///<reference path="Command.ts"/>
///<reference path="Environment.ts"/>
var CommandImplementation = (function () {
    function CommandImplementation() {
    }
    CommandImplementation.prototype.setRunnable = function (arg) {
        this.runnable = arg;
    };
    CommandImplementation.prototype.run = function (environment) {
        this.runnable(environment);
    };
    return CommandImplementation;
})();
///<reference path="Environment.ts"/>
///<reference path="Command.ts"/>
///<reference path="CommandImplementation.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
var CommandBuilder = (function () {
    function CommandBuilder() {
    }
    CommandBuilder.build = function (runnable) {
        var impl = new CommandImplementation();
        impl.setRunnable(runnable);
        return impl;
    };
    return CommandBuilder;
})();
///<reference path="Command.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
///<reference path="Command.ts"/>
///<reference path="Environment.ts"/>
///<reference path="CommandBuilder.ts"/>
///<reference path="Rule.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
var AddChildRule = (function () {
    function AddChildRule() {
    }
    AddChildRule.prototype.checkToken = function (token) {
        console.log("Inside add child");
        var tokens = token.split(" ");
        if (!(tokens[0].split(".").length == 2)) {
            console.log(tokens[0].split(".").length);
            console.log(tokens[0].split(".")[0]);
            console.log("1");
            return false;
        }
        var firstDot = tokens[0].indexOf(".");
        var firstPar = tokens[0].indexOf("(");
        var arg = tokens[0].substring(firstDot + 1, firstPar + 1);
        if (!(arg == "addChild(")) {
            console.log("2 " + arg);
            return false;
        }
        return true;
    };
    AddChildRule.prototype.getCommand = function (token) {
        var run = function (environment) {
            var tokens = token.split(" ");
            var varHeader = tokens[0];
            var firstDot = tokens[0].indexOf(".");
            var firstPar = tokens[0].indexOf("(");
            var lastPar = tokens[0].lastIndexOf(")");
            var arg = tokens[0].substring(firstPar + 1, lastPar);
            var varName = tokens[0].substring(0, firstDot);
            if (!(environment.hasVariable(varName))) {
                throw new Error("No such variable \"" + varName + "\" : " + token);
            }
            if (!(environment.hasVariable(arg))) {
                throw new Error("No such variable \"" + arg + "\" : " + token);
            }
            environment.getVariable(varName).content.addChild(environment.getVariable(arg).content);
        };
        return CommandBuilder.build(run);
    };
    return AddChildRule;
})();
///<reference path="Rule.ts"/>
///<reference path="Utils.ts"/>
///<reference path="Command.ts"/>
///<reference path="Environment.ts"/>
///<reference path="CommandBuilder.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
var AddNamespaceRule = (function () {
    function AddNamespaceRule() {
    }
    AddNamespaceRule.prototype.checkToken = function (token) {
        var tokens = token.split(" ");
        if (!(tokens[1] == "=")) {
            return false;
        }
        if (!(Utils.isAString(tokens[2]))) {
            return false;
        }
        if (!(tokens[0].split(".").length == 3)) {
            return false;
        }
        if (!(Utils.getMiddleText(tokens[0]) == "namespaces")) {
            return false;
        }
        return true;
    };
    AddNamespaceRule.prototype.getCommand = function (token) {
        var run = function (environment) {
            var tokens = token.split(" ");
            var varHeader = tokens[0];
            var firstDot = tokens[0].indexOf(".");
            var secondDot = tokens[0].lastIndexOf(".");
            var varName = tokens[0].substring(0, firstDot);
            if (!(environment.hasVariable(varName))) {
                throw new Error("No such variable \"" + varName + "\" : " + token);
            }
            var newNamespaceName;
            newNamespaceName = tokens[0].substring(secondDot + 1, tokens[0].length);
            var valueStr = Utils.shaveQuotes(tokens[2]);
            environment.getVariable(varName).content.addNamespace(newNamespaceName, valueStr);
        };
        return CommandBuilder.build(run);
    };
    return AddNamespaceRule;
})();
///<reference path="Rule.ts"/>
///<reference path="Command.ts"/>
///<reference path="Environment.ts"/>
///<reference path="NamedVariableCollection.ts"/>
///<reference path="CommandBuilder.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
var ColorifyRule = (function () {
    function ColorifyRule() {
    }
    ColorifyRule.prototype.checkToken = function (token) {
        if (!(token == "Colorify()")) {
            return false;
        }
        return true;
    };
    ColorifyRule.prototype.getCommand = function (token) {
        var run = function (environment) {
            var variables = environment.getAllVariables();
            for (var _i = 0, _a = variables.variables; _i < _a.length; _i++) {
                var variable = _a[_i];
                if (variable.content.hasAttribute("background") == -1) {
                    var randomNum = Math.floor(Math.random() * 89999 + 10000);
                    variable.content.addAttribute("android", "background", "#FF" + randomNum);
                }
            }
        };
        return CommandBuilder.build(run);
    };
    return ColorifyRule;
})();
/**
 * Created by Evan on 10/17/2016.
 */
var Constants = (function () {
    function Constants() {
    }
    Constants.isValidType = function (type) {
        for (var _i = 0, _a = this.VALID_VIEW_TYPES; _i < _a.length; _i++) {
            var entry = _a[_i];
            if (entry == type) {
                return true;
            }
        }
        return false;
    };
    Constants.hasRootFilter = function (type) {
        for (var _i = 0, _a = this.ROOT_FILTERS; _i < _a.length; _i++) {
            var entry = _a[_i];
            if (entry[0] == type) {
                return true;
            }
        }
        return false;
    };
    Constants.getRootFilter = function (type) {
        for (var _i = 0, _a = this.ROOT_FILTERS; _i < _a.length; _i++) {
            var entry = _a[_i];
            if (entry[0] == type) {
                return entry[1];
            }
        }
    };
    Constants.getRootTag = function (type) {
        for (var _i = 0, _a = this.VALID_VIEW_TYPES; _i < _a.length; _i++) {
            var entry = _a[_i];
            if (entry == type) {
                if (Constants.hasRootFilter(type)) {
                    return Constants.getRootFilter(type);
                }
                else {
                    return entry;
                }
            }
        }
    };
    Constants.VALID_VIEW_TYPES = [
        "Layout",
        "ActionMenuView",
        "AutoCompleteTextView",
        "Button",
        "CalendarView",
        "CheckBox",
        "CheckedTextView",
        "Chronometer",
        "DatePicker",
        "DigitalClock",
        "EditText",
        "ExpandableListView",
        "FrameLayout",
        "Gallery",
        "GridLayout",
        "GridView",
        "HorizontalScrollView",
        "ImageButton",
        "ImageSwitcher",
        "ImageView",
        "LinearLayout",
        "ListPopupWindow",
        "ListView",
        "MediaController",
        "MultiAutoCompleteTextView",
        "NumberPicker",
        "OverScroller",
        "PopupMenu",
        "PopupWindow",
        "ProgressBar",
        "QuickContactBadge",
        "RadioButton",
        "RadioGroup",
        "RatingBar",
        "RelativeLayout",
        "RemoteViews",
        "Scroller",
        "ScrollView",
        "SearchView",
        "SeekBar",
        "SlidingDrawer",
        "Space",
        "Spinner",
        "StackView",
        "Switch",
        "TabHost",
        "TableLayout",
        "TableRow",
        "TabWidget",
        "TextClock",
        "TextSwitcher",
        "TextView",
        "TimePicker",
        "Toast",
        "ToggleButton",
        "Toolbar",
        "TwoLineListItem",
        "View",
        "VideoView",
        "ViewAnimator",
        "ViewFlipper",
        "ViewSwitcher",
        "ZoomButton",
        "PercentRelativeLayout"
    ];
    Constants.ROOT_FILTERS = [
        ["PercentRelativeLayout", "android.support.percent.PercentRelativeLayout"],
        ["Layout", ""]
    ];
    Constants.LAYOUT_METHODS = [
        "addChild",
        "setMatchParent",
        "setWrapContent"
    ];
    Constants.INDEPENDENT_METHODS = [
        "GenerateIds",
        "Colorify"
    ];
    return Constants;
})();
///<reference path="Rule.ts"/>
///<reference path="Constants.ts"/>
///<reference path="Command.ts"/>
///<reference path="Environment.ts"/>
///<reference path="Layout.ts"/>
///<reference path="CommandBuilder.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
var DeclareThroughCopyRule = (function () {
    function DeclareThroughCopyRule() {
    }
    DeclareThroughCopyRule.prototype.checkToken = function (token) {
        console.log("Declare through copy");
        var tokens = token.split(" ");
        if (!(tokens[2] == "=")) {
            console.log("1");
            return false;
        }
        if (!Constants.isValidType(tokens[0])) {
            console.log("2");
            return false;
        }
        if (!(tokens[3].split(".").length == 2)) {
            console.log("3");
            return false;
        }
        var firstDot = tokens[3].indexOf(".");
        var firstPar = tokens[3].indexOf("(");
        var arg = tokens[3].substring(firstDot + 1, firstPar);
        if (!(arg == "copy")) {
            console.log("4");
            console.log(arg);
            return false;
        }
        return true;
    };
    DeclareThroughCopyRule.prototype.getCommand = function (token) {
        //define run function
        var run = function (environment) {
            var tokens = token.split(" ");
            //variable name
            var variableName = token.split(" ")[1];
            if (environment.hasVariable(variableName)) {
                throw new Error("Variable " + variableName + " already defined: " + token);
            }
            var firstDot = tokens[3].indexOf(".");
            var copiedObjName = tokens[3].substring(0, firstDot);
            if (!(environment.hasVariable(copiedObjName))) {
                throw new Error("No such variable \"" + copiedObjName + "\" : " + token);
            }
            console.log("copied name: " + copiedObjName);
            var locatedVar = environment.getVariable(copiedObjName);
            console.log("located name: " + locatedVar.name);
            console.log("located content: " + JSON.stringify(locatedVar.content));
            var tempLayout = locatedVar.content;
            console.log("content extracted");
            var newLayout = tempLayout.copy(environment);
            console.log("var name: " + variableName);
            console.log("content: " + JSON.stringify(newLayout));
            //add variable
            environment.addNewVariable(variableName, newLayout);
        };
        //build command
        return CommandBuilder.build(run);
    };
    return DeclareThroughCopyRule;
})();
///<reference path="Rule.ts"/>
///<reference path="Utils.ts"/>
///<reference path="Command.ts"/>
///<reference path="Environment.ts"/>
///<reference path="CommandBuilder.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
var ErrorRule = (function () {
    function ErrorRule() {
    }
    ErrorRule.prototype.getCommand = function (token) {
        return undefined;
    };
    ErrorRule.prototype.checkToken = function (token) {
        return undefined;
    };
    return ErrorRule;
})();
///<reference path="Rule.ts"/>
///<reference path="ErrorRule.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
var RuleCollection = (function () {
    function RuleCollection() {
        this.rules = [];
    }
    RuleCollection.prototype.getObjName = function (obj) {
        return Object.prototype.toString.call(obj).slice(8, -1);
    };
    RuleCollection.prototype.findRuleFor = function (token) {
        console.log("Inside findRuleFor");
        var result = null;
        for (var _i = 0, _a = this.rules; _i < _a.length; _i++) {
            var rule = _a[_i];
            console.log("Inside checkToken");
            var isClear = rule.checkToken(token);
            if (isClear) {
                if (result != null) {
                    this.throwDuplicateRuleWarning(token);
                }
                result = rule;
                console.log("Chosen: " + this.getObjName(result) + "\n");
            }
            else {
                console.log("Tried: " + this.getObjName(result) + "\n");
            }
        }
        if (result == null) {
            return new ErrorRule();
        }
        else {
            return result;
        }
    };
    RuleCollection.prototype.throwDuplicateRuleWarning = function (token) {
        console.log("Duplicate rule warning at: " + token);
    };
    RuleCollection.prototype.add = function (rule) {
        this.rules.push(rule);
    };
    RuleCollection.prototype.addAll = function (rules) {
        for (var _i = 0; _i < rules.length; _i++) {
            var rule = rules[_i];
            this.add(rule);
        }
    };
    return RuleCollection;
})();
///<reference path="Rule.ts"/>
///<reference path="Command.ts"/>
///<reference path="Environment.ts"/>
///<reference path="NamedVariableCollection.ts"/>
///<reference path="CommandBuilder.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
var GenerateIdsRule = (function () {
    function GenerateIdsRule() {
    }
    GenerateIdsRule.prototype.checkToken = function (token) {
        if (!(token == "GenerateIds()")) {
            return false;
        }
        return true;
    };
    GenerateIdsRule.prototype.getCommand = function (token) {
        var run = function (environment) {
            var variables = environment.getAllVariables();
            for (var _i = 0, _a = variables.variables; _i < _a.length; _i++) {
                var variable = _a[_i];
                if (variable.content.hasAttribute("id") == -1) {
                    variable.content.addAttribute("android", "id", variable.name);
                }
            }
            for (var _b = 0, _c = variables.variables; _b < _c.length; _b++) {
                var variable = _c[_b];
                GenerateIdsRule.generateIdsForChildren(environment, variable.content);
            }
        };
        return CommandBuilder.build(run);
    };
    GenerateIdsRule.generateIdsForChildren = function (environment, layout) {
        var i = 0;
        for (var _i = 0, _a = layout.children; _i < _a.length; _i++) {
            var child = _a[_i];
            i++;
            if (child.hasAttribute("id") == -1) {
                var parentID = layout.getAttribute("id");
                child.addAttribute("android", "id", parentID + "_child_" + i);
            }
            GenerateIdsRule.generateIdsForChildren(environment, child);
        }
    };
    return GenerateIdsRule;
})();
///<reference path="Rule.ts"/>
///<reference path="Utils.ts"/>
///<reference path="Command.ts"/>
///<reference path="Environment.ts"/>
///<reference path="CommandBuilder.ts"/>
///<reference path="Constants.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
var JsonDeclarationRule = (function () {
    function JsonDeclarationRule() {
    }
    JsonDeclarationRule.prototype.checkToken = function (token) {
        console.log("Checking JSON rule");
        var tokens = token.split(" ");
        if (!(tokens[2] == "=")) {
            console.log("1");
            return false;
        }
        if (!Constants.isValidType(tokens[0])) {
            console.log(2);
            console.log(tokens[0]);
            return false;
        }
        if (!(tokens[3].charAt(0) == "{")) {
            console.log("3");
            return false;
        }
        return true;
    };
    JsonDeclarationRule.prototype.getCommand = function (token) {
        //define run function
        var run = function (environment) {
            console.log("Inside run");
            //variable name
            var variableName = token.split(" ")[1];
            console.log("Variable name: " + variableName);
            if (environment.hasVariable(variableName)) {
                throw new Error("Variable " + variableName + " already defined: " + token);
            }
            //json object isolation
            var startBracket = token.indexOf("{");
            var endBracket = token.lastIndexOf("}");
            var jsonText = token.substring(startBracket, endBracket + 1);
            console.log(jsonText);
            var jsonObj;
            try {
                jsonObj = JSON.parse(jsonText);
            }
            catch (e) {
                throw new Error("Invalid JSON at: " + token + "\n\n" + e.toString());
            }
            console.log("Creating object from JSON...");
            var newLayout = Layout.fromJSON(environment, jsonObj);
            if (newLayout.rootTag == null) {
                var rootString = Constants.getRootTag(token.split(" ")[0]);
                newLayout.rootTag = rootString;
            }
            //add variable
            environment.addNewVariable(variableName, newLayout);
        };
        //build command
        return CommandBuilder.build(run);
    };
    return JsonDeclarationRule;
})();
///<reference path="Rule.ts"/>
///<reference path="Utils.ts"/>
///<reference path="Command.ts"/>
///<reference path="Environment.ts"/>
///<reference path="CommandBuilder.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
var SetAndroidAttributeRule = (function () {
    function SetAndroidAttributeRule() {
    }
    SetAndroidAttributeRule.prototype.checkToken = function (token) {
        console.log("Checking android attribute rule");
        var tokens = token.split(" ");
        if (!(tokens[1] == "=")) {
            console.log("1");
            return false;
        }
        if (!(Utils.isAString(tokens[2]))) {
            console.log("2");
            return false;
        }
        if (!(tokens[0].split(".").length <= 2)) {
            console.log("3");
            if (!(Utils.getMiddleText(tokens[0]) == "android")) {
                console.log("3.1");
                return false;
            }
        }
        return true;
    };
    SetAndroidAttributeRule.prototype.getCommand = function (token) {
        var run = function (environment) {
            var tokens = token.split(" ");
            var varHeader = tokens[0];
            var firstDot = tokens[0].indexOf(".");
            var secondDot = tokens[0].lastIndexOf(".");
            var varName = tokens[0].substring(0, firstDot);
            if (!(environment.hasVariable(varName))) {
                throw new Error("No such variable \"" + varName + "\" : " + token);
            }
            var attrName;
            if (varHeader.split(".").length == 2) {
                attrName = tokens[0].substring(firstDot + 1, tokens[0].length);
            }
            if (varHeader.split(".").length == 3) {
                attrName = tokens[0].substring(secondDot + 1, tokens[0].length);
            }
            var valueStr = Utils.shaveQuotes(tokens[2]);
            environment.getVariable(varName).content.addAttribute("android", attrName, valueStr);
        };
        return CommandBuilder.build(run);
    };
    return SetAndroidAttributeRule;
})();
///<reference path="Rule.ts"/>
///<reference path="Utils.ts"/>
///<reference path="Command.ts"/>
///<reference path="Environment.ts"/>
///<reference path="CommandBuilder.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
var SetCustomNamespaceAttributeRule = (function () {
    function SetCustomNamespaceAttributeRule() {
    }
    SetCustomNamespaceAttributeRule.prototype.checkToken = function (token) {
        console.log("Set Custom namespace");
        var tokens = token.split(" ");
        if (!(tokens[1] == "=")) {
            return false;
        }
        if (!(Utils.isAString(tokens[2]))) {
            return false;
        }
        if (!(tokens[0].split(".").length == 3)) {
            return false;
        }
        console.log(Utils.getMiddleText(tokens[0]));
        if (Utils.getMiddleText(tokens[0]) == "android") {
            return false;
        }
        if (Utils.getMiddleText(tokens[0]) == "namespaces") {
            return false;
        }
        return true;
    };
    SetCustomNamespaceAttributeRule.prototype.getCommand = function (token) {
        var run = function (environment) {
            var tokens = token.split(" ");
            var varHeader = tokens[0];
            var firstDot = tokens[0].indexOf(".");
            var secondDot = tokens[0].lastIndexOf(".");
            var varName = tokens[0].substring(0, firstDot);
            if (!(environment.hasVariable(varName))) {
                throw new Error("No such variable \"" + varName + "\" : " + token);
            }
            var namespaceName = tokens[0].substring(firstDot + 1, secondDot);
            var attrName;
            attrName = tokens[0].substring(secondDot + 1, tokens[0].length);
            var valueStr = Utils.shaveQuotes(tokens[2]);
            environment.getVariable(varName).content.addAttribute(namespaceName, attrName, valueStr);
        };
        return CommandBuilder.build(run);
    };
    return SetCustomNamespaceAttributeRule;
})();
///<reference path="Rule.ts"/>
///<reference path="Command.ts"/>
///<reference path="Environment.ts"/>
///<reference path="CommandBuilder.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
var SetMatchParentRule = (function () {
    function SetMatchParentRule() {
    }
    SetMatchParentRule.prototype.checkToken = function (token) {
        var tokens = token.split(" ");
        if (!(tokens[0].split(".").length == 2)) {
            return false;
        }
        var firstDot = tokens[0].indexOf(".");
        var arg = tokens[0].substring(firstDot + 1, tokens[0].length);
        if (!(arg == "setMatchParent()")) {
            return false;
        }
        return true;
    };
    SetMatchParentRule.prototype.getCommand = function (token) {
        var run = function (environment) {
            var tokens = token.split(" ");
            var varHeader = tokens[0];
            var firstDot = tokens[0].indexOf(".");
            var varName = tokens[0].substring(0, firstDot);
            if (!(environment.hasVariable(varName))) {
                throw new Error("No such variable \"" + varName + "\" : " + token);
            }
            environment.getVariable(varName).content.addAttribute("android", "layout_width", "match_parent");
            environment.getVariable(varName).content.addAttribute("android", "layout_height", "match_parent");
        };
        return CommandBuilder.build(run);
    };
    return SetMatchParentRule;
})();
///<reference path="Rule.ts"/>
///<reference path="Utils.ts"/>
///<reference path="Command.ts"/>
///<reference path="Environment.ts"/>
///<reference path="CommandBuilder.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
var SetRootTagRule = (function () {
    function SetRootTagRule() {
    }
    SetRootTagRule.prototype.checkToken = function (token) {
        var tokens = token.split(" ");
        if (!(tokens[1] == "=")) {
            return false;
        }
        if (!(Utils.isAString(tokens[2]))) {
            return false;
        }
        if (!(tokens[0].split(".").length == 2)) {
            return false;
        }
        var firstDot = tokens[0].indexOf(".");
        var arg = tokens[0].substring(firstDot + 1, tokens[0].length);
        if (!(arg == "root")) {
            return false;
        }
        return true;
    };
    SetRootTagRule.prototype.getCommand = function (token) {
        var run = function (environment) {
            var tokens = token.split(" ");
            var varHeader = tokens[0];
            var firstDot = tokens[0].indexOf(".");
            var varName = tokens[0].substring(0, firstDot);
            if (!(environment.hasVariable(varName))) {
                throw new Error("No such variable \"" + varName + "\" : " + token);
            }
            var valueStr = Utils.shaveQuotes(tokens[2]);
            environment.getVariable(varName).content.setRoot(valueStr);
        };
        return CommandBuilder.build(run);
    };
    return SetRootTagRule;
})();
/**
 * Created by Evan on 10/17/2016.
 */
///<reference path="Rule.ts"/>
///<reference path="Utils.ts"/>
///<reference path="Command.ts"/>
///<reference path="Environment.ts"/>
///<reference path="CommandBuilder.ts"/>
var SetWrapContentRule = (function () {
    function SetWrapContentRule() {
    }
    SetWrapContentRule.prototype.checkToken = function (token) {
        var tokens = token.split(" ");
        if (!(tokens[0].split(".").length == 2)) {
            return false;
        }
        var firstDot = tokens[0].indexOf(".");
        var arg = tokens[0].substring(firstDot + 1, tokens[0].length);
        if (!(arg == "setWrapContent()")) {
            return false;
        }
        return true;
    };
    SetWrapContentRule.prototype.getCommand = function (token) {
        var run = function (environment) {
            var tokens = token.split(" ");
            var varHeader = tokens[0];
            var firstDot = tokens[0].indexOf(".");
            var varName = tokens[0].substring(0, firstDot);
            if (!(environment.hasVariable(varName))) {
                throw new Error("No such variable \"" + varName + "\" : " + token);
            }
            environment.getVariable(varName).content.addAttribute("android", "layout_width", "wrap_content");
            environment.getVariable(varName).content.addAttribute("android", "layout_height", "wrap_content");
        };
        return CommandBuilder.build(run);
    };
    return SetWrapContentRule;
})();
///<reference path="Rule.ts"/>
///<reference path="CommandBuilder.ts"/>
/**
 * Created by Evan on 10/18/2016.
 */
var ProjectEmitXmlRule = (function () {
    function ProjectEmitXmlRule() {
    }
    ProjectEmitXmlRule.prototype.checkToken = function (token) {
        console.log("Inside Project emit");
        var tokens = token.split(" ");
        if (!(tokens[0].split(".").length == 2)) {
            console.log("1");
            return false;
        }
        var firstDot = tokens[0].indexOf(".");
        var firstPar = tokens[0].indexOf("(");
        var lastPar = token.lastIndexOf(")");
        var arg = tokens[0].substring(firstDot + 1, firstPar + 1);
        var obj = tokens[0].substring(0, firstDot);
        var params = token.substring(firstPar + 1, lastPar);
        if (!(params.split(" ").length == 2)) {
            console.log("4");
            console.log(params.split(" ").length);
            console.log(params.split(" ")[0]);
            return false;
        }
        var paramsCommaBreak = params.indexOf(",");
        var firstParam = params.substring(0, paramsCommaBreak);
        var secondParam = params.substring(paramsCommaBreak + 1, params.length);
        if (!(obj == "Project")) {
            console.log("2 " + obj);
            return false;
        }
        if (!(arg == "emitXml(")) {
            console.log("3 " + arg);
            return false;
        }
        if (!(Utils.isAString(firstParam))) {
            console.log("5");
            return false;
        }
        return true;
    };
    ProjectEmitXmlRule.prototype.getCommand = function (token) {
        var run = function (environment) {
            var firstPar = token.indexOf("(");
            var lastPar = token.lastIndexOf(")");
            var params = token.substring(firstPar + 1, lastPar);
            var paramsCommaBreak = params.indexOf(",");
            var firstParam = params.substring(0, paramsCommaBreak);
            var secondParam = params.substring(paramsCommaBreak + 2, params.length);
            if (!(environment.hasVariable(secondParam))) {
                throw new Error("No such variable \"" + secondParam + "\" : " + token);
            }
            environment.addToProject(Utils.shaveQuotes(firstParam) + ".xml", environment.getVariable(secondParam).content.emitXML());
        };
        return CommandBuilder.build(run);
    };
    return ProjectEmitXmlRule;
})();
///<reference path="Rule.ts"/>
///<reference path="Command.ts"/>
///<reference path="Environment.ts"/>
///<reference path="NamedVariableCollection.ts"/>
///<reference path="CommandBuilder.ts"/>
/**
 * Created by Evan on 10/18/2016.
 */
var ProjectEmitJsonRule = (function () {
    function ProjectEmitJsonRule() {
    }
    ProjectEmitJsonRule.prototype.checkToken = function (token) {
        console.log("Inside Project emit");
        var tokens = token.split(" ");
        if (!(tokens[0].split(".").length == 2)) {
            console.log("1");
            return false;
        }
        var firstDot = tokens[0].indexOf(".");
        var firstPar = tokens[0].indexOf("(");
        var lastPar = token.lastIndexOf(")");
        var arg = tokens[0].substring(firstDot + 1, firstPar + 1);
        var obj = tokens[0].substring(0, firstDot);
        var params = token.substring(firstPar + 1, lastPar);
        if (!(params.split(" ").length == 2)) {
            console.log("4");
            console.log(params.split(" ").length);
            console.log(params.split(" ")[0]);
            return false;
        }
        var paramsCommaBreak = params.indexOf(",");
        var firstParam = params.substring(0, paramsCommaBreak);
        var secondParam = params.substring(paramsCommaBreak + 1, params.length);
        if (!(obj == "Project")) {
            console.log("2 " + obj);
            return false;
        }
        if (!(arg == "emitJson(")) {
            console.log("3 " + arg);
            return false;
        }
        if (!(Utils.isAString(firstParam))) {
            console.log("5");
            return false;
        }
        return true;
    };
    ProjectEmitJsonRule.prototype.getCommand = function (token) {
        var run = function (environment) {
            var firstPar = token.indexOf("(");
            var lastPar = token.lastIndexOf(")");
            var params = token.substring(firstPar + 1, lastPar);
            var paramsCommaBreak = params.indexOf(",");
            var firstParam = params.substring(0, paramsCommaBreak);
            var secondParam = params.substring(paramsCommaBreak + 2, params.length);
            if (!(environment.hasVariable(secondParam))) {
                throw new Error("No such variable \"" + secondParam + "\" : " + token);
            }
            environment.addToProject(Utils.shaveQuotes(firstParam) + ".json", JSON.stringify(environment.getVariable(secondParam).content));
        };
        return CommandBuilder.build(run);
    };
    return ProjectEmitJsonRule;
})();
///<reference path="Environment.ts"/>
///<reference path="RuleCollection.ts"/>
///<reference path="Rule.ts"/>
///<reference path="ErrorRule.ts"/>
///<reference path="Command.ts"/>
///<reference path="AddChildRule.ts"/>
///<reference path="AddNamespaceRule.ts"/>
///<reference path="DeclareThroughCopyRule.ts"/>
///<reference path="GenerateIdsRule.ts"/>
///<reference path="JsonDeclarationRule.ts"/>
///<reference path="SetAndroidAttributeRule.ts"/>
///<reference path="SetCustomNamespaceAttributeRule.ts"/>
///<reference path="SetMatchParentRule.ts"/>
///<reference path="SetRootTagRule.ts"/>
///<reference path="SetWrapContentRule.ts"/>
///<reference path="ColorifyRule.ts"/>
///<reference path="ProjectEmitXmlRule.ts"/>
///<reference path="ProjectEmitJsonRule.ts"/>
/**
 * Created by Evan on 10/17/2016.
 */
var Engine = (function () {
    function Engine() {
        this.environment = new Environment();
        this.rules = new RuleCollection();
    }
    Engine.prototype.setRules = function () {
        this.rules.addAll([
            new AddChildRule(),
            new AddNamespaceRule(),
            new DeclareThroughCopyRule(),
            new GenerateIdsRule(),
            new JsonDeclarationRule(),
            new SetAndroidAttributeRule(),
            new SetCustomNamespaceAttributeRule(),
            new SetMatchParentRule(),
            new SetRootTagRule(),
            new SetWrapContentRule(),
            new ColorifyRule(),
            new ProjectEmitXmlRule(),
            new ProjectEmitJsonRule()
        ]);
    };
    Engine.prototype.run = function (input) {
        this.setRules();
        var arrayOfLines = input.split(';');
        console.log("Number of tokens: " + arrayOfLines.length);
        for (var _i = 0; _i < arrayOfLines.length; _i++) {
            var token = arrayOfLines[_i];
            token = this.scrubToken(token);
            console.log("Considering token: " + token);
            var chosenRule = this.rules.findRuleFor(token);
            if (chosenRule instanceof ErrorRule) {
                this.handleError(token);
            }
            else {
                var chosenCommand = chosenRule.getCommand(token);
                this.environment.runCommand(chosenCommand);
            }
            this.environment.addToProject("source.jh", input);
        }
    };
    Engine.prototype.handleError = function (line) {
        console.log("Unknown statement: " + line);
    };
    Engine.prototype.printVars = function () {
        console.log(this.environment.variables.toString());
    };
    Engine.prototype.scrubToken = function (token) {
        return token.trim();
    };
    Engine.prototype.getResult = function () {
        return this.environment.getResult();
    };
    return Engine;
})();
//</editor-fold>
var JohnHenryHandler = (function () {
    function JohnHenryHandler() {
    }
    JohnHenryHandler.post = function (request, response) {
        console.log("Post acknowledged");
        var requestbody = "";
        request.on('data', function (data) {
            console.log("Reading data: " + data);
            requestbody += data;
        });
        request.on('end', function (end) {
            console.log("request read");
            console.log(requestbody.length);
            console.log(requestbody);
            var formattedBody = requestbody.replace("textarea=", "");
            //var payload = JSON.parse(formattedBody);
            var engine = new Engine();
            engine.run(formattedBody);
            var result = engine.getResult();
            response.writeHead(200, { 'Content-Type': 'application/force-download', 'Content-disposition': 'attachment; filename=project.zip' });
            response.end(result);
            /*response.writeHead(404, {"Content-Type": "text/plain"});
             response.end(result);*/
        });
    };
    return JohnHenryHandler;
})();
/**
 * Created by Evan on 10/24/2016.
 */
var POSTHandler = (function () {
    function POSTHandler() {
    }
    POSTHandler.catch = function (request, response) {
        var url = require('url');
        var uri = url.parse(request.url).pathname;
        if (uri.indexOf('/api/') == 0) {
            APIHandler.post(request, response);
        }
        if (uri.indexOf('/john-henry/') == 0) {
            JohnHenryHandler.post(request, response);
        }
    };
    return POSTHandler;
})();

new DirectoryServer().startServer();
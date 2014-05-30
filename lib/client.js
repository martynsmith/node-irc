var messageStream = require("irc-message-stream");
var createSocket = require("./socket");
var Channel = require("./channel");
var net = require("net");
var tls = require("tls");

var Client = function Client(options) {
    this.options = options;
    this.stream = messageStream();
    this.socket = null;

    this.stream.on("data", this._handleMessage)
};

Client.prototype._handleMessage = function _handleMessage(message) {
    var handlers = {
        "PING": function handlePing() {
            message.command = "PONG";
            this.socket.clrfWrite(message.toString());
        }
    }

    var command = message.command;

    if (handlers[command])
        handlers[command].call();
};

Client.prototype.connect = function connect(callback) {
    var self = this;

    if (this.connection)
        return;

    var connection = this.options.connection;
    var port = connection.port;
    var host = connection.host;
    var tlsOptions = connection.tls;

    var authenticate = function authenticate() {
        var identity = self.options.identity;
        var nickname = identity.nickname;
        var username = identity.username;
        var realname = identity.realname;

        self.socket.crlfWrite("NICK %s", nickname);
        self.socket.crlfWrite("USER %s 8 * :%s", username, realname);
    };

    this.socket = createSocket(port, host, tlsOptions, authenticate);

    this.socket.pipe(this.stream);
};

Client.prototype.channel = function channel(name, password) {
    return new Channel(name, password, this.stream);
};

module.exports = Client;

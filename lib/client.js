var messageStream = require("irc-message-stream");
var net = require("net");
var tls = require("tls");

var Client = function Client(options) {
    this.options = options;
    this.stream = messageStream();
    this.socket = null;
}

Client.prototype.connect = function connect(callback) {
    var self = this;

    if (this.connection)
        return;

    var connection = this.options.connection;
    var port = connection.port;
    var host = connection.host;
    var tlsOptions = connection.tls;

    if (tls) {
        this.socket = tls.connect(port, host, tlsOptions, function onSecureConnect() {
            callback.call(self);
        });
    } else {
        this.socket = net.connect(port, host, function onConnect() {
            callback.call(self);
        });
    }

    this.socket.pipe(this.stream);
}

module.exports = Client;

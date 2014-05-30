var util = require("util");
var net = require("net");
var tls = require("tls");

var createSocket = function createSocket(port, host, tls, callback) {
    var socket;

    if (tls) {
        socket = tls.connect(port, host, tlsOptions, function() {
            callback();
        });
    } else {
        socket = net.connect(port, host, function() {
            callback();
        });
    }

    socket.crlfWrite = function(data) {
        var string = util.format.apply(this, arguments);
        this.write(string + "\r\n");
    }

    return socket;
};

module.exports = createSocket;

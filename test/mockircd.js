/* Mock irc server */

var net = require('net');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var MockIrcd = function(port, encoding) {
    var self = this;

    this.port = port || 6667;
    this.encoding = encoding || 'utf-8';
    this.incoming = [];
    this.outgoing = [];

    this.server = net.createServer(function(c) {
        c.on('data', function(data) {
            var msg = data.toString(self.encoding);
            self.emit('message', msg);
            self.incoming = self.incoming.concat(msg.split('\r\n'));
        });

        self.on('send', function(data) {
            self.outgoing.push(data);
            c.write(data);
        });

        c.on('end', function() {
            self.emit('end')
        });
    });

    this.server.listen(this.port);
};
util.inherits(MockIrcd, EventEmitter);

MockIrcd.prototype.send = function(data) {
    this.emit('send', data);
};

MockIrcd.prototype.close = function() {
    this.server.close();
};

MockIrcd.prototype.getIncomingMsgs = function() {
    return this.incoming.filter(function(msg) { return msg; });
};

module.exports = function(port, encoding) {
    return new MockIrcd(port, encoding);
};

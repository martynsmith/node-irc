/* Mock irc server */

var path = require('path');
var fs = require('fs');
var net = require('net');
var os = require('os');
var tls = require('tls');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var MockIrcd = function(port, encoding, isSecure) {
    var self = this;
    var connectionClass;
    var options = {};

    if (isSecure) {
        connectionClass = tls;
        options = {
            key: fs.readFileSync(path.resolve(__dirname, 'data/ircd.key')),
            cert: fs.readFileSync(path.resolve(__dirname, 'data/ircd.pem'))
        };
    } else {
        connectionClass = net;
    }

    this.port = port || (isSecure ? 6697 : 6667);
    this.encoding = encoding || 'utf-8';
    this.incoming = [];
    this.outgoing = [];

    this.server = connectionClass.createServer(options, function(c) {
        c.on('data', function(data) {
            var msg = data.toString(self.encoding).split('\r\n').filter(function(m) { return m; });
            self.incoming = self.incoming.concat(msg);
        });

        self.on('send', function(data) {
            self.outgoing.push(data);
            c.write(data);
        });

        c.on('end', function() {
            self.emit('end');
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
    return this.incoming;
};

module.exports.getTempSocket = function() {
    var tempDir = os.tmpdir();
    var sockPath = path.join(tempDir, 'mock_ircd.sock');
    try {
        fs.unlinkSync(sockPath);
    } catch (e) {
        // ignore
    }
    return sockPath;
}

var fixtures = require('./data/fixtures');
module.exports.getFixtures = function(testSuite) {
    return fixtures[testSuite];
};

module.exports.MockIrcd = function(port, encoding, isSecure) {
    return new MockIrcd(port, encoding, isSecure);
};

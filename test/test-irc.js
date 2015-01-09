var net = require('net');

var irc = require('../lib/irc');
var test = require('tape');

var MockIrcd = require('./mockircd');

test('connect, register and quit', function(t) {
    var client, mock, expected;

    t.plan(3);

    mock = MockIrcd();
    client = new irc.Client('localhost', 'testbot', {});

    expected = {
        sent: [
            ['NICK testbot', 'Client sent NICK message'],
            ['USER nodebot 8 * :nodeJS IRC client', 'Client sent USER message'],
            ['QUIT :node-irc says goodbye', 'Client sent QUIT message']
        ],

        received: [
            [':localhost 001 testbot :Welcome to the Internet Relay Chat Network testbot\r\n', 'Received welcome message']
        ]
    };

    t.plan(expected.sent.length + expected.received.length);

    mock.server.on('connection', function() {
        mock.send(':localhost 001 testbot :Welcome to the Internet Relay Chat Network testbot\r\n');
    });

    client.on('registered', function() {
        t.equal(mock.outgoing[0], expected.received[0][0], expected.received[0][1]);
        client.disconnect();
    });

    mock.on('end', function() {
        var msgs = mock.getIncomingMsgs();

        for (var i = 0; i < msgs.length; i++) {
            t.equal(msgs[i], expected.sent[i][0], expected.sent[i][1]);
        }
        mock.close();
    });
});

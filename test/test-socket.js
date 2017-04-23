var irc = require('../lib/irc');
var test = require('tape');

var testHelpers = require('./helpers');

test('connect and quit socket with message', function(t) {
    var tempSock = testHelpers.getTempSocket();
    var mock = testHelpers.MockIrcd(tempSock);
    var client = new irc.Client(tempSock, 'testbot', {socket: true, debug: true});

    expected = testHelpers.getFixtures('quit');

    t.plan(expected.sent.length + expected.received.length + 1);

    mock.server.on('connection', function() {
        mock.send(':localhost 001 testbot :Welcome to the Internet Relay Chat Network testbot\r\n');
    });

    client.on('registered', function() {
        t.equal(mock.outgoing[0], expected.received[0][0], expected.received[0][1]);
        client.disconnect('quitting as a test', function() {});
    });

    mock.on('end', function() {
        var msgs = mock.getIncomingMsgs();

        t.equal(msgs.length, expected.sent.length, 'Server received the correct amount of messages.')

        for (var i = 0; i < msgs.length; i++) {
            t.equal(msgs[i], expected.sent[i][0], expected.sent[i][1]);
        }
        mock.close();
    });
});

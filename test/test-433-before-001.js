var irc = require('../lib/irc');
var test = require('tape');

var testHelpers = require('./helpers');

test('connect and sets hostmask when nick in use', function(t) {
    var client, mock, expected;

    mock = testHelpers.MockIrcd();
    client = new irc.Client('localhost', 'testbot', {debug: true});

    expected = testHelpers.getFixtures('433-before-001');

    t.plan(expected.sent.length + expected.received.length + expected.clientInfo.length);

    mock.server.on('connection', function() {
        mock.send(':localhost 433 * testbot :Nickname is already in use.\r\n')
        mock.send(':localhost 001 testbot1 :Welcome to the Internet Relay Chat Network testbot\r\n');
    });

    client.on('registered', function() {
        t.equal(mock.outgoing[0], expected.received[0][0], expected.received[0][1]);
        t.equal(mock.outgoing[1], expected.received[1][0], expected.received[1][1]);
        client.disconnect(function() {
            t.equal(client.hostMask, 'testbot', 'hostmask is as expected after 433');
            t.equal(client.nick, 'testbot1', 'nick is as expected after 433');
            t.equal(client.maxLineLength, 482, 'maxLineLength is as expected after 433');
        });
    });

    mock.on('end', function() {
        var msgs = mock.getIncomingMsgs();

        for (var i = 0; i < msgs.length; i++) {
            t.equal(msgs[i], expected.sent[i][0], expected.sent[i][1]);
        }
        mock.close();
    });
});

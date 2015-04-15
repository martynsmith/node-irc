var test = require('tape');

var irc = require('../lib/irc');

var testHelpers = require('./helpers');

test('client emits selfMessage event when it sends a message', function(t) {
    var mock = testHelpers.MockIrcd(),
        client = new irc.Client('localhost', 'testbot');

    client.on('selfMessage', function(to, text) {
        t.equal(to, '#test', 'The client sent a message to #test');
        t.equal(text, 'this is a test message', 'The client sent the message we expected.');
        client.disconnect();
    });

    mock.server.on('connection', function() {
        mock.send(':localhost 001 testbot :Welcome to the Internet Relay Chat Network testbot\r\n');
        mock.send(':testbot JOIN #test\r\n');
    });

    client.on('join#test', function(nick, message) {
        t.equal(nick, 'testbot', 'testbot successfully joined #test');
        client.say('#test', 'this is a test message');
    });

    mock.on('end', function() {
        mock.close();
        t.end();
    });
});

test('client emits selfNotice event when it sends a notice', function(t) {
    var mock = testHelpers.MockIrcd(),
        client = new irc.Client('localhost', 'testbot');

    client.on('selfNotice', function(to, text) {
        t.equal(to, '#test', 'The client sent a notice to #test');
        t.equal(text, 'this is a test notice', 'The client sent the notice we expected.');
        client.disconnect();
    });

    mock.server.on('connection', function() {
        mock.send(':localhost 001 testbot :Welcome to the Internet Relay Chat Network testbot\r\n');
        mock.send(':testbot JOIN #test\r\n');
    });

    client.on('join#test', function(nick, message) {
        t.equal(nick, 'testbot', 'testbot successfully joined #test');
        client.notice('#test', 'this is a test notice');
    });

    mock.on('end', function() {
        mock.close();
        t.end();
    });
});

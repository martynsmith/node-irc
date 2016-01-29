var net = require('net');

var irc = require('../lib/irc');
var test = require('tape');

var testHelpers = require('./helpers');

var expected = testHelpers.getFixtures('basic');
var greeting = ':localhost 001 testbot :Welcome to the Internet Relay Chat Network testbot\r\n';

test('connect, register and quit', function(t) {
    runTests(t, false, false);
});

test('connect, register and quit, securely', function(t) {
    runTests(t, true, false);
});

test('connect, register and quit, securely, with secure object', function(t) {
    runTests(t, true, true);
});

function runTests(t, isSecure, useSecureObject) {
    var port = isSecure ? 6697 : 6667;
    var mock = testHelpers.MockIrcd(port, 'utf-8', isSecure);
    var client;
    if (isSecure && useSecureObject) {
        client = new irc.Client('notlocalhost', 'testbot', {
            secure: {
                host: 'localhost',
                port: port,
                rejectUnauthorized: false
            },
            selfSigned: true,
            retryCount: 0,
            debug: true
        });
    } else {
        var client = new irc.Client('localhost', 'testbot', {
            secure: isSecure,
            selfSigned: true,
            port: port,
            retryCount: 0,
            debug: true
        });
    }

    t.plan(expected.sent.length + expected.received.length);

    mock.server.on(isSecure ? 'secureConnection' : 'connection', function() {
        mock.send(greeting);
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
}

test ('splitting of long lines', function(t) {
    var port = 6667;
    var mock = testHelpers.MockIrcd(port, 'utf-8', false);
    var client = new irc.Client('localhost', 'testbot', {
        secure: false,
        selfSigned: true,
        port: port,
        retryCount: 0,
        debug: true
    });

    var group = testHelpers.getFixtures('_splitLongLines');
    t.plan(group.length);
    group.forEach(function(item) {
        t.deepEqual(client._splitLongLines(item.input, item.maxLength, []), item.result);
    });
    mock.close();
});

test ('splitting of long lines with no maxLength defined.', function(t) {
    var port = 6667;
    var mock = testHelpers.MockIrcd(port, 'utf-8', false);
    var client = new irc.Client('localhost', 'testbot', {
        secure: false,
        selfSigned: true,
        port: port,
        retryCount: 0,
        debug: true
    });

    var group = testHelpers.getFixtures('_splitLongLines_no_max');
    console.log(group.length);
    t.plan(group.length);
    group.forEach(function(item) {
        t.deepEqual(client._splitLongLines(item.input, null, []), item.result);
    });
    mock.close();
});

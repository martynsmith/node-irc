var net = require('net');

var irc = require('../lib/irc');
var test = require('tape');

var testHelpers = require('./helpers');

var expected = testHelpers.getFixtures('CAP');
var greeting = ':localhost 001 testbot :Welcome to the Internet Relay Chat Network testbot\r\n';

test('CAP ACK', function(t) {
  runTests(t, "ACK");
});
test('CAP NAK', function(t) {
  runTests(t, "NAK");
})

function runTests(t, responseType) {
  var port = 6667;
  var mock = testHelpers.MockIrcd();
  var client = new irc.Client('localhost', 'testbot', {
    selfSigned: true,
    port: port,
    retryCount: 0,
    debug: true,
    capIdentifyMsg: true
  });

  t.plan(1);

  mock.server.on('connection', function() {
    mock.send(expected[responseType].received[0][0]);
    mock.send(greeting);
  });

  if (responseType === "NAK") {
    client.on('error', function(err) {
      t.equal(mock.outgoing[0], expected[responseType].received[0][0]);
      client.disconnect();
    });
  } else {
    client.on('registered', function() {
      t.equal(mock.outgoing[0], expected[responseType].received[0][0]);
      client.disconnect();
    });
  }

  mock.on('end', function() {
    mock.close();
  });
}
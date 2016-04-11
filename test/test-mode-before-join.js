var irc = require('../lib/irc');
var test = require('tape');

var testHelpers = require('./helpers');

test('chanmodes being unset when joining a channel', function(t) {
    t.plan(3);

    var mock = testHelpers.MockIrcd();
    var client = new irc.Client('localhost', 'testbot', { debug: true });

    var count = 0;
    client.on('+mode', function() {
        // console.log('+mode: ', client.chans['#channel']);
        t.deepEqual(client.chans['#channel'], expected[count++]);
    });
    client.on('-mode', function() {
        // console.log('-mode: ', client.chans['#channel']);
        t.deepEqual(client.chans['#channel'], expected[count++], 'This mode will not be acknowledged prior to fix of issue #454 since it was not seen before and will instead crash the client');
    });

    var expected = [
        { key: '#channel', serverName: '#channel', users: {}, modeParams: { n: [] }, mode: 'n' },
        { key: '#channel', serverName: '#channel', users: {}, modeParams: { n: [], t: [] }, mode: 'nt' },
        { key: '#channel', serverName: '#channel', users: { testbot: '@' }, mode: '+nt', modeParams: { n: [], t: [] } }
    ];

    mock.server.on('connection', function() {
        mock.send(':localhost MODE #channel +b *!*@AN.IP\r\n');
        mock.send(':localhost 001 testbot :Welcome!\r\n');
        mock.send(':localhost 005 testbot MODES=12 CHANTYPES=# PREFIX=(ohv)@%+ CHANMODES=beIqa,kfL,lj,psmntirRcOAQKVCuzNSMTGHFEB\r\n');
        mock.send(':testbot MODE testbot :+ix\r\n');
        mock.send(':testbot JOIN :#channel\r\n');
        mock.send(':localhost MODE #channel +nt\r\n');
        mock.send(':localhost 353 testbot = #channel :@testbot\r\n');
        mock.send(':localhost 366 testbot #channel :End of /NAMES list.\r\n');
        mock.send(':localhost 324 testbot #channel +nt\r\n');
        mock.send(':localhost MODE #channel -b *!*@AN.IP\r\n');
        client.disconnect();
    });

    mock.on('end', function() {
        mock.close();
        t.end();
    });
});

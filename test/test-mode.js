var irc = require('../lib/irc');
var test = require('tape');

var testHelpers = require('./helpers');

test('various origins and types of chanmodes get handled correctly', function(t) {
    var mock = testHelpers.MockIrcd();
    var client = new irc.Client('localhost', 'testbot', { debug: true });

    var count = 0;
    client.on('+mode', function() {
        //console.log(client.chans['#channel']);
        t.deepEqual(client.chans['#channel'], expected[count++]);
    });
    client.on('-mode', function() {
        //console.log(client.chans['#channel']);
        t.deepEqual(client.chans['#channel'], expected[count++]);
    });

    var expected = [
        { key: '#channel', serverName: '#channel', users: {}, modeParams: { n: [] }, mode: 'n' },
        { key: '#channel', serverName: '#channel', users: {}, modeParams: { n: [], t: [] }, mode: 'nt' },
        { key: '#channel', serverName: '#channel', users: { testbot: '@' }, mode: '+ntb', modeParams: { b: ['*!*@AN.IP.1'], n: [], t: [] } },
        { key: '#channel', serverName: '#channel', users: { testbot: '@' }, mode: '+ntb', modeParams: { b: ['*!*@AN.IP.1', '*!*@AN.IP.2'], n: [], t: [] } },
        { key: '#channel', serverName: '#channel', users: { testbot: '@' }, mode: '+ntb', modeParams: { b: ['*!*@AN.IP.1', '*!*@AN.IP.2', '*!*@AN.IP.3'], n: [], t: [] } },
        { key: '#channel', serverName: '#channel', users: { testbot: '@' }, mode: '+ntb', modeParams: { b: ['*!*@AN.IP.1', '*!*@AN.IP.3'], n: [], t: [] } },
        { key: '#channel', serverName: '#channel', users: { testbot: '@' }, mode: '+ntbf', modeParams: { f: ['[10j]:15'], b: ['*!*@AN.IP.1', '*!*@AN.IP.3'], n: [], t: [] } },
        { key: '#channel', serverName: '#channel', users: { testbot: '@' }, mode: '+ntbf', modeParams: { f: ['[8j]:15'], b: ['*!*@AN.IP.1', '*!*@AN.IP.3'], n: [], t: [] } },
        { key: '#channel', serverName: '#channel', users: { testbot: '@' }, mode: '+ntb', modeParams: { b: ['*!*@AN.IP.1', '*!*@AN.IP.3'], n: [], t: [] } },
        { key: '#channel', serverName: '#channel', users: { testbot: '@' }, mode: '+ntbj', modeParams: { j: ['3:5'], b: ['*!*@AN.IP.1', '*!*@AN.IP.3'], n: [], t: [] } },
        { key: '#channel', serverName: '#channel', users: { testbot: '@' }, mode: '+ntbj', modeParams: { j: ['2:5'], b: ['*!*@AN.IP.1', '*!*@AN.IP.3'], n: [], t: [] } },
        { key: '#channel', serverName: '#channel', users: { testbot: '@' }, mode: '+ntb', modeParams: { b: ['*!*@AN.IP.1', '*!*@AN.IP.3'], n: [], t: [] } },
        { key: '#channel', serverName: '#channel', users: { testbot: '@' }, mode: '+ntbp', modeParams: { p: [], b: ['*!*@AN.IP.1', '*!*@AN.IP.3'], n: [], t: [] } },
        { key: '#channel', serverName: '#channel', users: { testbot: '@' }, mode: '+ntbps', modeParams: { s: [], p: [], b: ['*!*@AN.IP.1', '*!*@AN.IP.3'], n: [], t: [] } },
        { key: '#channel', serverName: '#channel', users: { testbot: '@' }, mode: '+ntbpsK', modeParams: { K: [], s: [], p: [], b: ['*!*@AN.IP.1', '*!*@AN.IP.3'], n: [], t: [] } },
        { key: '#channel', serverName: '#channel', users: { testbot: '@' }, mode: '+ntbsK', modeParams: { K: [], s: [], b: ['*!*@AN.IP.1', '*!*@AN.IP.3'], n: [], t: [] } },
        { key: '#channel', serverName: '#channel', users: { testbot: '@' }, mode: '+ntbK', modeParams: { K: [], b: ['*!*@AN.IP.1', '*!*@AN.IP.3'], n: [], t: [] } },
        { key: '#channel', serverName: '#channel', users: { testbot: '@' }, mode: '+ntbKF', modeParams: { F: [], K: [], b: ['*!*@AN.IP.1', '*!*@AN.IP.3'], n: [], t: [] } }
    ];

    mock.server.on('connection', function() {
        mock.send(':localhost 001 testbot :Welcome!\r\n');
        mock.send(':localhost 005 testbot MODES=12 CHANTYPES=# PREFIX=(ohv)@%+ CHANMODES=beIqa,kfL,lj,psmntirRcOAQKVCuzNSMTGHFEB\r\n');
        mock.send(':testbot MODE testbot :+ix\r\n');
        mock.send(':testbot JOIN :#channel\r\n');
        mock.send(':localhost MODE #channel +nt\r\n');
        mock.send(':localhost 353 testbot = #channel :@testbot\r\n');
        mock.send(':localhost 366 testbot #channel :End of /NAMES list.\r\n');
        mock.send(':localhost 324 testbot #channel +nt\r\n');
        mock.send(':localhost MODE #channel +b *!*@AN.IP.1\r\n');
        mock.send(':localhost MODE #channel +bb *!*@AN.IP.2 *!*@AN.IP.3\r\n');
        mock.send(':localhost MODE #channel -b *!*@AN.IP.2\r\n');
        mock.send(':localhost MODE #channel +f [10j]:15\r\n');
        mock.send(':localhost MODE #channel +f [8j]:15\r\n');
        mock.send(':localhost MODE #channel -f+j [10j]:15 3:5\r\n');
        mock.send(':localhost MODE #channel +j 2:5\r\n');
        mock.send(':localhost MODE #channel -j\r\n');
        mock.send(':localhost MODE #channel +ps\r\n');
        mock.send(':localhost MODE #channel +K-p-s+F\r\n');

        client.disconnect();
    });

    mock.on('end', function() {
        mock.close();
        t.end();
    });
});

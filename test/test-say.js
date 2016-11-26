var irc = require('../lib/irc');
var test = require('tape');
var args = [];

test('various ways to client.say', function(t) {
    var client = new irc.Client('localhost', 'testbot', {
        channels: ['#chan', '#yourchan'],
        retryCount: 0,
        debug: true
    });

    /* overwrite _speak for test */
    client._speak = function() {
        args.push([].slice.call(arguments, 0));
    };

    /* traditional channel message */
    client.say('#chan', 'I\'m a bot!');
    t.deepEqual(args[0], ['PRIVMSG', '#chan', 'I\'m a bot!']);
    args = []; /* reset after every test */

    /* privmsg user */
    client.say('nonbeliever', 'SRSLY, I AM!');
    t.deepEqual(args[0], ['PRIVMSG', 'nonbeliever', 'SRSLY, I AM!']);
    args = [];

    /* privmsg channel and user */
    client.say(['#yourchan', 'nonbeliever'], 'Believe me!');
    t.deepEqual(args[0], ['PRIVMSG', '#yourchan', 'Believe me!']);
    t.deepEqual(args[1], ['PRIVMSG', 'nonbeliever', 'Believe me!']);
    args = [];

    /* privmsg all in options.channel */
    client.say('hello world!');
    t.deepEqual(args[0], ['PRIVMSG', '#chan', 'hello world!']);
    t.deepEqual(args[1], ['PRIVMSG', '#yourchan', 'hello world!']);
    args = [];

    t.end();
});

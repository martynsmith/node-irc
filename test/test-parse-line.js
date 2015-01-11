var parseMessage  = require('../lib/parse_message');
var test = require('tape');

test('irc.parseMessage', function(t) {
    var checks = {
        ':irc.dollyfish.net.nz 372 nodebot :The message of the day was last changed: 2012-6-16 23:57': {
            prefix: 'irc.dollyfish.net.nz',
            server: 'irc.dollyfish.net.nz',
            command: 'rpl_motd',
            rawCommand: '372',
            commandType: 'reply',
            args: ['nodebot', 'The message of the day was last changed: 2012-6-16 23:57']
        },
        ':Ned!~martyn@irc.dollyfish.net.nz PRIVMSG #test :Hello nodebot!': {
            prefix: 'Ned!~martyn@irc.dollyfish.net.nz',
            nick: 'Ned',
            user: '~martyn',
            host: 'irc.dollyfish.net.nz',
            command: 'PRIVMSG',
            rawCommand: 'PRIVMSG',
            commandType: 'normal',
            args: ['#test', 'Hello nodebot!']
        },
        ':Ned!~martyn@irc.dollyfish.net.nz PRIVMSG #test ::-)': {
            prefix: 'Ned!~martyn@irc.dollyfish.net.nz',
            nick: 'Ned',
            user: '~martyn',
            host: 'irc.dollyfish.net.nz',
            command: 'PRIVMSG',
            rawCommand: 'PRIVMSG',
            commandType: 'normal',
            args: ['#test', ':-)']
        },
        ':Ned!~martyn@irc.dollyfish.net.nz PRIVMSG #test ::': {
            prefix: 'Ned!~martyn@irc.dollyfish.net.nz',
            nick: 'Ned',
            user: '~martyn',
            host: 'irc.dollyfish.net.nz',
            command: 'PRIVMSG',
            rawCommand: 'PRIVMSG',
            commandType: 'normal',
            args: ['#test', ':']
        },
        ':Ned!~martyn@irc.dollyfish.net.nz PRIVMSG #test ::^:^:': {
            prefix: 'Ned!~martyn@irc.dollyfish.net.nz',
            nick: 'Ned',
            user: '~martyn',
            host: 'irc.dollyfish.net.nz',
            command: 'PRIVMSG',
            rawCommand: 'PRIVMSG',
            commandType: 'normal',
            args: ['#test', ':^:^:']
        },
        ':some.irc.net 324 webuser #channel +Cnj 5:10': {
            prefix: 'some.irc.net',
            server: 'some.irc.net',
            command: 'rpl_channelmodeis',
            rawCommand: '324',
            commandType: 'reply',
            args: ['webuser', '#channel', '+Cnj', '5:10']
        },
        ':nick!user@host QUIT :Ping timeout: 252 seconds': {
            prefix: 'nick!user@host',
            nick: 'nick',
            user: 'user',
            host: 'host',
            command: 'QUIT',
            rawCommand: 'QUIT',
            commandType: 'normal',
            args: ['Ping timeout: 252 seconds']
        },
        ':nick!user@host PRIVMSG #channel :so : colons: :are :: not a problem ::::': {
            prefix: 'nick!user@host',
            nick: 'nick',
            user: 'user',
            host: 'host',
            command: 'PRIVMSG',
            rawCommand: 'PRIVMSG',
            commandType: 'normal',
            args: ['#channel', 'so : colons: :are :: not a problem ::::']
        },
        ':pratchett.freenode.net 324 nodebot #ubuntu +CLcntjf 5:10 #ubuntu-unregged': {
            prefix: 'pratchett.freenode.net',
            server: 'pratchett.freenode.net',
            command: 'rpl_channelmodeis',
            rawCommand: '324',
            commandType: 'reply',
            args: ['nodebot', '#ubuntu', '+CLcntjf', '5:10', '#ubuntu-unregged']
        }
    };

    Object.keys(checks).forEach(function(line) {
        t.equal(
            JSON.stringify(checks[line]),
            JSON.stringify(parseMessage(line)),
            line + ' parses correctly'
        );
    });
    t.end();
});

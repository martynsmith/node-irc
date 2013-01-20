var irc  = require('../lib/irc.js');
var should = require('should');
var _ = require('underscore');

describe("irc.parseMessage", function() {
    var checks = {
        ':irc.dollyfish.net.nz 372 nodebot :The message of the day was last changed: 2012-6-16 23:57': {
            prefix: "irc.dollyfish.net.nz",
            server: "irc.dollyfish.net.nz",
            command: "rpl_motd",
            rawCommand: "372",
            commandType: "reply",
            args: [ "nodebot", "The message of the day was last changed: 2012-6-16 23:57" ]
        },
        ':Ned!~martyn@irc.dollyfish.net.nz PRIVMSG #test :Hello nodebot!': {
            prefix: "Ned!~martyn@irc.dollyfish.net.nz",
            nick: "Ned",
            user: "~martyn",
            host: "irc.dollyfish.net.nz",
            command: "PRIVMSG",
            rawCommand: "PRIVMSG",
            commandType: "normal",
            args: [ "#test", "Hello nodebot!" ]
        },
        ':Ned!~martyn@irc.dollyfish.net.nz PRIVMSG #test ::-)': {
            prefix: "Ned!~martyn@irc.dollyfish.net.nz",
            nick: "Ned",
            user: "~martyn",
            host: "irc.dollyfish.net.nz",
            command: "PRIVMSG",
            rawCommand: "PRIVMSG",
            commandType: "normal",
            args: [ "#test", ":-)" ]
        },
        ':Ned!~martyn@irc.dollyfish.net.nz PRIVMSG #test ::': {
            prefix: "Ned!~martyn@irc.dollyfish.net.nz",
            nick: "Ned",
            user: "~martyn",
            host: "irc.dollyfish.net.nz",
            command: "PRIVMSG",
            rawCommand: "PRIVMSG",
            commandType: "normal",
            args: [ "#test", ":" ]
        },
        ":Ned!~martyn@irc.dollyfish.net.nz PRIVMSG #test ::^:^:": {
            prefix: "Ned!~martyn@irc.dollyfish.net.nz",
            nick: "Ned",
            user: "~martyn",
            host: "irc.dollyfish.net.nz",
            command: "PRIVMSG",
            rawCommand: "PRIVMSG",
            commandType: "normal",
            args: [ "#test", ":^:^:" ]
        }
    };

    _.each(checks, function(result, line) {
        it('parse ' + line, function() {
            JSON.stringify(result).should.equal(JSON.stringify(irc.parseMessage(line)));
        });
    });
});

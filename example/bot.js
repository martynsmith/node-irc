#!/usr/bin/env node

// Make sure the irc lib is available
require.paths.unshift(__dirname + '/../lib');

var irc = require('irc');
var colors = irc.colors;

var bot = new irc.Client('irc.dollyfish.net.nz', 'nodebot', {
    debug: true,
    channels: ['#blah', '#test'],
});

bot.addListener('error', function(message) {
    console.error('ERROR: %s: %s', message.command, message.args.join(' '));
});

bot.addListener('message#blah', function (from, message) {
    console.log('<%s> %s', from, message);
});

bot.addListener('message', function (from, to, message) {
    console.log('%s => %s: %s', from, to, message);

    if ( to.match(/^[#&]/) ) {
        // channel message
        if ( message.match(/hello/i) ) {
            bot.say(to, 'Hello there ' + from);
        }
        if ( message.match(/dance/) ) {
            setTimeout(function () { bot.say(to, "dances") }, 0);
            setTimeout(function () { bot.action(to, colors.wrap('white', ":D\\-<")) }, 1000);
            setTimeout(function () { bot.action(to, colors.wrap('dark_green', ":D|-<"))  }, 2000);
            setTimeout(function () { bot.action(to, colors.wrap('cyan', ":D/-<"))  }, 3000);
            setTimeout(function () { bot.action(to, colors.wrap('light_red', ":D|-<"))  }, 4000);
        }
    }
    else {
        // private message
    }
});
bot.addListener('pm', function(nick, message) {
    console.log('Got private message from %s: %s', nick, message);
});
bot.addListener('join', function(channel, who) {
    console.log('%s has joined %s', who, channel);
});
bot.addListener('part', function(channel, who, reason) {
    console.log('%s has left %s: %s', who, channel, reason);
});
bot.addListener('kick', function(channel, who, by, reason) {
    console.log('%s was kicked from %s by %s: %s', who, channel, by, reason);
});

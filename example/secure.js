// Make sure the irc lib is available
require.paths.unshift(__dirname + '/../lib');

var sys = require('sys');
var irc = require(__dirname + '/../lib/irc');
/*
* To set the key/cert explicitly, you could do the following
var fs = require('fs');

var options = {
  key: fs.readFileSync('privkey.pem'),
  cert: fs.readFileSync('certificate.crt')
};
*/

// Or to just use defaults
var options = true;

var bot = new irc.Client('irc.dollyfish.net.nz', 'nodebot', {
	port: 7000,
	secure: options,
    channels: ['#blah', '#test'],
});

bot.addListener('error', function(message) {
    sys.puts('ERROR: ' + message.command + ': ' + message.args.join(' '));
});

bot.addListener('message#blah', function (from, message) {
    sys.puts('<' + from + '> ' + message);
});

bot.addListener('message', function (from, to, message) {
    sys.puts(from + ' => ' + to + ': ' + message);

    if ( to.match(/^[#&]/) ) {
        // channel message
        if ( message.match(/hello/i) ) {
            bot.say(to, 'Hello there ' + from);
        }
        if ( message.match(/dance/) ) {
            setTimeout(function () { bot.say(to, "\u0001ACTION dances: :D\\-<\u0001") }, 1000);
            setTimeout(function () { bot.say(to, "\u0001ACTION dances: :D|-<\u0001")  }, 2000);
            setTimeout(function () { bot.say(to, "\u0001ACTION dances: :D/-<\u0001")  }, 3000);
            setTimeout(function () { bot.say(to, "\u0001ACTION dances: :D|-<\u0001")  }, 4000);
        }
    }
    else {
        // private message
    }
});
bot.addListener('pm', function(nick, message) {
    sys.puts('Got private message from ' + nick + ': ' + message);
});
bot.addListener('join', function(channel, who) {
    sys.puts(who + ' has joined ' + channel);
});
bot.addListener('part', function(channel, who, reason) {
    sys.puts(who + ' has left ' + channel + ': ' + reason);
});
bot.addListener('kick', function(channel, who, by, reason) {
    sys.puts(who + ' was kicked from ' + channel + ' by ' + by + ': ' + reason);
});

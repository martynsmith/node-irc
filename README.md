NodeJS IRC client library
=========================

This library provides basic IRC client functionality. In the simplest case you
can connect to an IRC server like so:

    var client = require('irc').Client('irc.dollyfish.net.nz', 'myNick', {
        channels: ['#blah'],
    });

Of course it's not much use once it's connected if that's all you have!

The client emits a large number of events that correlate to things you'd
normally see in your favourite IRC client. Most likely the first one you'll
want to use is:

    client.addListener('message', function (from, to, message) {
        sys.puts(from + ' => ' + to + ': ' + message);
    });

or if you're only interested in messages to the bot itself:

    client.addListener('pm', function (from, message) {
        sys.puts(from + ' => ME: ' + message);
    });

or to a particular channel:

    client.addListener('message#yourchannel', function (from, message) {
        sys.puts(from + ' => #yourchannel: ' + message);
    });

At the moment there are functions for joining:

    client.join('#yourchannel');

parting:

    client.part('#yourchannel');

and talking:

    client.say('#yourchannel', 'I'm a bot!');

For any other commands you might want to send to the server you can use the
send() message which sends raw messages to the server:

    client.send('MODE', '#yourchannel', '+o', 'yournick');

All commands and events are documented in `API.md` (hopefully). I hope to make
a more complete set of events/commands over the next few weeks.

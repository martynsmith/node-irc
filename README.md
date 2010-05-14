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

At the moment there are no helper methods for sending commands back to the
server, so you need to use raw commands (via the send() function). To send a
message for example:

    client.send('PRIVMSG', '#blah', 'I am a nodebot!');

All commands and events are documented in `API.md` (hopefully). I hope to make
a more complete set of events and implement helped commands for sending
messages etc in the next few weeks.

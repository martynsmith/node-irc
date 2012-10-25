`node-irc`_ is an IRC client library written in JavaScript_ for Node_.

.. _`node-irc`: http://node-irc.readthedocs.org/
.. _JavaScript: http://en.wikipedia.org/wiki/JavaScript
.. _Node: http://nodejs.org/

You can access more detailed documentation for this module at `Read the Docs`_


Installation
-------------

The easiest way to get it is via npm_::

    npm install irc

If you want to run the latest version (i.e. later than the version available via
npm_) you can clone this repo, then use npm_ to link-install it::

    npm link /path/to/your/clone

Of course, you can just clone this, and manually point at the library itself,
but I really recommend using npm_!

Basic Usage
-------------

This library provides basic IRC client functionality. In the simplest case you
can connect to an IRC server like so::

    var irc = require('irc');
    var client = new irc.Client('irc.dollyfish.net.nz', 'myNick', {
	channels: ['#blah'],
    });

Of course it's not much use once it's connected if that's all you have!

The client emits a large number of events that correlate to things you'd
normally see in your favourite IRC client. Most likely the first one you'll want
to use is::

    client.addListener('message', function (from, to, message) {
	console.log(from + ' => ' + to + ': ' + message);
    });

or if you're only interested in messages to the bot itself::

    client.addListener('pm', function (from, message) {
	console.log(from + ' => ME: ' + message);
    });

or to a particular channel::

    client.addListener('message#yourchannel', function (from, message) {
	console.log(from + ' => #yourchannel: ' + message);
    });

At the moment there are functions for joining::

    client.join('#yourchannel yourpass');

parting::

    client.part('#yourchannel');

talking::

    client.say('#yourchannel', "I'm a bot!");
    client.say('nonbeliever', "SRSLY, I AM!");

and many others. Check out the API documentation for a complete reference.

For any commands that there aren't methods for you can use the send() method
which sends raw messages to the server::

    client.send('MODE', '#yourchannel', '+o', 'yournick');

Help! - it keeps crashing!
---------------------------

When the client receives errors from the IRC network, it emits an "error"
event. As stated in the `Node JS EventEmitter documentation`_ if you don't bind
something to this error, it will cause a fatal stack trace.

The upshot of this is basically that if you bind an error handler to your
client, errors will be sent there instead of crashing your program.::

    client.addListener('error', function(message) {
        console.log('error: ', message);
    });


Further Documentation
-----------------------

Further documentation (including a complete API reference) are available in
reStructuredText format in the docs/ folder of this project, or online at `Read the Docs`_.

If you find any issues with the documentation (or the module) please send a pull
request or file an issue and I'll do my best to accommodate.

.. _npm: http://github.com/isaacs/npm
.. _here: http://node-irc.readthedocs.org/en/latest/API.html
.. _`Read the Docs`: http://readthedocs.org/docs/node-irc/en/latest/
.. _`Node JS EventEmitter documentation`: http://nodejs.org/api/events.html#events_class_events_eventemitter

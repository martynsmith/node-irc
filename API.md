irc
===

This library provides IRC client functionality

irc.Client(server, nick [, options])
------------------------------------

This object is the base of everything, it represents a single nick
connected to a single IRC server.

The first two arguments are the server to connect to, and the nickname to
attempt to use. The third optional argument is an options object with default
values:

    {
        userName: 'nodebot',
        realName: 'nodeJS IRC client',
        port: 6667,
        debug: false,
        showErrors: false,
        autoRejoin: true,
        autoConnect: true,
        channels: [],
        secure: false
    }

`secure` (SSL connection) can be a true value or an object (the kind of object returned from `crypto.createCredentials()`) specifying cert etc for validation.

Setting `autoConnect` to false prevents the Client from connecting on instantiation.  You will need to call `connect()` on the client instance:

    var client = new irc.Client({ autoConnect: false, ... });
    client.connect();


`irc.Client` instances are an EventEmitters with the following events:

### Event: 'registered'

Emitted when the server sends the initial 001 line, indicating
you've connected to the server.

### Event: 'motd'

`function (motd) { }`

Emitted when the server sends the message of the day to clients.

### Event: 'names'

`function (channel, nicks) { }`

Emitted when the server sends a list of nicks for a channel (which
happens immediately after joining and on request. The nicks object
passed to the callback is keyed by nick names, and has values '',
'+', or '@' depending on the level of that nick in the channel.

### Event: 'topic'

`function (channel, topic, nick) { }`

Emitted when the server sends the channel topic on joining a channel, or when a user changes the topic on a channel.

### Event: 'join'

`function (channel, nick) { }`

Emitted when a user joins a channel (including when the client itself joins a channel).

### Event: 'join#channel'

`function (nick) { }`

As per 'join' event but only emits for the subscribed channel

### Event: 'part'

`function (channel, nick, reason) { }`

Emitted when a user parts a channel (including when the client itself parts a channel).

### Event: 'part#channel'

`function (nick, reason) { }`

As per 'part' event but only emits for the subscribed channel

### Event: 'quit'

`function (nick, reason, channels) { }`

Emitted when a user disconnects from the IRC, leaving the specified array of
channels.

### Event: 'kick'

`function (channel, nick, by, reason) { }`

Emitted when a user is kicked from a channel.

### Event: 'kick#channel'

`function (nick, by, reason) { }`

As per 'kick' event but only emits for the subscribed channel

### Event: 'message'

`function (nick, to, text) { }`

Emitted when a message is sent. `to` can be either a nick (which is most likely this clients nick and means a private message), or a channel (which means a message to that channel).

### Event: 'message#channel'

`function (nick, text) { }`

As per 'message' event but only emits for the subscribed channel

### Event: 'notice'

`function (nick, to, text) { }`

Emitted when a notice is sent. `to` can be either a nick (which is most likely this clients nick and means a private message), or a channel (which means a message to that channel). `nick` is either the senders nick or `null` which means that the notice comes from the server.

### Event: 'pm'

`function (nick, text) { }`

As per 'message' event but only emits when the message is direct to the client

### Event: 'nick'

`function (oldnick, newnick, channels) { }`

Emitted when a user changes nick along with the channels the user is in.

### Event: 'invite'

`function (channel, from) { }`

Emitted when the client recieves an `/invite`.

### Event: 'raw'

`function (message) { }`

Emitted when ever the client receives a "message" from the server. A message is basically a single line of data from the server, but the parameter to the callback has already been parsed and contains:

    message = {
        prefix: "The prefix for the message (optional)",
        nick: "The nickname portion of the prefix (optional)",
        user: "The username portion of the prefix (optional)",
        host: "The hostname portion of the prefix (optional)",
        server: "The servername (if the prefix was a servername)",
        rawCommand: "The command exactly as sent from the server",
        command: "Human readable version of the command",
        commandType: "normal, error, or reply",
        args: ['arguments', 'to', 'the', 'command'],
    }

You can read more about the IRC protocol by reading [RFC 1459](http://www.ietf.org/rfc/rfc1459.txt).

### Event: 'error'

`function (message) { }`

Emitted when ever the server responds with an error-type message. The message
parameter is exactly as in the 'raw' event.

### Client.send(command, arg1, arg2, ...)

Sends a raw message to the server, generally speaking it's best not to use this
method unless you know what you're doing, instead use one of the methods below.

### Client.join(channel, callback)

Joins the specified channel.

`callback` is automatically subscribed to the `join#channel` event, but removed
after the first invocation.

### Client.part(channel, callback)

Parts the specified channel.

callback is automatically subscribed to the `part#channel` event, but removed
after the first invocation.

### Client.say(target, message)

Sends a message to the specified target.

`target` is either a nickname, or a channel.

### Client.disconnect(message)

Disconnects from the IRC server sending the specified parting message.

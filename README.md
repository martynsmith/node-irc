# irc
> Modern IRC client library for Node

__Attention:__ node-irc is currently being rewritten. If you're looking for the last released version (e.g. using **npm**), please checkout the [0.3.x branch](https://github.com/martynsmith/node-irc/tree/0.3.x)

node-irc is a modern IRC client library for Node, exposing a simple interface to deal with IRC connections.

## Usage

Here's an example of a simple client that will echo anything send to a channel, *#echotest*.

```js
var irc = require("irc");

var client = new irc.Client({
    connection: { host: "localhost", port: 6667 },
    identity: { nickname: "EchoClient" }
});

var channel = client.channel("#echotest");

channel.on("message", function(message) {
    channel.send("%s: %s", message.nickname, message.text);
})

client.connect(function() {
    console.log("Connected!");
});
```

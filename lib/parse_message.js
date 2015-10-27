var ircColors = require('irc-colors');
var replyFor = require('./codes');

/**
 * parseMessage(line, stripColors)
 *
 * takes a raw "line" from the IRC server and turns it into an object with
 * useful keys
 * @param {String} line Raw message from IRC server.
 * @param {Boolean} stripColors If true, strip IRC colors.
 * @return {Object} A parsed message object.
 */
module.exports = function parseMessage(line, stripColors) {
    var message = {};
    var match;
    
    // twitch.tv-specific, twitch stuffs a bunch of useful information here
    // need to do a client.send("CAP REQ", "twitch.tv/tags") first
    if(line.charAt(0) == "@") {
        var tagend = line.indexOf(" ");
        var tag = line.slice(1, tagend);
        line = line.slice(tagend + 1);
        var pairs = tag.split(';');
        var tags = {};
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split('=', 2);
            tags[pair[0]] = pair[1];
        }
        message.tags = tags;
    }

    if (stripColors) {
        line = ircColors.stripColorsAndStyle(line);
    }

    // Parse prefix
    match = line.match(/^:([^ ]+) +/);
    if (match) {
        message.prefix = match[1];
        line = line.replace(/^:[^ ]+ +/, '');
        match = message.prefix.match(/^([_a-zA-Z0-9\~\[\]\\`^{}|-]*)(!([^@]+)@(.*))?$/);
        if (match) {
            message.nick = match[1];
            message.user = match[3];
            message.host = match[4];
        }
        else {
            message.server = message.prefix;
        }
    }

    // Parse command
    match = line.match(/^([^ ]+) */);
    message.command = match[1];
    message.rawCommand = match[1];
    message.commandType = 'normal';
    line = line.replace(/^[^ ]+ +/, '');

    if (replyFor[message.rawCommand]) {
        message.command     = replyFor[message.rawCommand].name;
        message.commandType = replyFor[message.rawCommand].type;
    }

    message.args = [];
    var middle, trailing;

    // Parse parameters
    if (line.search(/^:|\s+:/) != -1) {
        match = line.match(/(.*?)(?:^:|\s+:)(.*)/);
        middle = match[1].trimRight();
        trailing = match[2];
    }
    else {
        middle = line;
    }

    if (middle.length)
        message.args = middle.split(/ +/);

    if (typeof (trailing) != 'undefined' && trailing.length)
        message.args.push(trailing);

    return message;
}

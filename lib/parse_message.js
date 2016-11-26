var ircColors = require('irc-colors');
var replyFor = require('./codes');
var parse = require('irc-message').parse;
var parsePrefix = require('irc-prefix-parser');

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
    if (stripColors) {
        line = ircColors.stripColorsAndStyle(line);
    }
    var message = parse(line);
    var prefix = parsePrefix(message.prefix);
    if (prefix.isServer) {
        message.server = prefix.host;
    } else {
        message.nick = prefix.nick;
        message.user = prefix.user;
        message.host = prefix.host;
    }

    message.rawCommand = message.command;
    message.commandType = 'normal';

    if (replyFor[message.rawCommand]) {
        message.command     = replyFor[message.rawCommand].name;
        message.commandType = replyFor[message.rawCommand].type;
    }

    message.args = message.params; // backwards compatibility
    delete message.params; // backwards compatibility
    return message;
}

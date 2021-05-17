import * as ircColors from 'irc-colors';
import {CommandType, replyCodes} from './codes';

export interface Message {
    prefix?: string;
    server?: string;
    nick?: string;
    user?: string;
    host?: string;
    args: string[];
    command?: string;
    rawCommand?: string;
    commandType: CommandType;
};

/**
 * parseMessage(line, stripColors)
 *
 * takes a raw "line" from the IRC server and turns it into an object with
 * useful keys
 * @param line Raw message from IRC server.
 * @param stripColors If true, strip IRC colors.
 * @return A parsed message object.
 */
export function parseMessage(line: string, stripColors: boolean): Message {
    const message: Message = {
        args: [],
        commandType: 'normal',
    };

    if (stripColors) {
        line = ircColors.stripColorsAndStyle(line);
    }

    // Parse prefix
    let match = line.match(/^:([^ ]+) +/);
    if (match) {
        message.prefix = match[1];
        line = line.replace(/^:[^ ]+ +/, '');
        match = message.prefix.match(/^([_a-zA-Z0-9\[\]\\`^{}|-]*)(!([^@]+)@(.*))?$/);
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
    message.command = match?.[1];
    message.rawCommand = match?.[1];
    line = line.replace(/^[^ ]+ +/, '');
    if (message.rawCommand && replyCodes[message.rawCommand]) {
        message.command     = replyCodes[message.rawCommand].name;
        message.commandType = replyCodes[message.rawCommand].type;
    }

    let middle, trailing;

    // Parse parameters
    if (line.search(/^:|\s+:/) != -1) {
        match = line.match(/(.*?)(?:^:|\s+:)(.*)/);
        if (!match) {
            throw Error('Invalid format, could not parse parameters');
        }
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

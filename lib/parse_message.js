"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMessage = void 0;
const ircColors = __importStar(require("irc-colors"));
const codes_1 = require("./codes");
;
/**
 * parseMessage(line, stripColors)
 *
 * takes a raw "line" from the IRC server and turns it into an object with
 * useful keys
 * @param line Raw message from IRC server.
 * @param stripColors If true, strip IRC colors.
 * @return A parsed message object.
 */
function parseMessage(line, stripColors) {
    const message = {
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
    message.command = match === null || match === void 0 ? void 0 : match[1];
    message.rawCommand = match === null || match === void 0 ? void 0 : match[1];
    line = line.replace(/^[^ ]+ +/, '');
    if (message.rawCommand && codes_1.replyCodes[message.rawCommand]) {
        message.command = codes_1.replyCodes[message.rawCommand].name;
        message.commandType = codes_1.replyCodes[message.rawCommand].type;
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
exports.parseMessage = parseMessage;
//# sourceMappingURL=parse_message.js.map
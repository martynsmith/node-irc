/*
    irc.js - Node JS IRC client library

    Copyright 2010 Martyn Smith
    Copyright 2020-2021 The Matrix.org Foundation C.I.C

    This library is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this library.  If not, see <http://www.gnu.org/licenses/>.
*/
import * as dns from 'dns';
import { Socket, createConnection, TcpSocketConnectOpts } from 'net';
import * as tls from 'tls';
import * as util from 'util';
import isValidUTF8 from 'utf-8-validate';
import { EventEmitter } from 'events';
import * as Iconv from 'iconv-lite';
import * as detectCharset from 'chardet';
import { Message, parseMessage } from './parse_message';
import { IrcCapabilities } from './capabilities';

const lineDelimiter = new RegExp('\r\n|\r|\n');
const MIN_DELAY_MS = 33;

export interface ChanData {
    created: string;
    key: string;
    serverName: string;
    users: {[nick: string]: string /* mode */},
    mode: string;
    topic: string;
    topicBy: string;
}

export interface ChanListItem {
    name: string;
    users: string;
    topic: string;
}

export interface WhoisResponse {
    nick: string;
    user?: string;
    channels?: string[];
    host?: string;
    realname?: string;
    away?: string;
    idle?: string;
    server?: string;
    serverinfo?: string;
    operator?: string;
    account?: string;
    accountinfo?: string;
}

export interface IrcClientOpts {
    password?: string|null;
    userName?: string;
    realName?: string;
    port?: number;
    family?: 4|6|null;
    bustRfc3484?: boolean;
    localAddress?: string|null;
    localPort?: number|null;
    debug?: boolean;
    showErrors?: boolean;
    autoRejoin?: boolean;
    autoConnect?: boolean;
    channels?: string[];
    retryCount?: number|null;
    retryDelay?: number;
    secure?: boolean|tls.ConnectionOptions;
    selfSigned?: boolean;
    certExpired?: boolean;
    floodProtection?: boolean;
    floodProtectionDelay?: number;
    sasl?: boolean;
    saslType?: 'PLAIN'|'EXTERNAL';
    stripColors?: boolean;
    channelPrefixes?: string;
    messageSplit?: number;
    encoding?: string|false;
    encodingFallback?: string;
    onNickConflict?: (maxLen?: number) => string,
    webirc?: {
        pass: string,
        ip: string,
        user: string
        host?: string,
    };
    nickMod?: number;
}

/**
 * Similar to `IrcClientOpts` but most properties
 * must be defined.
 */
interface IrcClientOptInternal extends IrcClientOpts {
    password: string|null;
    userName: string;
    realName: string;
    port: number;
    family: 4|6;
    bustRfc3484: boolean;
    localAddress: string|null;
    localPort: number|null;
    debug: boolean;
    showErrors: boolean;
    autoRejoin: boolean;
    autoConnect: boolean;
    channels: string[];
    retryCount: number|null;
    retryDelay: number;
    secure: boolean|tls.ConnectionOptions;
    selfSigned: boolean;
    certExpired: boolean;
    floodProtection: boolean;
    floodProtectionDelay: number;
    sasl: boolean;
    saslType: 'PLAIN'|'EXTERNAL';
    stripColors: boolean;
    channelPrefixes: string;
    messageSplit: number;
    encoding: string|false;
    onNickConflict: (maxLen?: number) => string,
    webirc: {
        pass: string,
        ip: string,
        user: string,
        host?: string,
    };
}

interface IrcSupported {
    channel: {
        idlength: {[key: string]: string};
        length: number;
        limit: {[key: string]: number};
        modes: { a: string; b: string; c: string; d: string;},
        types: string;
    };
    maxlist: {[key: string]: number};
    maxtargets:{[key: string]: number};
    modes: number;
    nicklength: number;
    topiclength: number;
    kicklength: number;
    usermodes: string;
    usermodepriority: string; // E.g "ov"
    // http://www.irc.org/tech_docs/005.html
    casemapping: 'ascii'|'rfc1459'|'strict-rfc1459';
    extra: string[];

}


export class Client extends EventEmitter {
    private sendingPromise = Promise.resolve();
    private lastSendTime = 0;
    private nickMod = 0;
    private opt: IrcClientOptInternal;
    private hostMask = '';
    private prevClashNick = '';
    private maxLineLength = 0;
    public conn?: Socket|tls.TLSSocket;
    private requestedDisconnect = false;
    private supportedState: IrcSupported;
    private capabilities: IrcCapabilities;
    private loggedIn: boolean|null = null;
    /**
     * Cached data
     */
    private whoisData = new Map<string, WhoisResponse>();
    public chans: {[key: string]: ChanData} = {};
    public prefixForMode: {[mode: string]: string} = {}; // o => @
    public modeForPrefix: {[prefix: string]: string} = {}; // @ => o

    /**
     * These variables are used to build up state and should be discarded after use.
     */
    private motd?: string = "";
    private channelListState?: ChanListItem[];

    /**
     * This will either be the requested nick or the actual nickname.
     */
    private currentNick: string;

    get nick() {
        return this.currentNick;
    }

    get supported(): IrcSupported {
        return {
            ...this.supportedState,
        };
    }

    /**
     * Check if the user is logged in (for SASL supporting servers).
     * This will be null if this could not be determined.
     */
    get isLoggedIn() {
        return this.loggedIn;
    }

    constructor (private server: string, requestedNick: string, opt: IrcClientOpts) {
        super();
        this.currentNick = requestedNick;
        /**
         * This promise is used to block new sends until the previous one completes.
         */
        this.sendingPromise = Promise.resolve();
        this.lastSendTime = 0;
        this.opt = {
            password: null,
            userName: 'nodebot',
            realName: 'nodeJS IRC client',
            port: 6667,
            bustRfc3484: false,
            localAddress: null,
            localPort: null,
            debug: false,
            showErrors: false,
            autoRejoin: false,
            autoConnect: true,
            channels: [],
            retryCount: null,
            retryDelay: 2000,
            secure: false,
            selfSigned: false,
            certExpired: false,
            floodProtection: false,
            floodProtectionDelay: 1000,
            sasl: false,
            saslType: 'PLAIN',
            stripColors: false,
            channelPrefixes: '&#',
            messageSplit: 512,
            encoding: false,
            onNickConflict: this.onNickConflict.bind(this),
            webirc: {
                pass: '',
                ip: '',
                user: ''
            },
            ...opt,
            family: opt.family ? opt.family : 4,
        };
        this.nickMod = opt.nickMod ?? 0;

        // Features supported by the server
        // (initial values are RFC 1459 defaults. Zeros signify
        // no default or unlimited value)
        this.supportedState = {
            channel: {
                idlength: {},
                length: 200,
                limit: {},
                modes: { a: '', b: '', c: '', d: ''},
                types: this.opt.channelPrefixes
            },
            kicklength: 0,
            maxlist: {},
            maxtargets: {},
            modes: 3,
            nicklength: 9,
            topiclength: 0,
            usermodes: '',
            usermodepriority: '', // E.g "ov"
            casemapping: 'ascii',
            extra: [],
        };

        this.capabilities = new IrcCapabilities(this.onCapsList.bind(this), this.onCapsConfirmed.bind(this));

        super.on('raw', this.onRaw.bind(this));

        super.on('kick', (channel: string) => {
            if (this.opt.autoRejoin) {this.send('join', ...channel.split(' '));}
        }
        );
        super.on('motd', () => {
            this.opt.channels?.forEach((channel) => {
                this.send('join', ...channel.split(' '));
            });
        });

        // TODO - fail if nick or server missing
        // TODO - fail if username has a space in it
        if (this.opt.autoConnect === true) {
            this.connect();
        }
    }

    private onCapsList() {
        const requiredCapabilites = [];
        if (this.opt.sasl) {
            requiredCapabilites.push('sasl');
        }

        if (requiredCapabilites.length === 0) {
            // Don't bother asking.
            return;
        }
        this.send('CAP REQ :', ...requiredCapabilites);
    }

    private onCapsConfirmed() {
        if (!this.opt.sasl) {
            // No need to do anything.
            return;
        }
        if (this.capabilities.supportsSaslMethod(this.opt.saslType, true)) {
            this._send('AUTHENTICATE', this.opt.saslType);
        }
        else {
            throw Error('Server does not support requested SASL method');
        }
    }

    private onReplyWelcome(message: Message) {
        // Set nick to whatever the server decided it really is
        // (normally this is because you chose something too long and
        // the server has shortened it
        this.currentNick = message.args[0];
        // Note our hostmask to use it in splitting long messages.
        // We don't send our hostmask when issuing PRIVMSGs or NOTICEs,
        // of course, but rather the servers on the other side will
        // include it in messages and will truncate what we send if
        // the string is too long. Therefore, we need to be considerate
        // neighbors and truncate our messages accordingly.
        const welcomeStringWords = message.args[1].split(/\s+/);
        this.hostMask = welcomeStringWords[welcomeStringWords.length - 1];
        this._updateMaxLineLength();
        if (!this.opt.sasl) {
            // If this connection is using SASL, we don't want to emit this until they are authenticated.
            this.emit('registered');
        }
        this.whois(this.nick, (args) => {
            this.currentNick = args.nick;
            this.hostMask = args.user + "@" + args.host;
            this._updateMaxLineLength();
        });
    }

    private onReplyMyInfo(message: Message) {
        this.supportedState.usermodes = message.args[3];
    }

    private onReplyISupport(message: Message) {
        message.args.forEach((arg) => {
            let match;
            match = arg.match(/([A-Z]+)=(.*)/);
            if (!match) {
                return;
            }
            const param = match[1];
            const value = match[2];
            switch (param) {
                case 'CASEMAPPING':
                    // We assume this is fine.
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    this.supportedState.casemapping = value as any;
                    break;
                case 'CHANLIMIT':
                    value.split(',').forEach((val) => {
                        const [val0, val1] = val.split(':');
                        this.supportedState.channel.limit[val0] = parseInt(val1);
                    });
                    break;
                case 'CHANMODES': {
                    const values = value.split(',');
                    const type: ['a', 'b', 'c', 'd'] = ['a', 'b', 'c', 'd'];
                    for (let i = 0; i < type.length; i++) {
                        this.supportedState.channel.modes[type[i]] += values[i];
                    }
                    break;
                }
                case 'CHANTYPES':
                    this.supportedState.channel.types = value;
                    break;
                case 'CHANNELLEN':
                    this.supportedState.channel.length = parseInt(value);
                    break;
                case 'IDCHAN':
                    value.split(',').forEach((val) => {
                        const [val0, val1] = val.split(':');
                        this.supportedState.channel.idlength[val0] = val1;
                    });
                    break;
                case 'KICKLEN':
                    this.supportedState.kicklength = parseInt(value);
                    break;
                case 'MAXLIST':
                    value.split(',').forEach((val) => {
                        const [val0, val1] = val.split(':');
                        this.supportedState.maxlist[val0] = parseInt(val1);
                    });
                    break;
                case 'NICKLEN':
                    this.supportedState.nicklength = parseInt(value);
                    break;
                case 'PREFIX': {
                    match = value.match(/\((.*?)\)(.*)/);
                    if (match) {
                        this.supportedState.usermodepriority = match[1];
                        const match1 = match[1].split('');
                        const match2 = match[2].split('');
                        while (match1.length) {
                            this.modeForPrefix[match2[0]] = match1[0];
                            this.supportedState.channel.modes.b += match1[0];
                            const idx = match1.shift();
                            if (idx) {
                                const result = match2.shift();
                                if (result) {
                                    this.prefixForMode[idx] = result;
                                }
                            }
                        }
                    }
                    break;
                }
                case 'STATUSMSG':
                    break;
                case 'TARGMAX': {
                    value.split(',').forEach((val) => {
                        const [key, v] = val.split(':');
                        const targValue = v ?? parseInt(v);
                        if (typeof targValue === 'number') {
                            this.supportedState.maxtargets[key] = targValue;
                        }
                    });
                    break;
                }
                case 'TOPICLEN':
                    this.supportedState.topiclength = parseInt(value);
                    break;
                default:
                    this.supportedState.extra.push(value);
                    break;
            }
        });
    }

    private onErrNicknameInUse(message: Message) {
        let nextNick = this.opt.onNickConflict();
        if (this.nickMod > 1) {
            // We've already tried to resolve this nick before and have failed to do so.
            // This could just be because there are genuinely 2 clients with the
            // same nick and the same nick with a numeric suffix or it could be much
            // much more gnarly. If there is a conflict and the original nick is equal
            // to the NICKLEN, then we'll never be able to connect because the numeric
            // suffix will always be truncated!
            //
            // To work around this, we'll persist what nick we send up, and compare it
            // to the nick which is returned in this error response. If there is
            // truncation going on, the two nicks won't match, and then we can do
            // something about it.

            if (this.prevClashNick !== '') {
                // we tried to fix things and it still failed, check to make sure
                // that the server isn't truncating our nick.
                const errNick = message.args[1];
                if (errNick !== this.prevClashNick) {
                    nextNick = this.opt.onNickConflict(errNick.length);
                }
            }

            this.prevClashNick = nextNick;
        }

        this._send('NICK', nextNick);
        this.currentNick = nextNick;
        this._updateMaxLineLength();
    }

    private onNotice(message: Message) {
        this._casemap(message, 0);
        const from = message.nick;
        const to = message.args[0];
        const noticeText = message.args[1] || '';
        if (noticeText[0] === '\u0001' && noticeText.lastIndexOf('\u0001') > 0) {
            if (from && to && noticeText) {
                this._handleCTCP(from, to, noticeText, 'notice', message);
            }
            return;
        }
        this.emit('notice', from, to, noticeText, message);

        if (this.opt.debug && to === this.nick) {
            util.log('GOT NOTICE from ' + (from ? '"' + from + '"' : 'the server') + ': "' + noticeText + '"');
        }
    }

    private onMode(message: Message) {
        this._casemap(message, 0);
        if (this.opt.debug) {util.log('MODE: ' + message.args[0] + ' sets mode: ' + message.args[1]);}

        const channel = this.chanData(message.args[0]);
        if (!channel) {
            return ;
        }
        const modeList = message.args[1].split('');
        let adding = true;
        const modeArgs = message.args.slice(2);
        modeList.forEach((mode) => {
            if (mode === '+') {
                adding = true;
                return;
            }
            if (mode === '-') {
                adding = false;
                return;
            }
            if (mode in this.prefixForMode) {
                // channel user modes
                const user = modeArgs.shift();
                if (adding) {
                    if (user && channel.users[user] &&
                        channel.users[user].indexOf(this.prefixForMode[mode]) === -1) {
                        channel.users[user] += this.prefixForMode[mode];
                    }

                    this.emit('+mode', message.args[0], message.nick, mode, user, message);
                }
                else {
                    if (user && channel.users[user]) {
                        channel.users[user] = channel.users[user].replace(this.prefixForMode[mode], '');
                    }
                    this.emit('-mode', message.args[0], message.nick, mode, user, message);
                }
            }
            else {
                let modeArg;
                // channel modes
                if (mode.match(/^[bkl]$/)) {
                    modeArg = modeArgs.shift();
                    if (!modeArg || modeArg.length === 0) {modeArg = undefined;}
                }
                // TODO - deal nicely with channel modes that take args
                if (adding) {
                    if (channel.mode.indexOf(mode) === -1) {channel.mode += mode;}

                    this.emit('+mode', message.args[0], message.nick, mode, modeArg, message);
                }
                else {
                    channel.mode = channel.mode.replace(mode, '');
                    this.emit('-mode', message.args[0], message.nick, mode, modeArg, message);
                }
            }
        });
    }

    private onNick(message: Message) {
        if (message.nick === this.nick) {
            // the user just changed their own nick
            this.currentNick = message.args[0];
            this._updateMaxLineLength();
        }

        if (this.opt.debug) {
            util.log('NICK: ' + message.nick + ' changes nick to ' + message.args[0]);
        }

        const channelsForNick: string[] = [];

        // finding what channels a user is in
        Object.entries(this.chans).forEach(([channame, nickChannel]) => {
            if (message.nick && message.nick in nickChannel.users) {
                nickChannel.users[message.args[0]] = nickChannel.users[message.nick];
                delete nickChannel.users[message.nick];
                channelsForNick.push(channame);
            }
        });

        // old nick, new nick, channels
        this.emit('nick', message.nick, message.args[0], channelsForNick, message);
    }

    private onMotdData(data: string, state?: "start"|"end") {
        if (state === "start") {
            this.motd = `${data}\n`;
            return;
        }
        this.motd += `${data}\n`;
        if (state === "end") {
            this.emit('motd', this.motd);
        }
    }

    private onReplyName(message: Message) {
        this._casemap(message, 2);
        const channel = this.chanData(message.args[2]);
        if (!channel) {
            return;
        }
        if (!message.args[3]) {
            // No users
            return;
        }
        const users = message.args[3].trim().split(/ +/);
        users.forEach(user => {
            // user = "@foo", "+foo", "&@foo", etc...
            // The symbols are the prefix set.
            const allowedSymbols = Object.keys(this.modeForPrefix).join("");
            // Split out the prefix from the nick e.g "@&foo" => ["@&foo", "@&", "foo"]
            const prefixRegex = new RegExp("^([" + escapeRegExp(allowedSymbols) + "]*)(.*)$");
            const match = user.match(prefixRegex);
            if (match) {
                const userPrefixes = match[1];
                let knownPrefixes = '';
                for (let i = 0; i < userPrefixes.length; i++) {
                    if (userPrefixes[i] in this.modeForPrefix) {
                        knownPrefixes += userPrefixes[i];
                    }
                }
                if (knownPrefixes.length > 0) {
                    channel.users[match[2]] = knownPrefixes;
                }
                else {
                    // recombine just in case this server allows weird chars in the nick.
                    // We know it isn't a mode char.
                    channel.users[match[1] + match[2]] = '';
                }
            }
        });
    }

    private onReplyNameEnd(message: Message) {
        this._casemap(message, 1);
        const channel = this.chanData(message.args[1]);
        if (channel) {
            this.emit('names', message.args[1], channel.users);
            this.emit('names' + message.args[1], channel.users);
            this._send('MODE', message.args[1]);
        }
    }

    private onReplyTopic(message: Message) {
        this._casemap(message, 1);
        const channel = this.chanData(message.args[1]);
        if (channel) {
            channel.topic = message.args[2];
        }
    }

    private onTopic(message: Message) {
        // channel, topic, nick
        this._casemap(message, 0);
        this.emit('topic', message.args[0], message.args[1], message.nick, message);

        const channel = this.chanData(message.args[0]);
        if (channel) {
            channel.topic = message.args[1];
            if (message.nick) {
                channel.topicBy = message.nick;
            }
        }
    }

    private onReplyChannelList(message: Message) {
        const chanListEntry = {
            name: message.args[1],
            users: message.args[2],
            topic: message.args[3]
        };
        this.emit('channellist_item', chanListEntry);
        if (this.channelListState) {
            this.channelListState.push(chanListEntry);
        }
    }

    private onReplyTopicWho(message: Message) {
        this._casemap(message, 1);
        const channel = this.chanData(message.args[1]);
        if (channel) {
            channel.topicBy = message.args[2];
            // channel, topic, nick
            this.emit('topic', message.args[1], channel.topic, channel.topicBy, message);
        }
    }

    private onReplyChannelMode(message: Message) {
        this._casemap(message, 1);
        const channel = this.chanData(message.args[1]);
        if (channel) {
            channel.mode = message.args[2];
        }

        this.emit('mode_is', message.args[1], message.args[2]);
    }

    private onReplyCreationTime(message: Message) {
        this._casemap(message, 1);
        const channel = this.chanData(message.args[1]);
        if (channel) {
            channel.created = message.args[2];
        }
    }

    private onJoin(message: Message) {
        this._casemap(message, 0);
        // channel, who
        if (this.nick === message.nick) {
            this.chanData(message.args[0], true);
        }
        else {
            const channel = this.chanData(message.args[0]);
            if (message.nick && channel && channel.users) {
                channel.users[message.nick] = '';
            }
        }
        this.emit('join', message.args[0], message.nick, message);
        this.emit('join' + message.args[0], message.nick, message);
        if (message.args[0] !== message.args[0].toLowerCase()) {
            this.emit('join' + message.args[0].toLowerCase(), message.nick, message);
        }
    }

    private onPart(message: Message) {
        this._casemap(message, 0);
        // channel, who, reason
        this.emit('part', message.args[0], message.nick, message.args[1], message);
        this.emit('part' + message.args[0], message.nick, message.args[1], message);
        if (message.args[0] !== message.args[0].toLowerCase()) {
            this.emit('part' + message.args[0].toLowerCase(), message.nick, message.args[1], message);
        }
        if (this.nick === message.nick) {
            this.removeChanData(message.args[0]);
        }
        else {
            const channel = this.chanData(message.args[0]);
            if (channel && channel.users && message.nick) {
                delete channel.users[message.nick];
            }
        }
    }

    private onKick(message: Message) {
        this._casemap(message, 0);
        // channel, who, by, reason
        this.emit('kick', message.args[0], message.args[1], message.nick, message.args[2], message);
        this.emit('kick' + message.args[0], message.args[1], message.nick, message.args[2], message);
        if (message.args[0] !== message.args[0].toLowerCase()) {
            this.emit('kick' + message.args[0].toLowerCase(),
                message.args[1], message.nick, message.args[2], message);
        }

        if (this.nick === message.args[1]) {
            this.removeChanData(message.args[0]);
        }
        else {
            const channel = this.chanData(message.args[0]);
            if (channel && channel.users) {
                delete channel.users[message.args[1]];
            }
        }
    }

    private onKill(message: Message) {
        const nick = message.args[0];
        const killChannels = [];
        for (const [channame, killChannel] of Object.entries(this.chans)) {
            if (message.nick && message.nick in killChannel.users) {
                delete killChannel.users[message.nick];
                killChannels.push(channame);
            }
        }
        this.emit('kill', nick, message.args[1], killChannels, message);
    }

    private onPrivateMessage(message: Message) {
        this._casemap(message, 0);
        const from = message.nick;
        const to = message.args[0];
        const msgText = message.args[1] || '';
        if (from && msgText[0] === '\u0001' && msgText.lastIndexOf('\u0001') > 0) {
            this._handleCTCP(from, to, msgText, 'privmsg', message);
            return;
        }
        this.emit('message', from, to, msgText, message);
        if (this.supportedState.channel.types.indexOf(to.charAt(0)) !== -1) {
            this.emit('message#', from, to, msgText, message);
            this.emit('message' + to, from, msgText, message);
            if (to !== to.toLowerCase()) {
                this.emit('message' + to.toLowerCase(), from, msgText, message);
            }
        }
        if (to.toUpperCase() === this.nick.toUpperCase()) {this.emit('pm', from, msgText, message);}
        if (this.opt.debug && to === this.nick) {util.log('GOT MESSAGE from ' + from + ': ' + msgText);}
    }

    private onInvite(message: Message) {
        this._casemap(message, 1);
        const from = message.nick;
        this.emit('invite', message.args[1], from, message);
    }

    private onQuit(message: Message) {
        if (this.opt.debug) {util.log('QUIT: ' + message.prefix + ' ' + message.args.join(' '));}
        if (this.nick === message.nick) {
            // TODO handle?
            return;
        }
        // handle other people quitting

        const quitChannels: string[] = [];

        // finding what channels a user is in?
        for (const [channame, quitChannel] of Object.entries(this.chans)) {
            if (message.nick && message.nick in quitChannel.users) {
                delete quitChannel.users[message.nick];
                quitChannels.push(channame);
            }
        }

        // who, reason, channels
        this.emit('quit', message.nick, message.args[0], quitChannels, message);
    }

    private onAuthenticate(message: Message) {
        if (message.args[0] !== '+') {
            return;
        }
        switch (this.opt.saslType) {
            case 'PLAIN':
                this._send('AUTHENTICATE',
                    Buffer.from(
                        this.opt.userName + '\x00' +
                        this.opt.userName + '\x00' +
                        this.opt.password
                    ).toString('base64'));
                break;
            case 'EXTERNAL':
                this._send('AUTHENTICATE', '+');
                break;
            default:
                throw Error('Unexpected SASL type');
        }
    }

    private onBadNickname(message: Message) {
        if (this.opt.showErrors) {util.log('\x1B[01;31mERROR: ' + util.inspect(message) + '\x1B[0m');}

        // The Scunthorpe Problem
        // ----------------------
        //
        // Some IRC servers have offensive word filters on nicks. Trying to change your
        // nick to something with an offensive word in it will return this error.
        //
        // If we are already logged in, this is fine, we can just emit an error and
        // let the client deal with it.
        // If we are NOT logged in however, we need to propose a new nick else we
        // will never be able to connect successfully and the connection will
        // eventually time out, most likely resulting in infinite-reconnects.
        //
        // Check to see if we are NOT logged in, and if so, use a "random" string
        // as the next nick.
        if (this.hostMask !== '') { // hostMask set on rpl_welcome
            this.emit('error', message);
            return;
        }
        // rpl_welcome has not been sent
        // We can't use a truly random string because we still need to abide by
        // the BNF for nicks (first char must be A-Z, length limits, etc). We also
        // want to be able to debug any issues if people say that they didn't get
        // the nick they wanted.
        const rndNick = "enick_" + Math.floor(Math.random() * 1000) // random 3 digits
        this._send('NICK', rndNick);
        this.currentNick = rndNick;
        this._updateMaxLineLength();
    }

    private onRaw(message: Message): void {
        switch (message.command) {
            case 'PING':
                this.send('PONG', message.args[0]);
                this.emit('ping', message.args[0]);
                break;
            case 'PONG':
                this.emit('pong', message.args[0]);
                break;
            case 'rpl_welcome':
                return this.onReplyWelcome(message);
            case 'rpl_myinfo':
                return this.onReplyMyInfo(message);
            case 'rpl_isupport':
                return this.onReplyISupport(message);
            case 'rpl_yourhost':
            case 'rpl_created':
            case 'rpl_luserclient':
            case 'rpl_luserop':
            case 'rpl_luserchannels':
            case 'rpl_luserme':
            case 'rpl_localusers':
            case 'rpl_globalusers':
            case 'rpl_statsconn':
            case 'rpl_luserunknown':
                // Random welcome crap, ignoring
                break;
            case 'err_nicknameinuse':
                return this.onErrNicknameInUse(message);
            case 'NOTICE':
                return this.onNotice(message);
            case 'MODE':
                return this.onMode(message);
            case 'NICK':
                return this.onNick(message);
            case 'rpl_motdstart':
                return this.onMotdData(message.args[1], "start");
            case 'rpl_motd':
                return this.onMotdData(message.args[1]);
            case 'rpl_endofmotd':
            case 'err_nomotd':
                return this.onMotdData(message.args[1], "end");
            case 'rpl_namreply':
                return this.onReplyName(message);
            case 'rpl_endofnames':
                return this.onReplyNameEnd(message);
            case 'rpl_topic':
                return this.onReplyTopic(message);
            case 'rpl_away':
                return this._addWhoisData(message.args[1], 'away', message.args[2], true);
            case 'rpl_whoisuser':
                this._addWhoisData(message.args[1], 'user', message.args[2]);
                this._addWhoisData(message.args[1], 'host', message.args[3]);
                return this._addWhoisData(message.args[1], 'realname', message.args[5]);
            case 'rpl_whoisidle':
                return this._addWhoisData(message.args[1], 'idle', message.args[2]);
            case 'rpl_whoischannels':
                // TODO - clean this up?
                if (message.args.length >= 3) {
                    this._addWhoisData(message.args[1], 'channels', message.args[2].trim().split(/\s+/));
                }
                break;
            case 'rpl_whoisserver':
                this._addWhoisData(message.args[1], 'server', message.args[2]);
                return this._addWhoisData(message.args[1], 'serverinfo', message.args[3]);
            case 'rpl_whoisoperator':
                return this._addWhoisData(message.args[1], 'operator', message.args[2]);
            case 'rpl_whoisaccount':
                this._addWhoisData(message.args[1], 'account', message.args[2]);
                return this._addWhoisData(message.args[1], 'accountinfo', message.args[3]);
            case 'rpl_endofwhois':
                return void this.emit('whois', this._clearWhoisData(message.args[1]));
            case 'rpl_liststart':
                this.channelListState = [];
                return void this.emit('channellist_start');
            case 'rpl_list':
                return this.onReplyChannelList(message);
            case 'rpl_listend':
                this.emit('channellist', this.channelListState);
                // Clear after use.
                this.channelListState = undefined;
                break;
            case 'rpl_topicwhotime':
                return this.onReplyTopicWho(message);
            case 'TOPIC':
                return this.onTopic(message);
            case 'rpl_channelmodeis':
                return this.onReplyChannelMode(message);
            case 'rpl_creationtime':
                return this.onReplyCreationTime(message);
            case 'JOIN':
                return this.onJoin(message);
            case 'PART':
                return this.onPart(message);
            case 'KICK':
                return this.onKick(message);
            case 'KILL':
                return this.onKill(message);
            case 'PRIVMSG':
                return this.onPrivateMessage(message);
            case 'INVITE':
                return this.onInvite(message);
            case 'QUIT':
                return this.onQuit(message);
            case 'CAP':
                return this.capabilities.onCap(message);
            case 'AUTHENTICATE':
                return this.onAuthenticate(message);
            case 'rpl_loggedin':
                this.emit('sasl_loggedin', ...message.args);
                this.loggedIn = true;
                break;
            case 'rpl_loggedout':
                this.emit('sasl_loggedout', ...message.args);
                this.loggedIn = false;
                break;
            case 'err_saslfail':
            case 'err_sasltoolong':
            case 'err_saslaborted':
            case 'err_saslalready':
                this.emit('sasl_error', message.command, ...message.args);
                this.emit('registered'); // emit on failed OR
                // We're not going to retry on this connection, so end it.
                return this._send('CAP', 'END');
            case 'rpl_saslsuccess':
                this.emit('registered'); // emit on success
                return this._send('CAP', 'END');
            case 'err_unavailresource':
            // err_unavailresource has been seen in the wild on Freenode when trying to
            // connect with the nick 'boot'. I'm guessing they have reserved that nick so
            // no one can claim it. The error handling though is identical to offensive word
            // nicks hence the fall through here.
            case 'err_erroneusnickname':
                return this.onBadNickname(message);
            default:
                if (message.commandType === 'error') {
                    this.emit('error', message);
                    if (this.opt.showErrors) {util.log('\u001b[01;31mERROR: ' + util.inspect(message) + '\u001b[0m');}
                }
                else {
                    if (this.opt.debug) {
                        util.log('\u001b[01;31mUnhandled message: ' + util.inspect(message) + '\u001b[0m');
                    }
                    break;
                }
        }
    }

    private onNickConflict(maxLen?: number): string {
        if (typeof (this.nickMod) === 'undefined') {
            this.nickMod = 0;
        }
        this.nickMod++;
        let n = this.nick + this.nickMod;
        if (maxLen && n.length > maxLen) {
            // truncate the end of the nick and then suffix a numeric
            const digitStr = "" + this.nickMod;
            const maxNickSegmentLen = maxLen - digitStr.length;
            n = this.nick.substr(0, maxNickSegmentLen) + digitStr;
        }
        return n;
    }

    public chanData(name: string, create = false) {
        const key = name.toLowerCase();
        if (create) {
            this.chans[key] = this.chans[key] || {
                key: key,
                serverName: name,
                users: {},
                mode: ''
            };
        }

        return this.chans[key];
    }

    public removeChanData(name: string) {
        const key = name.toLowerCase();
        // Sometimes we can hit a race where we will get a PART about ourselves before we
        // have joined a channel fully and stored it in state.
        // Ensure that we have chanData before deleting
        if (this.chans[key]) {
            delete this.chans[key];
        }
    }

    private _connectionHandler() {
        if (this.opt.webirc.ip && this.opt.webirc.pass && this.opt.webirc.host) {
            this._send('WEBIRC', this.opt.webirc.pass, this.opt.userName, this.opt.webirc.host, this.opt.webirc.ip);
        }
        if (!this.opt.sasl && this.opt.password) {
            // Legacy PASS command, use when not using sasl.
            this._send('PASS', this.opt.password);
        }
        if (this.opt.debug) {util.log('Sending irc NICK/USER');}
        this._send('NICK', this.nick);
        this.currentNick = this.nick;
        this._updateMaxLineLength();
        this._send('USER', this.opt.userName, '8', '*', this.opt.realName);
        // Request capabilities.
        // https://ircv3.net/specs/extensions/capability-negotiation.html
        this._send('CAP LS', '302');
        this.emit('connect');
    }

    public connect(retryCountOrCallBack?: number|(() => void), callback?: () => void) {
        let retryCount: number;
        if (typeof retryCountOrCallBack === 'function') {
            callback = retryCountOrCallBack;
            retryCount = this.opt.retryCount ?? 0;
        }
        else {
            retryCount = retryCountOrCallBack ?? this.opt.retryCount ?? 0;
        }
        if (typeof callback === 'function') {
            this.once('registered', callback);
        }
        this.chans = {};

        // socket opts
        const connectionOpts: TcpSocketConnectOpts = {
            host: this.server,
            port: this.opt.port,
            family: this.opt.family,
        };

        // local address to bind to
        if (this.opt.localAddress) {connectionOpts.localAddress = this.opt.localAddress;}
        if (this.opt.localPort) {connectionOpts.localPort = this.opt.localPort;}

        if (this.opt.bustRfc3484) {
            // RFC 3484 attempts to sort address results by "locallity", taking
            //   into consideration the length of the common prefix between the
            //   candidate local source address and the destination. In practice
            //   this always sorts one or two servers ahead of all the rest, which
            //   isn't what we want for proper load balancing. With this option set
            //   we'll randomise the list of all results so that we can spread load
            //   between all the servers.
            connectionOpts.lookup = (hostname, options, lookupCb) => {
                dns.lookup(hostname, {all: true, ...options}, (err, addresses) => {
                    // @types/node doesn't provision for an all callback response, so we have to
                    // do some unsafe typing here.
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const typelessCb = (lookupCb as any);
                    if (err) {
                        if (options.all) {
                            //
                            return typelessCb(err, addresses);
                        }
                        return typelessCb(err, null, null);
                    }

                    if (options.all) {
                        const shuffled: dns.LookupAddress[] = [];
                        while (Array.isArray(addresses) && addresses.length) {
                            const i = randomInt(addresses.length);
                            shuffled.push(addresses.splice(i, 1)[0]);
                        }
                        typelessCb(err, shuffled);
                    }
                    else {
                        const chosen = addresses[randomInt(addresses.length)] as dns.LookupAddress;
                        typelessCb(err, chosen.address, chosen.family);
                    }
                });
            };
        }

        // destroy old socket before allocating a new one
        if (this.conn) {this.conn.destroy();}

        // try to connect to the server
        if (this.opt.secure) {
            let secureOpts: tls.ConnectionOptions = {
                ...connectionOpts,
                enableTrace: true,
                rejectUnauthorized: !this.opt.selfSigned,
            }

            if (typeof this.opt.secure === 'object') {
                // copy "secure" opts to options passed to connect()
                secureOpts = {
                    ...secureOpts,
                    ...this.opt.secure,
                };
            }

            this.conn = tls.connect(secureOpts, () => {
                if (this.conn === undefined) {
                    throw Error('Conn was not defined');
                }
                if (!(this.conn instanceof tls.TLSSocket)) {
                    throw Error('Conn was not a TLSSocket');
                }

                // callback called only after successful socket connection

                if (!this.conn.authorized) {
                    switch (this.conn.authorizationError.toString()) {
                        case 'DEPTH_ZERO_SELF_SIGNED_CERT':
                        case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
                        case 'SELF_SIGNED_CERT_IN_CHAIN':
                            if (!this.opt.selfSigned) {
                                return this.conn.destroy(this.conn.authorizationError);
                            }
                            break;
                        case 'CERT_HAS_EXPIRED':
                            if (!this.opt.certExpired) {
                                return this.conn.destroy(this.conn.authorizationError);
                            }
                            break;
                        default:
                            // Fail on other errors
                            return this.conn.destroy(this.conn.authorizationError)
                    }
                }
                if (!this.opt.encoding) {
                    this.conn.setEncoding('utf-8');
                }
                this._connectionHandler();
            });
        }
        else {
            this.conn = createConnection(connectionOpts, this._connectionHandler.bind(this));
        }

        this.requestedDisconnect = false;
        this.conn.setTimeout(1000 * 180);

        let buffer = Buffer.alloc(0);

        this.conn.addListener('data', (chunk: string|Buffer) => {
            if (typeof chunk === 'string') {
                chunk = Buffer.from(chunk);
            }
            buffer = Buffer.concat([buffer, chunk]);

            const lines = this.convertEncoding(buffer).toString().split(lineDelimiter);

            if (lines.pop()) {
                // if buffer is not ended with \r\n, there's more chunks.
                return;
            }
            // else, initialize the buffer.
            buffer = Buffer.alloc(0);


            lines.forEach((line) => {
                if (!line.length) {
                    return;
                }
                const message = parseMessage(line, this.opt.stripColors);
                try {
                    this.emit('raw', message);
                }
                catch (err) {
                    if (!this.requestedDisconnect) {
                        throw err;
                    }
                }
            });
        });
        this.conn.addListener('end', () => {
            if (this.opt.debug) {
                util.log('Connection got "end" event');
            }
        });
        this.conn.addListener('close', () => {
            if (this.opt.debug) {
                util.log('Connection got "close" event');
            }
            this.reconnect(retryCount);
        });
        this.conn.addListener('timeout', () => {
            if (this.opt.debug) {
                util.log('Connection got "timeout" event');
            }
            this.reconnect(retryCount);
        });
        this.conn.addListener('error', (exception) => {
            if (this.opt.debug) {
                util.log('Network error: ' + exception);
            }
            this.emit('netError', exception);
        });
    }

    private reconnect(retryCount: number) {
        if (this.requestedDisconnect) {return;}
        if (this.opt.debug) {util.log('Disconnected: reconnecting');}
        if (this.opt.retryCount !== null && retryCount >= this.opt.retryCount) {
            if (this.opt.debug) {
                util.log('Maximum retry count (' + this.opt.retryCount + ') reached. Aborting');
            }
            this.emit('abort', this.opt.retryCount);
            return;
        }

        if (this.opt.debug) {
            util.log('Waiting ' + this.opt.retryDelay + 'ms before retrying');
        }
        setTimeout(() => {
            this.connect(retryCount + 1);
        }, this.opt.retryDelay);
    }

    public disconnect(messageOrCallback?: string|(() => void), callback?: () => void) {
        if (!this.conn) {
            throw Error('Cannot send, not connected');
        }
        let message: string|undefined;
        if (typeof (messageOrCallback) === 'function') {
            callback = messageOrCallback;
            message = undefined;
        }
        message = message || 'node-irc says goodbye';
        if (this.readyState() === 'open') {
            this._send('QUIT', message);
        }
        this.requestedDisconnect = true;
        if (typeof (callback) === 'function') {
            this.conn.once('end', callback);
        }
        this.conn.end();
    }

    public async send(...command: string[]) {
        if (!this.conn) {
            throw Error('Cannot send, not connected');
        }
        let delayPromise = Promise.resolve();
        if (this.opt.floodProtection) {
            // Get the amount of time we should wait between messages
            const delay = this.opt.floodProtectionDelay - Math.min(
                this.opt.floodProtectionDelay,
                Date.now() - this.lastSendTime,
            );
            if (delay > MIN_DELAY_MS) {
                delayPromise = new Promise((r) => setTimeout(r, delay));
            }
        }
        const currentSendingPromise = this.sendingPromise;
        const sendPromise = (async () => {
            await delayPromise;
            await currentSendingPromise;
            return this._send(...command);
        })();
        this.sendingPromise = sendPromise.finally();
        return sendPromise;
    }

    private _send(...cmdArgs: string[]) {
        if (!this.conn) {
            throw Error('Cannot send, not connected');
        }
        const args = Array.prototype.slice.call(cmdArgs);

        // Note that the command arg is included in the args array as the first element
        if (args[args.length - 1].match(/\s/) || args[args.length - 1].match(/^:/) || args[args.length - 1] === '') {
            args[args.length - 1] = ':' + args[args.length - 1];
        }

        if (this.opt.debug) {util.log('SEND: ' + args.join(' '));}

        if (this.requestedDisconnect) {
            return;
        }
        this.lastSendTime = Date.now();
        this.conn.write(args.join(' ') + '\r\n');
    }

    public join(channel: string, callback?: (...args: unknown[]) => void) {
        const channelName = channel.split(' ')[0];
        this.once('join' + channelName, (...args) => {
            // if join is successful, add this channel to opts.channels
            // so that it will be re-joined upon reconnect (as channels
            // specified in options are)
            if (this.opt.channels.indexOf(channel) === -1) {
                this.opt.channels.push(channel);
            }

            if (typeof callback === 'function') {
                return callback(...args);
            }
        });
        return this.send('JOIN', ...channel.split(' '));
    }

    public part(channel: string, messageOrCallback: string|(() => void), callback?: () => void) {
        let message: string|undefined;
        if (typeof messageOrCallback === 'function') {
            callback = messageOrCallback;
            message = undefined;
        }
        if (typeof (callback) === 'function') {
            this.once('part' + channel, callback);
        }

        // remove this channel from this.opt.channels so we won't rejoin
        // upon reconnect
        if (this.opt.channels.indexOf(channel) !== -1) {
            this.opt.channels.splice(this.opt.channels.indexOf(channel), 1);
        }

        if (message) {
            return this.send('PART', channel, message);
        }
        return this.send('PART', channel);
    }

    public async action(channel: string, text: string): Promise<void> {
        if (typeof text === 'undefined') {
            return;
        }
        await Promise.all(text.toString().split(/\r?\n/).filter((line) =>
            line.length > 0
        ).map((line) => this.say(channel, '\u0001ACTION ' + line + '\u0001')));
    }

    // E.g. isUserPrefixMorePowerfulThan("@", "&")
    public isUserPrefixMorePowerfulThan(prefix: string, testPrefix: string): boolean {
        const mode = this.modeForPrefix[prefix];
        const testMode = this.modeForPrefix[testPrefix];
        if (this.supportedState.usermodepriority.length === 0 || !mode || !testMode) {
            return false;
        }
        if (this.supportedState.usermodepriority.indexOf(mode) === -1 ||
            this.supportedState.usermodepriority.indexOf(testMode) === -1) {
            return false;
        }
        // usermodepriority is a sorted string (lower index = more powerful)
        return this.supportedState.usermodepriority.indexOf(mode) <
            this.supportedState.usermodepriority.indexOf(testMode);
    }

    private _splitLongLines(words: string, maxLength: number, destination: string[] = []): string[] {
        if (words.length === 0) {
            return destination;
        }
        if (words.length <= maxLength) {
            destination.push(words);
            return destination;
        }
        let c = words[maxLength];
        let cutPos = 0;
        let wsLength = 1;
        if (c.match(/\s/)) {
            cutPos = maxLength;
        }
        else {
            let offset = 1;
            while ((maxLength - offset) > 0) {
                c = words[maxLength - offset];
                if (c.match(/\s/)) {
                    cutPos = maxLength - offset;
                    break;
                }
                offset++;
            }
            if (maxLength - offset <= 0) {
                cutPos = maxLength;
                wsLength = 0;
            }
        }
        const part = words.substring(0, cutPos);
        destination.push(part);
        return this._splitLongLines(words.substring(cutPos + wsLength, words.length), maxLength, destination);
    }

    public say(target: string, text: string) {
        return this._speak('PRIVMSG', target, text);
    }

    public notice(target: string, text: string): Promise<void> {
        return this._speak('NOTICE', target, text);
    }

    private _splitMessage(target: string, text: string): string[] {
        const maxLength = Math.min(this.maxLineLength - target.length, this.opt.messageSplit);
        if (!text) {
            return [];
        }
        return text.toString().split(/\r?\n/).filter((line) => line.length > 0)
            .map((line) => this._splitLongLines(line, maxLength, []))
            .reduce((a, b) => a.concat(b), []);
    }

    private async _speak(kind: string, target: string, text: string): Promise<void> {
        const linesToSend = this._splitMessage(target, text);
        await Promise.all(linesToSend.map((toSend) => {
            const p = this.send(kind, target, toSend);
            p.finally(() => {
                if (kind === 'PRIVMSG') {
                    this.emit('selfMessage', target, toSend);
                }
            });
            return p;
        }));
    }

    // Returns individual IRC messages that would be sent to target
    //  if sending text (via say() or notice()).
    public getSplitMessages(target: string, text: string) {
        return this._splitMessage(target, text);
    }

    public whois(nick: string, callback?: (info: WhoisResponse) => void) {
        if (typeof callback === 'function') {
            const callbackWrapper = (info: WhoisResponse) => {
                if (info.nick.toLowerCase() === nick.toLowerCase()) {
                    this.removeListener('whois', callbackWrapper);
                    return callback(info);
                }
            };
            this.addListener('whois', callbackWrapper);
        }
        return this.send('WHOIS', nick);
    }

    // Send a NAMES command to channel. If callback is a function, add it as
    //  a listener for the names event, which is called when rpl_endofnames is
    //  received in response to original NAMES command. The callback should
    //  accept channelName as the first argument. An object with each key a
    //  user nick and each value '@' if they are a channel operator is passed
    //  as the second argument to the callback.
    public names(channel: string, callback?: (callbackChannel: string, names: {[nick: string]: string}) => void) {
        if (typeof callback === 'function') {
            const callbackWrapper = (callbackChannel: string, names: {[nick: string]: string}) => {
                if (callbackChannel === channel) {
                    return callback(callbackChannel, names);
                }
            }
            this.addListener('names', callbackWrapper);
        }
        return this.send('NAMES', channel);
    }

    // Send a MODE command
    public mode(channel: string, callback?: (callbackChannel: string, ...args: unknown[]) => void) {
        if (typeof callback === 'function') {
            const callbackWrapper = (callbackChannel: string, ...args: unknown[]) => {
                if (callbackChannel === channel) {
                    return callback(callbackChannel, ...args);
                }
            }
            this.addListener('mode_is', callbackWrapper);
        }
        return this.send('MODE', channel);
    }

    // Set user modes. If nick is falsey, your own user modes will be changed.
    // E.g. to set "+RiG" on yourself: setUserMode("+RiG")
    public setUserMode(mode: string, nick: string = this.currentNick): Promise<void> {
        return this.send('MODE', nick, mode);
    }

    public list(...args: string[]): Promise<void> {
        return this.send('LIST', ...args);
    }

    private _addWhoisData(nick: string, key: keyof(WhoisResponse), value: string|string[], onlyIfExists = false) {
        if (onlyIfExists && !this.whoisData.has(nick)) {return;}
        const data: WhoisResponse = {
            ...this.whoisData.get(nick),
            nick,
            [key]: value,
        };
        this.whoisData.set(nick, data);
    }

    private _clearWhoisData(nick: string) {
        const data = this.whoisData.get(nick);
        this.whoisData.delete(nick);
        return data;
    }

    private _handleCTCP(from: string, to: string, text: string, type: string, message: Message) {
        text = text.slice(1);
        text = text.slice(0, text.indexOf('\u0001'));
        const parts = text.split(' ');
        this.emit('ctcp', from, to, text, type, message);
        this.emit('ctcp-' + type, from, to, text, message);
        if (type === 'privmsg' && text === 'VERSION') {
            this.emit('ctcp-version', from, to, message);
        }
        if (parts[0] === 'ACTION' && parts.length > 1) {
            this.emit('action', from, to, parts.slice(1).join(' '), message);
        }
        if (parts[0] === 'PING' && type === 'privmsg' && parts.length > 1) {
            this.ctcp(from, 'notice', text);
        }
    }

    public ctcp(to: string, type: string, text: string) {
        return this[type === 'privmsg' ? 'say' : 'notice'](to, '\x01' + text + '\x01');
    }

    public convertEncoding(buffer: Buffer): string {
        const str = buffer.toString();
        if (this.opt.encoding) {
            try {
                const charset = detectCharset.detect(buffer);
                if (!charset) {
                    throw Error("No charset detected");
                }
                return Iconv.encode(Iconv.decode(buffer, charset), this.opt.encoding).toString();
            }
            catch (err) {
                if (this.opt.debug) {
                    util.log('\u001b[01;31mERROR: ' + err + '\u001b[0m');
                    util.inspect({ str });
                }
            }
        }
        else if (this.opt.encodingFallback) {
            try {
                if (!isValidUTF8(str)) {
                    return Iconv.decode(buffer, this.opt.encodingFallback).toString();
                }
            }
            catch (err) {
                if (this.opt.debug) {
                    util.log('\u001b[01;31mERROR: ' + err + '\u001b[0m');
                    util.inspect({ str, encodingFallback: this.opt.encodingFallback });
                }
            }
        }

        return str;
    }

    // blatantly stolen from irssi's splitlong.pl. Thanks, Bjoern Krombholz!
    private _updateMaxLineLength(): void {
        // 497 = 510 - (":" + "!" + " PRIVMSG " + " :").length;
        // target is determined in _speak() and subtracted there
        this.maxLineLength = 497 - this.nick.length - this.hostMask.length;
    }

    // Checks the arg at the given index for a channel. If one exists, casemap it
    // according to ISUPPORT rules.
    private _casemap(msg: Message, index: number): string|undefined {
        if (!msg.args || !msg.args[index] || msg.args[index][0] !== "#") {
            return;
        }
        msg.args[index] = this.toLowerCase(msg.args[index]);
    }

    public toLowerCase(str: string): string {
        // http://www.irc.org/tech_docs/005.html
        const knownCaseMappings = ['ascii', 'rfc1459', 'strict-rfc1459'];
        if (knownCaseMappings.indexOf(this.supportedState.casemapping) === -1) {
            return str;
        }
        let lower = str.toLowerCase();
        if (this.supportedState.casemapping === 'rfc1459') {
            lower = lower.
                replace(/\[/g, '{').
                replace(/\]/g, '}').
                replace(/\\/g, '|').
                replace(/\^/g, '~');
        }
        else if (this.supportedState.casemapping === 'strict-rfc1459') {
            lower = lower.
                replace(/\[/g, '{').
                replace(/\]/g, '}').
                replace(/\\/g, '|');
        }
        return lower;
    }

    private readyState(): string|undefined {
        // TypeScript doesn't include ready state here.
        return (this.conn as unknown as undefined|{readyState: string})?.readyState
    }
}

// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function randomInt(length: number): number {
    return Math.floor(Math.random() * length);
}

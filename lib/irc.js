/*
    irc.js - Node JS IRC client library

    (C) Copyright Martyn Smith 2010

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

exports.Client = Client;
var net  = require('net');
var tls  = require('tls');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var colors = require('./colors');
var parseMessage = require('./parse_message');
exports.colors = colors;
var CyclingPingTimer = require('./cycling_ping_timer.js');

var lineDelimiter = new RegExp('\r\n|\r|\n')

function Client(server, nick, opt) {
    var self = this;
    self.opt = {
        server: server,
        nick: nick,
        password: null,
        userName: 'nodebot',
        realName: 'nodeJS IRC client',
        port: 6667,
        localAddress: null,
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
        stripColors: false,
        channelPrefixes: '&#',
        messageSplit: 512,
        encoding: false,
        webirc: {
          pass: '',
          ip: '',
          host: ''
        },
        millisecondsOfSilenceBeforePingSent: 15 * 1000,
        millisecondsBeforePingTimeout: 8 * 1000
    };

    // Features supported by the server
    // (initial values are RFC 1459 defaults. Zeros signify
    // no default or unlimited value)
    self.supported = {
        channel: {
            idlength: [],
            length: 200,
            limit: [],
            modes: { a: '', b: '', c: '', d: ''},
            types: self.opt.channelPrefixes
        },
        kicklength: 0,
        maxlist: [],
        maxtargets: [],
        modes: 3,
        nicklength: 9,
        topiclength: 0,
        usermodes: ''
    };

    if (typeof arguments[2] == 'object') {
        var keys = Object.keys(self.opt);
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if (arguments[2][k] !== undefined)
                self.opt[k] = arguments[2][k];
        }
    }

    if (self.opt.floodProtection) {
        self.activateFloodProtection();
    }

    self.hostMask = '';

    // TODO - fail if nick or server missing
    // TODO - fail if username has a space in it
    if (self.opt.autoConnect === true) {
        self.connect();
    }

    self.addListener('raw', function(message) {
        var channels = [],
            channel,
            nick,
            from,
            text,
            to;

        switch (message.command) {
            case 'rpl_welcome':
                // Set nick to whatever the server decided it really is
                // (normally this is because you chose something too long and
                // the server has shortened it
                self.nick = message.args[0];
                // Note our hostmask to use it in splitting long messages.
                // We don't send our hostmask when issuing PRIVMSGs or NOTICEs,
                // of course, but rather the servers on the other side will
                // include it in messages and will truncate what we send if
                // the string is too long. Therefore, we need to be considerate
                // neighbors and truncate our messages accordingly.
                var welcomeStringWords = message.args[1].split(/\s+/);
                self.hostMask = welcomeStringWords[welcomeStringWords.length - 1];
                self._updateMaxLineLength();
                self.emit('registered', message);

                break;
            case 'rpl_myinfo':
                self.supported.usermodes = message.args[3];
                break;
            case 'rpl_isupport':
                message.args.forEach(function(arg) {
                    var match;
                    match = arg.match(/([A-Z]+)=(.*)/);
                    if (match) {
                        var param = match[1];
                        var value = match[2];
                        switch (param) {
                            case 'CHANLIMIT':
                                value.split(',').forEach(function(val) {
                                    val = val.split(':');
                                    self.supported.channel.limit[val[0]] = parseInt(val[1]);
                                });
                                break;
                            case 'CHANMODES':
                                value = value.split(',');
                                var type = ['a', 'b', 'c', 'd'];
                                for (var i = 0; i < type.length; i++) {
                                    self.supported.channel.modes[type[i]] += value[i];
                                }
                                break;
                            case 'CHANTYPES':
                                self.supported.channel.types = value;
                                break;
                            case 'CHANNELLEN':
                                self.supported.channel.length = parseInt(value);
                                break;
                            case 'IDCHAN':
                                value.split(',').forEach(function(val) {
                                    val = val.split(':');
                                    self.supported.channel.idlength[val[0]] = val[1];
                                });
                                break;
                            case 'KICKLEN':
                                self.supported.kicklength = value;
                                break;
                            case 'MAXLIST':
                                value.split(',').forEach(function(val) {
                                    val = val.split(':');
                                    self.supported.maxlist[val[0]] = parseInt(val[1]);
                                });
                                break;
                            case 'NICKLEN':
                                self.supported.nicklength = parseInt(value);
                                break;
                            case 'PREFIX':
                                match = value.match(/\((.*?)\)(.*)/);
                                if (match) {
                                    match[1] = match[1].split('');
                                    match[2] = match[2].split('');
                                    while (match[1].length) {
                                        self.modeForPrefix[match[2][0]] = match[1][0];
                                        self.supported.channel.modes.b += match[1][0];
                                        self.prefixForMode[match[1].shift()] = match[2].shift();
                                    }
                                }
                                break;
                            case 'STATUSMSG':
                                break;
                            case 'TARGMAX':
                                value.split(',').forEach(function(val) {
                                    val = val.split(':');
                                    val[1] = (!val[1]) ? 0 : parseInt(val[1]);
                                    self.supported.maxtargets[val[0]] = val[1];
                                });
                                break;
                            case 'TOPICLEN':
                                self.supported.topiclength = parseInt(value);
                                break;
                        }
                    }
                });
                break;
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
            case '396':
            case '042':
                // Random welcome crap, ignoring
                break;
            case 'err_nicknameinuse':
                if (typeof (self.opt.nickMod) == 'undefined')
                    self.opt.nickMod = 0;
                self.opt.nickMod++;
                self.send('NICK', self.opt.nick + self.opt.nickMod);
                self.nick = self.opt.nick + self.opt.nickMod;
                self._updateMaxLineLength();
                break;
            case 'PING':
                self.send('PONG', message.args[0]);
                self.emit('ping', message.args[0]);
                break;
            case 'PONG':
                self.emit('pong', message.args[0]);
                break;
            case 'NOTICE':
                from = message.nick;
                to = message.args[0];
                if (!to) {
                    to = null;
                }
                text = message.args[1] || '';
                if (text[0] === '\u0001' && text.lastIndexOf('\u0001') > 0) {
                    self._handleCTCP(from, to, text, 'notice', message);
                    break;
                }
                self.emit('notice', from, to, text, message);

                if (self.opt.debug && to == self.nick)
                    util.log('GOT NOTICE from ' + (from ? '"' + from + '"' : 'the server') + ': "' + text + '"');
                break;
            case 'MODE':
                if (self.opt.debug)
                    util.log('MODE: ' + message.args[0] + ' sets mode: ' + message.args[1]);

                channel = self.chanData(message.args[0]);
                if (!channel) break;
                var modeList = message.args[1].split('');
                var adding = true;
                var modeArgs = message.args.slice(2);
                modeList.forEach(function(mode) {
                    if (mode == '+') {
                        adding = true;
                        return;
                    }
                    if (mode == '-') {
                        adding = false;
                        return;
                    }

                    var eventName = (adding ? '+' : '-') + 'mode';
                    var supported = self.supported.channel.modes;
                    var modeArg;
                    var chanModes = function(mode, param) {
                        var arr = param && Array.isArray(param);
                        if (adding) {
                            if (channel.mode.indexOf(mode) == -1) {
                                channel.mode += mode;
                            }
                            if (param === undefined) {
                                channel.modeParams[mode] = [];
                            } else if (arr) {
                                channel.modeParams[mode] = channel.modeParams[mode] ?
                                    channel.modeParams[mode].concat(param) : param;
                            } else {
                                channel.modeParams[mode] = [param];
                            }
                        } else {
                            if (arr) {
                                channel.modeParams[mode] = channel.modeParams[mode]
                                    .filter(function(v) { return v !== param[0]; });
                            }
                            if (!arr || channel.modeParams[mode].length === 0) {
                                channel.mode = channel.mode.replace(mode, '');
                                delete channel.modeParams[mode];
                            }
                        }
                    };
                    if (mode in self.prefixForMode) {
                        modeArg = modeArgs.shift();
                        if (channel.users.hasOwnProperty(modeArg)) {
                            if (adding) {
                                if (channel.users[modeArg].indexOf(self.prefixForMode[mode]) === -1)
                                    channel.users[modeArg] += self.prefixForMode[mode];
                            } else channel.users[modeArg] = channel.users[modeArg].replace(self.prefixForMode[mode], '');
                        }
                        self.emit(eventName, message.args[0], message.nick, mode, modeArg, message);
                    } else if (supported.a.indexOf(mode) !== -1) {
                        modeArg = modeArgs.shift();
                        chanModes(mode, [modeArg]);
                        self.emit(eventName, message.args[0], message.nick, mode, modeArg, message);
                    } else if (supported.b.indexOf(mode) !== -1) {
                        modeArg = modeArgs.shift();
                        chanModes(mode, modeArg);
                        self.emit(eventName, message.args[0], message.nick, mode, modeArg, message);
                    } else if (supported.c.indexOf(mode) !== -1) {
                        if (adding) modeArg = modeArgs.shift();
                        else modeArg = undefined;
                        chanModes(mode, modeArg);
                        self.emit(eventName, message.args[0], message.nick, mode, modeArg, message);
                    } else if (supported.d.indexOf(mode) !== -1) {
                        chanModes(mode);
                        self.emit(eventName, message.args[0], message.nick, mode, undefined, message);
                    }
                });
                break;
            case 'NICK':
                if (message.nick == self.nick) {
                    // the user just changed their own nick
                    self.nick = message.args[0];
                    self._updateMaxLineLength();
                }

                if (self.opt.debug)
                    util.log('NICK: ' + message.nick + ' changes nick to ' + message.args[0]);

                channels = [];

                // TODO better way of finding what channels a user is in?
                Object.keys(self.chans).forEach(function(channame) {
                    var channel = self.chans[channame];
                    channel.users[message.args[0]] = channel.users[message.nick];
                    delete channel.users[message.nick];
                    channels.push(channame);
                });

                // old nick, new nick, channels
                self.emit('nick', message.nick, message.args[0], channels, message);
                break;
            case 'rpl_motdstart':
                self.motd = message.args[1] + '\n';
                break;
            case 'rpl_motd':
                self.motd += message.args[1] + '\n';
                break;
            case 'rpl_endofmotd':
            case 'err_nomotd':
                self.motd += message.args[1] + '\n';
                self.emit('motd', self.motd);
                break;
            case 'rpl_namreply':
                channel = self.chanData(message.args[2]);
                var users = message.args[3].trim().split(/ +/);
                if (channel) {
                    users.forEach(function(user) {
                        var match = user.match(/^(.)(.*)$/);
                        if (match) {
                            if (match[1] in self.modeForPrefix) {
                                channel.users[match[2]] = match[1];
                            }
                            else {
                                channel.users[match[1] + match[2]] = '';
                            }
                        }
                    });
                }
                break;
            case 'rpl_endofnames':
                channel = self.chanData(message.args[1]);
                if (channel) {
                    self.emit('names', message.args[1], channel.users);
                    self.emit('names' + message.args[1], channel.users);
                    self.send('MODE', message.args[1]);
                }
                break;
            case 'rpl_topic':
                channel = self.chanData(message.args[1]);
                if (channel) {
                    channel.topic = message.args[2];
                }
                break;
            case 'rpl_away':
                self._addWhoisData(message.args[1], 'away', message.args[2], true);
                break;
            case 'rpl_whoisuser':
                self._addWhoisData(message.args[1], 'user', message.args[2]);
                self._addWhoisData(message.args[1], 'host', message.args[3]);
                self._addWhoisData(message.args[1], 'realname', message.args[5]);
                break;
            case 'rpl_whoisidle':
                self._addWhoisData(message.args[1], 'idle', message.args[2]);
                break;
            case 'rpl_whoischannels':
               // TODO - clean this up?
                self._addWhoisData(message.args[1], 'channels', message.args[2].trim().split(/\s+/));
                break;
            case 'rpl_whoisserver':
                self._addWhoisData(message.args[1], 'server', message.args[2]);
                self._addWhoisData(message.args[1], 'serverinfo', message.args[3]);
                break;
            case 'rpl_whoisoperator':
                self._addWhoisData(message.args[1], 'operator', message.args[2]);
                break;
            case '330': // rpl_whoisaccount?
                self._addWhoisData(message.args[1], 'account', message.args[2]);
                self._addWhoisData(message.args[1], 'accountinfo', message.args[3]);
                break;
            case 'rpl_endofwhois':
                self.emit('whois', self._clearWhoisData(message.args[1]));
                break;
            case 'rpl_whoreply':
                self._addWhoisData(message.args[5], 'user', message.args[2]);
                self._addWhoisData(message.args[5], 'host', message.args[3]);
                self._addWhoisData(message.args[5], 'server', message.args[4]);
                self._addWhoisData(message.args[5], 'realname', /[0-9]+\s*(.+)/g.exec(message.args[7])[1]);
                // emit right away because rpl_endofwho doesn't contain nick
                self.emit('whois', self._clearWhoisData(message.args[5]));
                break;
            case 'rpl_liststart':
                self.channellist = [];
                self.emit('channellist_start');
                break;
            case 'rpl_list':
                channel = {
                    name: message.args[1],
                    users: message.args[2],
                    topic: message.args[3]
                };
                self.emit('channellist_item', channel);
                self.channellist.push(channel);
                break;
            case 'rpl_listend':
                self.emit('channellist', self.channellist);
                break;
            case 'rpl_topicwhotime':
                channel = self.chanData(message.args[1]);
                if (channel) {
                    channel.topicBy = message.args[2];
                    // channel, topic, nick
                    self.emit('topic', message.args[1], channel.topic, channel.topicBy, message);
                }
                break;
            case 'TOPIC':
                // channel, topic, nick
                self.emit('topic', message.args[0], message.args[1], message.nick, message);

                channel = self.chanData(message.args[0]);
                if (channel) {
                    channel.topic = message.args[1];
                    channel.topicBy = message.nick;
                }
                break;
            case 'rpl_channelmodeis':
                channel = self.chanData(message.args[1]);
                if (channel) {
                    channel.mode = message.args[2];
                }
                break;
            case 'rpl_creationtime':
                channel = self.chanData(message.args[1]);
                if (channel) {
                    channel.created = message.args[2];
                }
                break;
            case 'JOIN':
                // channel, who
                if (self.nick == message.nick) {
                    self.chanData(message.args[0], true);
                }
                else {
                    channel = self.chanData(message.args[0]);
                    if (channel && channel.users) {
                        channel.users[message.nick] = '';
                    }
                }
                self.emit('join', message.args[0], message.nick, message);
                self.emit('join' + message.args[0], message.nick, message);
                if (message.args[0] != message.args[0].toLowerCase()) {
                    self.emit('join' + message.args[0].toLowerCase(), message.nick, message);
                }
                break;
            case 'PART':
                // channel, who, reason
                self.emit('part', message.args[0], message.nick, message.args[1], message);
                self.emit('part' + message.args[0], message.nick, message.args[1], message);
                if (message.args[0] != message.args[0].toLowerCase()) {
                    self.emit('part' + message.args[0].toLowerCase(), message.nick, message.args[1], message);
                }
                if (self.nick == message.nick) {
                    channel = self.chanData(message.args[0]);
                    delete self.chans[channel.key];
                }
                else {
                    channel = self.chanData(message.args[0]);
                    if (channel && channel.users) {
                        delete channel.users[message.nick];
                    }
                }
                break;
            case 'KICK':
                // channel, who, by, reason
                self.emit('kick', message.args[0], message.args[1], message.nick, message.args[2], message);
                self.emit('kick' + message.args[0], message.args[1], message.nick, message.args[2], message);
                if (message.args[0] != message.args[0].toLowerCase()) {
                    self.emit('kick' + message.args[0].toLowerCase(),
                              message.args[1], message.nick, message.args[2], message);
                }

                if (self.nick == message.args[1]) {
                    channel = self.chanData(message.args[0]);
                    delete self.chans[channel.key];
                }
                else {
                    channel = self.chanData(message.args[0]);
                    if (channel && channel.users) {
                        delete channel.users[message.args[1]];
                    }
                }
                break;
            case 'KILL':
                nick = message.args[0];
                channels = [];
                Object.keys(self.chans).forEach(function(channame) {
                    var channel = self.chans[channame];
                    channels.push(channame);
                    delete channel.users[nick];
                });
                self.emit('kill', nick, message.args[1], channels, message);
                break;
            case 'PRIVMSG':
                from = message.nick;
                to = message.args[0];
                text = message.args[1] || '';
                if (text[0] === '\u0001' && text.lastIndexOf('\u0001') > 0) {
                    self._handleCTCP(from, to, text, 'privmsg', message);
                    break;
                }
                self.emit('message', from, to, text, message);
                if (self.supported.channel.types.indexOf(to.charAt(0)) !== -1) {
                    self.emit('message#', from, to, text, message);
                    self.emit('message' + to, from, text, message);
                    if (to != to.toLowerCase()) {
                        self.emit('message' + to.toLowerCase(), from, text, message);
                    }
                }
                if (to.toUpperCase() === self.nick.toUpperCase()) self.emit('pm', from, text, message);

                if (self.opt.debug && to == self.nick)
                    util.log('GOT MESSAGE from ' + from + ': ' + text);
                break;
            case 'INVITE':
                from = message.nick;
                to = message.args[0];
                channel = message.args[1];
                self.emit('invite', channel, from, message);
                break;
            case 'QUIT':
                if (self.opt.debug)
                    util.log('QUIT: ' + message.prefix + ' ' + message.args.join(' '));
                if (self.nick == message.nick) {
                    // TODO handle?
                    break;
                }
                // handle other people quitting

                channels = [];

                // TODO better way of finding what channels a user is in?
                Object.keys(self.chans).forEach(function(channame) {
                    var channel = self.chans[channame];
                    delete channel.users[message.nick];
                    channels.push(channame);
                });

                // who, reason, channels
                self.emit('quit', message.nick, message.args[0], channels, message);
                break;

            // for sasl
            case 'CAP':
                if (message.args[0] === '*' &&
                     message.args[1] === 'ACK' &&
                     message.args[2] === 'sasl ') // there's a space after sasl
                    self.send('AUTHENTICATE', 'PLAIN');
                break;
            case 'AUTHENTICATE':
                if (message.args[0] === '+') self.send('AUTHENTICATE',
                    new Buffer(
                        self.opt.nick + '\0' +
                        self.opt.userName + '\0' +
                        self.opt.password
                    ).toString('base64'));
                break;
            case '903':
                self.send('CAP', 'END');
                break;

            case 'err_umodeunknownflag':
                if (self.opt.showErrors)
                    util.log('\u001b[01;31mERROR: ' + util.inspect(message) + '\u001b[0m');
                break;

            case 'err_erroneusnickname':
                if (self.opt.showErrors)
                    util.log('\u001b[01;31mERROR: ' + util.inspect(message) + '\u001b[0m');
                self.emit('error', message);
                break;

            // Commands relating to OPER
            case 'err_nooperhost':
                if (self.opt.showErrors) {
                    self.emit('error', message);
                    if (self.opt.showErrors)
                        util.log('\u001b[01;31mERROR: ' + util.inspect(message) + '\u001b[0m');
                }
                break;

            case 'rpl_youreoper':
                self.emit('opered');
                break;

            default:
                if (message.commandType == 'error') {
                    self.emit('error', message);
                    if (self.opt.showErrors)
                        util.log('\u001b[01;31mERROR: ' + util.inspect(message) + '\u001b[0m');
                }
                else {
                    if (self.opt.debug)
                        util.log('\u001b[01;31mUnhandled message: ' + util.inspect(message) + '\u001b[0m');
                    break;
                }
        }
    });

    self.addListener('kick', function(channel, who, by, reason) {
        if (self.opt.autoRejoin)
            self.send.apply(self, ['JOIN'].concat(channel.split(' ')));
    });
    self.addListener('motd', function(motd) {
        self.opt.channels.forEach(function(channel) {
            self.send.apply(self, ['JOIN'].concat(channel.split(' ')));
        });
    });

    EventEmitter.call(this);
}
util.inherits(Client, EventEmitter);

Client.prototype.conn = null;
Client.prototype.prefixForMode = {};
Client.prototype.modeForPrefix = {};
Client.prototype.chans = {};
Client.prototype._whoisData = {};

Client.prototype.connectionTimedOut = function(conn) {
    var self = this;
    if (conn !== self.conn) {
        // Only care about a timeout event if it came from the connection
        // that is most current.
        return;
    }
    self.end();
};

(function() {
    var pingCounter = 1;
    Client.prototype.connectionWantsPing = function(conn) {
        var self = this;
        if (conn !== self.conn) {
            // Only care about a wantPing event if it came from the connection
            // that is most current.
            return;
        }
        self.send('PING', (pingCounter++).toString());
    };
}());

Client.prototype.chanData = function(name, create) {
    var key = name.toLowerCase();
    if (create) {
        this.chans[key] = this.chans[key] || {
            key: key,
            serverName: name,
            users: {},
            modeParams: {},
            mode: ''
        };
    }

    return this.chans[key];
};

Client.prototype._connectionHandler = function() {
    if (this.opt.webirc.ip && this.opt.webirc.pass && this.opt.webirc.host) {
        this.send('WEBIRC', this.opt.webirc.pass, this.opt.userName, this.opt.webirc.host, this.opt.webirc.ip);
    }
    if (this.opt.sasl) {
        // see http://ircv3.atheme.org/extensions/sasl-3.1
        this.send('CAP REQ', 'sasl');
    } else if (this.opt.password) {
        this.send('PASS', this.opt.password);
    }
    if (this.opt.debug)
        util.log('Sending irc NICK/USER');
    this.send('NICK', this.opt.nick);
    this.nick = this.opt.nick;
    this._updateMaxLineLength();
    this.send('USER', this.opt.userName, 8, '*', this.opt.realName);

    this.conn.cyclingPingTimer.start();

    this.emit('connect');
};

Client.prototype.connect = function(retryCount, callback) {
    if (typeof (retryCount) === 'function') {
        callback = retryCount;
        retryCount = undefined;
    }
    retryCount = retryCount || 0;
    if (typeof (callback) === 'function') {
        this.once('registered', callback);
    }
    var self = this;
    self.chans = {};

    // socket opts
    var connectionOpts = {
        host: self.opt.server,
        port: self.opt.port
    };

    // local address to bind to
    if (self.opt.localAddress)
        connectionOpts.localAddress = self.opt.localAddress;

    // try to connect to the server
    if (self.opt.secure) {
        connectionOpts.rejectUnauthorized = !self.opt.selfSigned;

        if (typeof self.opt.secure == 'object') {
            // copy "secure" opts to options passed to connect()
            for (var f in self.opt.secure) {
                connectionOpts[f] = self.opt.secure[f];
            }
        }

        self.conn = tls.connect(connectionOpts, function() {
            // callback called only after successful socket connection
            self.conn.connected = true;
            if (self.conn.authorized ||
                (self.opt.selfSigned &&
                    (self.conn.authorizationError   === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
                     self.conn.authorizationError === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
                     self.conn.authorizationError === 'SELF_SIGNED_CERT_IN_CHAIN')) ||
                (self.opt.certExpired &&
                 self.conn.authorizationError === 'CERT_HAS_EXPIRED')) {
                // authorization successful

                if (!self.opt.encoding) {
                    self.conn.setEncoding('utf-8');
                }

                if (self.opt.certExpired &&
                    self.conn.authorizationError === 'CERT_HAS_EXPIRED') {
                    util.log('Connecting to server with expired certificate');
                }

                self._connectionHandler();
            } else {
                // authorization failed
                util.log(self.conn.authorizationError);
            }
        });
    } else {
        self.conn = net.createConnection(connectionOpts, self._connectionHandler.bind(self));
    }
    self.conn.requestedDisconnect = false;
    self.conn.setTimeout(0);

    // Each connection gets its own CyclingPingTimer. The connection forwards the timer's 'timeout' and 'wantPing' events
    // to the client object via calling the connectionTimedOut() and connectionWantsPing() functions.
    //
    // Since the client's "current connection" value changes over time because of retry functionality,
    // the client should ignore timeout/wantPing events that come from old connections.
    self.conn.cyclingPingTimer = new CyclingPingTimer(self);
    (function(conn) {
        conn.cyclingPingTimer.on('pingTimeout', function() {
            self.connectionTimedOut(conn);
        });
        conn.cyclingPingTimer.on('wantPing', function() {
            self.connectionWantsPing(conn);
        });
    }(self.conn));

    if (!self.opt.encoding) {
        self.conn.setEncoding('utf8');
    }

    var buffer = new Buffer('');

    function handleData(chunk) {
        self.conn.cyclingPingTimer.notifyOfActivity();

        if (typeof (chunk) === 'string') {
            buffer += chunk;
        } else {
            buffer = Buffer.concat([buffer, chunk]);
        }

        var lines = self.convertEncoding(buffer).toString().split(lineDelimiter);

        if (lines.pop()) {
            // if buffer is not ended with \r\n, there's more chunks.
            return;
        } else {
            // else, initialize the buffer.
            buffer = new Buffer('');
        }

        lines.forEach(function iterator(line) {
            if (line.length) {
                var message = parseMessage(line, self.opt.stripColors);

                try {
                    self.emit('raw', message);
                } catch (err) {
                    if (!self.conn.requestedDisconnect) {
                        throw err;
                    }
                }
            }
        });
    }

    self.conn.addListener('data', handleData);
    self.conn.addListener('end', function() {
        if (self.opt.debug)
            util.log('Connection got "end" event');
    });
    self.conn.addListener('close', function() {
        if (self.opt.debug)
            util.log('Connection got "close" event');

        if (self.conn && self.conn.requestedDisconnect)
            return;
        if (self.opt.debug)
            util.log('Disconnected: reconnecting');
        if (self.opt.retryCount !== null && retryCount >= self.opt.retryCount) {
            if (self.opt.debug) {
                util.log('Maximum retry count (' + self.opt.retryCount + ') reached. Aborting');
            }
            self.emit('abort', self.opt.retryCount);
            return;
        }

        if (self.opt.debug) {
            util.log('Waiting ' + self.opt.retryDelay + 'ms before retrying');
        }
        setTimeout(function() {
            self.connect(retryCount + 1);
        }, self.opt.retryDelay);
    });
    self.conn.addListener('error', function(exception) {
        self.emit('netError', exception);
        if (self.opt.debug) {
            util.log('Network error: ' + exception);
        }
    });
};

Client.prototype.end = function() {
    if (this.conn) {
        this.conn.cyclingPingTimer.stop();
        this.conn.destroy();
    }
    this.conn = null;
};

Client.prototype.disconnect = function(message, callback) {
    if (typeof (message) === 'function') {
        callback = message;
        message = undefined;
    }
    message = message || 'node-irc says goodbye';
    var self = this;
    if (self.conn.readyState == 'open') {
        var sendFunction;
        if (self.opt.floodProtection) {
            sendFunction = self._sendImmediate;
            self._clearCmdQueue();
        } else {
            sendFunction = self.send;
        }
        sendFunction.call(self, 'QUIT', message);
    }
    self.conn.requestedDisconnect = true;
    if (typeof (callback) === 'function') {
        self.conn.once('end', callback);
    }
    self.conn.end();
};

Client.prototype.send = function(command) {
    var args = Array.prototype.slice.call(arguments);

    // Note that the command arg is included in the args array as the first element

    if (args[args.length - 1].match(/\s/) || args[args.length - 1].match(/^:/) || args[args.length - 1] === '') {
        args[args.length - 1] = ':' + args[args.length - 1];
    }

    if (this.opt.debug)
        util.log('SEND: ' + args.join(' '));

    if (!this.conn.requestedDisconnect) {
        this.conn.write(args.join(' ') + '\r\n');
    }
};

Client.prototype.activateFloodProtection = function(interval) {

    var cmdQueue = [],
        safeInterval = interval || this.opt.floodProtectionDelay,
        self = this,
        origSend = this.send,
        dequeue;

    // Wrapper for the original function. Just put everything to on central
    // queue.
    this.send = function() {
        cmdQueue.push(arguments);
    };

    this._sendImmediate = function() {
        origSend.apply(self, arguments);
    };

    this._clearCmdQueue = function() {
        cmdQueue = [];
    };

    dequeue = function() {
        var args = cmdQueue.shift();
        if (args) {
            origSend.apply(self, args);
        }
    };

    // Slowly unpack the queue without flooding.
    setInterval(dequeue, safeInterval);
    dequeue();
};

Client.prototype.join = function(channel, callback) {
    var channelName =  channel.split(' ')[0];
    this.once('join' + channelName, function() {
        // if join is successful, add this channel to opts.channels
        // so that it will be re-joined upon reconnect (as channels
        // specified in options are)
        if (this.opt.channels.indexOf(channel) == -1) {
            this.opt.channels.push(channel);
        }

        if (typeof (callback) == 'function') {
            return callback.apply(this, arguments);
        }
    });
    this.send.apply(this, ['JOIN'].concat(channel.split(' ')));
};

Client.prototype.part = function(channel, message, callback) {
    if (typeof (message) === 'function') {
        callback = message;
        message = undefined;
    }
    if (typeof (callback) == 'function') {
        this.once('part' + channel, callback);
    }

    // remove this channel from this.opt.channels so we won't rejoin
    // upon reconnect
    if (this.opt.channels.indexOf(channel) != -1) {
        this.opt.channels.splice(this.opt.channels.indexOf(channel), 1);
    }

    if (message) {
        this.send('PART', channel, message);
    } else {
        this.send('PART', channel);
    }
};

Client.prototype.action = function(channel, text) {
    var self = this;
    if (typeof text !== 'undefined') {
        text.toString().split(/\r?\n/).filter(function(line) {
            return line.length > 0;
        }).forEach(function(line) {
            self.say(channel, '\u0001ACTION ' + line + '\u0001');
        });
    }
};

Client.prototype._splitLongLines = function(words, maxLength, destination) {
    maxLength = maxLength || 450; // If maxLength hasn't been initialized yet, prefer an arbitrarily low line length over crashing.
    if (words.length == 0) {
        return destination;
    }
    if (words.length <= maxLength) {
        destination.push(words);
        return destination;
    }
    var c = words[maxLength];
    var cutPos;
    var wsLength = 1;
    if (c.match(/\s/)) {
        cutPos = maxLength;
    } else {
        var offset = 1;
        while ((maxLength - offset) > 0) {
            var c = words[maxLength - offset];
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
    var part = words.substring(0, cutPos);
    destination.push(part);
    return this._splitLongLines(words.substring(cutPos + wsLength, words.length), maxLength, destination);
};

Client.prototype.say = function(target, text) {
    this._speak('PRIVMSG', target, text);
};

Client.prototype.notice = function(target, text) {
    this._speak('NOTICE', target, text);
};

Client.prototype._speak = function(kind, target, text) {
    var self = this;
    var maxLength = this.maxLineLength - target.length;
    if (typeof text !== 'undefined') {
        text.toString().split(/\r?\n/).filter(function(line) {
            return line.length > 0;
        }).forEach(function(line) {
            var linesToSend = self._splitLongLines(line, maxLength, []);
            linesToSend.forEach(function(toSend) {
                self.send(kind, target, toSend);
                if (kind == 'PRIVMSG') {
                    self.emit('selfMessage', target, toSend);
                }
            });
        });
    }
};

Client.prototype.whois = function(nick, callback) {
    if (typeof callback === 'function') {
        var callbackWrapper = function(info) {
            if (info.nick.toLowerCase() == nick.toLowerCase()) {
                this.removeListener('whois', callbackWrapper);
                return callback.apply(this, arguments);
            }
        };
        this.addListener('whois', callbackWrapper);
    }
    this.send('WHOIS', nick);
};

Client.prototype.list = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift('LIST');
    this.send.apply(this, args);
};

Client.prototype._addWhoisData = function(nick, key, value, onlyIfExists) {
    if (onlyIfExists && !this._whoisData[nick]) return;
    this._whoisData[nick] = this._whoisData[nick] || {nick: nick};
    this._whoisData[nick][key] = value;
};

Client.prototype._clearWhoisData = function(nick) {
    // Ensure that at least the nick exists before trying to return
    this._addWhoisData(nick, 'nick', nick);
    var data = this._whoisData[nick];
    delete this._whoisData[nick];
    return data;
};

Client.prototype._handleCTCP = function(from, to, text, type, message) {
    text = text.slice(1);
    text = text.slice(0, text.indexOf('\u0001'));
    var parts = text.split(' ');
    this.emit('ctcp', from, to, text, type, message);
    this.emit('ctcp-' + type, from, to, text, message);
    if (type === 'privmsg' && text === 'VERSION')
        this.emit('ctcp-version', from, to, message);
    if (parts[0] === 'ACTION' && parts.length > 1)
        this.emit('action', from, to, parts.slice(1).join(' '), message);
    if (parts[0] === 'PING' && type === 'privmsg' && parts.length > 1)
        this.ctcp(from, 'notice', text);
};

Client.prototype.ctcp = function(to, type, text) {
    return this[type === 'privmsg' ? 'say' : 'notice'](to, '\u0001' + text + '\u0001');
};

Client.prototype.convertEncoding = function(str) {
    var self = this, out = str;

    if (self.opt.encoding) {
        try {
            var charsetDetector = require('node-icu-charset-detector');
            var Iconv = require('iconv').Iconv;
            var charset = charsetDetector.detectCharset(str);
            var converter = new Iconv(charset.toString(), self.opt.encoding);

            out = converter.convert(str);
        } catch (err) {
            if (self.opt.debug) {
                util.log('\u001b[01;31mERROR: ' + err + '\u001b[0m');
                util.inspect({ str: str, charset: charset });
            }
        }
    }

    return out;
};
// blatantly stolen from irssi's splitlong.pl. Thanks, Bjoern Krombholz!
Client.prototype._updateMaxLineLength = function() {
    // 497 = 510 - (":" + "!" + " PRIVMSG " + " :").length;
    // target is determined in _speak() and subtracted there
    this.maxLineLength = 497 - this.nick.length - this.hostMask.length;
};

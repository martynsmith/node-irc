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
exports.colors = colors;
var parseMessage = require('./parse_message');
var parseCmd = require('./parse_cmds');


var lineDelimiter = new RegExp('\r\n|\r|\n');

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
          user: ''
        }
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

Client.prototype.chanData = function(name, create) {
    var key = name.toLowerCase();
    if (create) {
        this.chans[key] = this.chans[key] || {
            key: key,
            serverName: name,
            users: {},
            mode: ''
        };
    }

    return this.chans[key];
};

Client.prototype._parseCmd = function(message) {
    var self = this;
    var fn = parseCmd[message.command];
    if (fn != undefined) {
        if (typeof(fn) == 'function') fn(self, message);
    } else {
        parseCmd.default(self, message);
    }
}

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
        var creds = self.opt.secure;
        creds.rejectUnauthorized = !self.opt.selfSigned;

        if (typeof self.opt.secure == 'object') {
            // copy "secure" opts to options passed to connect()
            for (var f in self.opt.secure) {
                if (creds.hasOwnProperty(f))
                    connectionOpts[f] = creds[f];
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
                if (self.opt.webirc.ip && self.opt.webirc.pass && self.opt.webirc.host) {
                    self.send('WEBIRC', self.opt.webirc.pass, self.opt.userName, self.opt.webirc.host, self.opt.webirc.ip);
                }
                if (self.opt.password) {
                    self.send('PASS', self.opt.password);
                }
                if (self.opt.debug)
                    util.log('Sending irc NICK/USER');
                self.send('NICK', self.opt.nick);
                self.nick = self.opt.nick;
                self.send('USER', self.opt.userName, 8, '*', self.opt.realName);
                self.emit('connect');
            } else {
                // authorization failed
                util.log(self.conn.authorizationError);
            }
        });
    } else {
        self.conn = net.createConnection(connectionOpts);
    }
    self.conn.requestedDisconnect = false;
    self.conn.setTimeout(0);

    if (!self.opt.encoding) {
        self.conn.setEncoding('utf8');
    }

    self.conn.addListener('connect', function() {
        if (self.opt.sasl) {
            // see http://ircv3.atheme.org/extensions/sasl-3.1
            self.send('CAP REQ', 'sasl');
        }
        if (self.opt.webirc.ip && self.opt.webirc.pass && self.opt.webirc.host) {
            self.send('WEBIRC', self.opt.webirc.pass, self.opt.userName, self.opt.webirc.host, self.opt.webirc.ip);
        } else if (self.opt.password) {
            self.send('PASS', self.opt.password);
        }
        self.send('NICK', self.opt.nick);
        self.nick = self.opt.nick;
        self.send('USER', self.opt.userName, 8, '*', self.opt.realName);
        self.emit('connect');
    });

    var buffer = new Buffer('');

    self.conn.addListener('data', function(chunk) {
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
            var message = parseMessage(line, self.opt.stripColors);

            try {
                self._parseCmd(message);
            } catch (err) {
                if (!self.conn.requestedDisconnect) {
                    throw err;
                }
            }
        });
    });
    self.conn.addListener('end', function() {
        if (self.opt.debug)
            util.log('Connection got "end" event');
    });
    self.conn.addListener('close', function() {
        if (self.opt.debug)
            util.log('Connection got "close" event');
        if (self.conn.requestedDisconnect)
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
    });
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
    if (words.length < maxLength) {
        destination.push(words);
        return destination;
    }
    var c = words[maxLength - 1];
    var cutPos;
    if (c.match(/\s/)) {
        cutPos = maxLength - 1;
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
        }
    }
    var part = words.substring(0, cutPos);
    destination.push(part);
    return this._splitLongLines(words.substring(cutPos + 1, words.length), maxLength, destination);
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
            if (info.nick == nick) {
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
    return this[type === 'privmsg' ? 'say' : 'notice'](to, '\1' + text + '\1');
};

Client.prototype.convertEncoding = function(str) {
    var self = this;

    if (self.opt.encoding) {
        var charsetDetector = require('node-icu-charset-detector');
        var Iconv = require('iconv').Iconv;
        var charset = charsetDetector.detectCharset(str).toString();
        var to = new Iconv(charset, self.opt.encoding);

        return to.convert(str);
    } else {
        return str;
    }
};
// blatantly stolen from irssi's splitlong.pl. Thanks, Bjoern Krombholz!
Client.prototype._updateMaxLineLength = function() {
    // 497 = 510 - (":" + "!" + " PRIVMSG " + " :").length;
    // target is determined in _speak() and subtracted there
    this.maxLineLength = 497 - this.nick.length - this.hostMask.length;
};

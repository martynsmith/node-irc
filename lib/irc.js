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

var colors = require('./colors');
exports.colors = colors;

var replyFor = require('./codes');

function Client(server, nick, opt) {
    var self = this;
    self.opt = {
        server: server,
        nick: nick,
        password: null,
        userName: 'nodebot',
        realName: 'nodeJS IRC client',
        port: 6667,
        debug: false,
        showErrors: false,
        autoRejoin: true,
        autoConnect: true,
        channels: [],
        retryCount: null,
        retryDelay: 2000,
        secure: false,
        selfSigned: false,
        floodProtection: false,
        stripColors: false
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

    // TODO - fail if nick or server missing
    // TODO - fail if username has a space in it
    if (self.opt.autoConnect === true) {
      self.connect();
    }

    self.addListener("raw", function (message) { // {{{
        switch ( message.command ) {
            case "001":
                // Set nick to whatever the server decided it really is
                // (normally this is because you chose something too long and
                // the server has shortened it
                self.nick = message.args[0];
                self.emit('registered');
                break;
            case "002":
            case "003":
            case "004":
                break;
            case "005":
                message.args.forEach(function(arg) {
                    var match;
                    if ( match = arg.match(/PREFIX=\((.*?)\)(.*)/) ) {
                        match[1] = match[1].split('');
                        match[2] = match[2].split('');
                        while ( match[1].length ) {
                            self.modeForPrefix[match[2][0]] = match[1][0];
                            self.prefixForMode[match[1].shift()] = match[2].shift();
                        }
                    }
                });
                break;
            case "rpl_luserclient":
            case "rpl_luserop":
            case "rpl_luserchannels":
            case "rpl_luserme":
            case "rpl_localusers":
            case "rpl_globalusers":
            case "rpl_statsconn":
                // Random welcome crap, ignoring
                break;
            case "err_nicknameinuse":
                if ( typeof(self.opt.nickMod) == 'undefined' )
                    self.opt.nickMod = 0;
                self.opt.nickMod++;
                self.send("NICK", self.opt.nick + self.opt.nickMod);
                self.nick = self.opt.nick + self.opt.nickMod;
                break;
            case "PING":
                self.send("PONG", message.args[0]);
                break;
            case "NOTICE":
                var from = message.nick;
                var to   = message.args[0];
                if (!to) {
                    to   = null;
                }
                var text = message.args[1];
                self.emit('notice', from, to, text);

                if ( self.opt.debug && to == self.nick )
                    util.log('GOT NOTICE from ' + (from?'"'+from+'"':'the server') + ': "' + text + '"');
                break;
            case "MODE":
                if ( self.opt.debug )
                    util.log("MODE:" + message.args[0] + " sets mode: " + message.args[1]);

                var channel = self.chanData(message.args[0]);
                if ( !channel ) break;
                var modeList = message.args[1].split('');
                var adding = true;
                var modeArgs = message.args.splice(2);
                modeList.forEach(function(mode) {
                    if ( mode == '+' ) { adding = true; return; }
                    if ( mode == '-' ) { adding = false; return; }
                    if ( mode in self.prefixForMode ) {
                        // user modes
                        var user = modeArgs.shift();
                        if ( adding ) {
                            if ( channel.users[user].indexOf(self.prefixForMode[mode]) === -1 )
                                channel.users[user] += self.prefixForMode[mode];
                        }
                        else {
                            channel.users[user] = channel.users[user].replace(self.prefixForMode[mode], '');
                        }
                    }
                    else {
                        var modeArg;
                        // channel modes
                        if ( mode.match(/^[bkl]$/) )
                            modeArg = modeArgs.shift();
                        // TODO - deal nicely with channel modes that take args
                        if ( adding ) {
                            if ( channel.mode.indexOf(mode) === -1 )
                                channel.mode += mode;
                        }
                        else {
                            channel.mode = channel.mode.replace(mode, '');
                        }
                    }
                });
                break;
            case "NICK":
                if ( self.opt.debug )
                    util.log("NICK: " + message.nick + " changes nick to " + message.args[0]);

                var channels = [];

                // TODO better way of finding what channels a user is in?
                for ( var channame in self.chans ) {
                    var channel = self.chans[channame];
                    if ( 'string' == typeof channel.users[message.nick] ) {
                        channel.users[message.args[0]] = channel.users[message.nick];
                        delete channel.users[message.nick];
                        channels.push(channame);
                    }
                }

                // old nick, new nick, channels
                self.emit('nick', message.nick, message.args[0], channels);
                break;
            case "rpl_motdstart":
                self.motd = message.args[1] + "\n";
                break;
            case "rpl_motd":
                self.motd += message.args[1] + "\n";
                break;
            case "rpl_endofmotd":
            case "err_nomotd":
                self.motd += message.args[1] + "\n";
                self.emit('motd', self.motd);
                break;
            case "rpl_namreply":
                var channel = self.chanData(message.args[2]);
                var users = message.args[3].split(/ +/);
                if ( channel ) {
                    users.forEach(function (user) {
                        var match = user.match(/^(.)(.*)$/);
                        if ( match[1] in self.modeForPrefix ) {
                            channel.users[match[2]] = match[1];
                        }
                        else {
                            channel.users[match[1] + match[2]] = '';
                        }
                    });
                }
                break;
            case "rpl_endofnames":
                var channel = self.chanData(message.args[1]);
                if ( channel ) {
                    self.emit('names', message.args[1], channel.users);
                    self.send('MODE', message.args[1]);
                }
                break;
            case "rpl_topic":
                var channel = self.chanData(message.args[1]);
                if ( channel ) {
                    channel.topic = message.args[2];
                }
                break;
            case "rpl_away":
                self._addWhoisData(message.args[1], 'away', message.args[2], true);
                break;
            case "rpl_whoisuser":
                self._addWhoisData(message.args[1], 'user', message.args[2]);
                self._addWhoisData(message.args[1], 'host', message.args[3]);
                self._addWhoisData(message.args[1], 'realname', message.args[5]);
                break;
            case "rpl_whoisidle":
                self._addWhoisData(message.args[1], 'idle', message.args[2]);
                break;
            case "rpl_whoischannels":
                self._addWhoisData(message.args[1], 'channels', message.args[2].trim().split(/\s+/)); // TODO - clean this up?
                break;
            case "rpl_whoisserver":
                self._addWhoisData(message.args[1], 'server', message.args[2]);
                self._addWhoisData(message.args[1], 'serverinfo', message.args[3]);
                break;
            case "rpl_whoisoperator":
                self._addWhoisData(message.args[1], 'operator', message.args[2]);
                break;
            case "330": // rpl_whoisaccount?
                self._addWhoisData(message.args[1], 'account', message.args[2]);
                self._addWhoisData(message.args[1], 'accountinfo', message.args[3]);
                break;
            case "rpl_endofwhois":
                self.emit('whois', self._clearWhoisData(message.args[1]));
                break;
            case "rpl_liststart":
                self.channellist = [];
                self.emit('channellist_start');
                break;
            case "rpl_list":
                var channel = {
                    name: message.args[1],
                    users: message.args[2],
                    topic: message.args[3],
                };
                self.emit('channellist_item', channel);
                self.channellist.push(channel);
                break;
            case "rpl_listend":
                self.emit('channellist', self.channellist);
                break;
            case "333":
                // TODO emit?
                var channel = self.chanData(message.args[1]);
                if ( channel ) {
                    channel.topicBy = message.args[2];
                    // channel, topic, nick
                    self.emit('topic', message.args[1], channel.topic, channel.topicBy);
                }
                break;
            case "TOPIC":
                // channel, topic, nick
                self.emit('topic', message.args[0], message.args[1], message.nick);

                var channel = self.chanData(message.args[0]);
                if ( channel ) {
                    channel.topic = message.args[1];
                    channel.topicBy = message.nick;
                }
                break;
            case "rpl_channelmodeis":
                var channel = self.chanData(message.args[1]);
                if ( channel ) {
                    channel.mode = message.args[2];
                }
                break;
            case "329":
                var channel = self.chanData(message.args[1]);
                if ( channel ) {
                    channel.created = message.args[2];
                }
                break;
            case "JOIN":
                // channel, who
                if ( self.nick == message.nick ) {
                    self.chanData(message.args[0], true);
                }
                else {
                    var channel = self.chanData(message.args[0]);
                    channel.users[message.nick] = '';
                }
                self.emit('join', message.args[0], message.nick);
                self.emit('join' + message.args[0], message.nick);
                if ( message.args[0] != message.args[0].toLowerCase() ) {
                    self.emit('join' + message.args[0].toLowerCase(), message.nick);
                }
                break;
            case "PART":
                // channel, who, reason
                self.emit('part', message.args[0], message.nick, message.args[1]);
                self.emit('part' + message.args[0], message.nick, message.args[1]);
                if ( message.args[0] != message.args[0].toLowerCase() ) {
                    self.emit('part' + message.args[0].toLowerCase(), message.nick, message.args[1]);
                }
                if ( self.nick == message.nick ) {
                    var channel = self.chanData(message.args[0]);
                    delete self.chans[channel.key];
                }
                else {
                    var channel = self.chanData(message.args[0]);
                    delete channel.users[message.nick];
                }
                break;
            case "KICK":
                // channel, who, by, reason
                self.emit('kick', message.args[0], message.args[1], message.nick, message.args[2]);
                self.emit('kick' + message.args[0], message.args[1], message.nick, message.args[2]);
                if ( message.args[0] != message.args[0].toLowerCase() ) {
                    self.emit('kick' + message.args[0].toLowerCase(), message.args[1], message.nick, message.args[2]);
                }

                if ( self.nick == message.args[1] ) {
                    var channel = self.chanData(message.args[0]);
                    delete self.chans[channel.key];
                }
                else {
                    var channel = self.chanData(message.args[0]);
                    delete channel.users[message.args[1]];
                }
                break;
            case "KILL":
                var nick = message.args[0];
                for ( var channel in self.chans ) {
                    delete self.chans[channel].users[nick];
                }
                break;
            case "PRIVMSG":
                var from = message.nick;
                var to   = message.args[0];
                var text = message.args[1];
                self.emit('message', from, to, text);
                if ( to.match(/^[&#]/) ) {
                    self.emit('message' + to, from, text);
                    if ( to != to.toLowerCase() ) {
                        self.emit('message' + to.toLowerCase(), from, text);
                    }
                }
                if ( to == self.nick ) self.emit('pm', from, text);

                if ( self.opt.debug && to == self.nick )
                    util.log('GOT MESSAGE from ' + from + ': ' + text);
                break;
            case "INVITE":
                var from = message.nick;
                var to   = message.args[0];
                var channel = message.args[1];
                self.emit('invite', channel, from);
                break;
            case "QUIT":
                if ( self.opt.debug )
                    util.log("QUIT: " + message.prefix + " " + message.args.join(" "));
                if ( self.nick == message.nick ) {
                    // TODO handle?
                    break;
                }
                // handle other people quitting

                var channels = [];

                // TODO better way of finding what channels a user is in?
                for ( var channame in self.chans ) {
                    var channel = self.chans[channame];
                    if ( 'string' == typeof channel.users[message.nick] ) {
                        delete channel.users[message.nick];
                        channels.push(channame);
                    }
                }

                // who, reason, channels
                self.emit('quit', message.nick, message.args[0], channels);
                break;
            default:
                if ( message.commandType == 'error' ) {
                    self.emit('error', message);
                    if ( self.opt.showErrors )
                        util.log("\033[01;31mERROR: " + util.inspect(message) + "\033[0m");
                }
                else {
                    if ( self.opt.debug )
                        util.log("\033[01;31mUnhandled message: " + util.inspect(message) + "\033[0m");
                }
                break;
        }
    }); // }}}

    self.addListener('kick', function(channel, who, by, reason) {
        if ( self.opt.autoRejoin )
            self.send('JOIN', channel);
    });
    self.addListener('motd', function (motd) {
        self.opt.channels.forEach(function(channel) {
            self.send('JOIN', channel);
        });
    });

    process.EventEmitter.call(this);
}

util.inherits(Client, process.EventEmitter);

Client.prototype.conn = null;
Client.prototype.prefixForMode = {};
Client.prototype.modeForPrefix = {};
Client.prototype.chans = {};
Client.prototype._whoisData = {};
Client.prototype.chanData = function( name, create ) { // {{{
    var key = name.toLowerCase();
    if ( create ) {
        this.chans[key] = this.chans[key] || {
            key: key,
            serverName: name,
            users: {}
        };
    }

    return this.chans[key];
} // }}}
Client.prototype.connect = function ( retryCount, callback ) { // {{{
    if ( typeof(retryCount) === 'function' ) {
        callback = retryCount;
        retryCount = undefined;
    }
    retryCount = retryCount || 0;
    if (typeof(callback) === 'function') {
      this.once('registered', callback);
    }
    var self = this;
    self.chans = {};
    // try to connect to the server
    if (self.opt.secure) {
        var creds = self.opt.secure;
        if (typeof self.opt.secure !== 'object') {
            creds = {};
        }

        self.conn = tls.connect(self.opt.port, self.opt.server, creds, function() {
           // callback called only after successful socket connection
           self.conn.connected = true;
           if (self.conn.authorized ||
               (self.opt.selfSigned &&
                self.conn.authorizationError === 'DEPTH_ZERO_SELF_SIGNED_CERT')) {
              // authorization successful
              self.conn.setEncoding('utf-8');

                if ( self.opt.password !==  null ) {
                    self.send( "PASS", self.opt.password );
                }
                util.log('Sending irc NICK/USER');
                self.send("NICK", self.opt.nick);
                self.nick = self.opt.nick;
                self.send("USER", self.opt.userName, 8, "*", self.opt.realName);
                self.emit("connect");
           } else {
              // authorization failed
             util.log(self.conn.authorizationError);
           }
        });
    }else {
        self.conn = net.createConnection(self.opt.port, self.opt.server);
    }
    self.conn.requestedDisconnect = false;
    self.conn.setTimeout(0);
    self.conn.setEncoding('utf8');
    self.conn.addListener("connect", function () {
        if ( self.opt.password !==  null ) {
            self.send( "PASS", self.opt.password );
        }
        self.send("NICK", self.opt.nick);
        self.nick = self.opt.nick;
        self.send("USER", self.opt.userName, 8, "*", self.opt.realName);
        self.emit("connect");
    });
    var buffer = '';
    self.conn.addListener("data", function (chunk) {
        buffer += chunk;
        var lines = buffer.split("\r\n");
        buffer = lines.pop();
        lines.forEach(function (line) {
            var message = parseMessage(line, self.opt.stripColors);
            try {
                self.emit('raw', message);
            } catch ( err ) {
                if ( !self.conn.requestedDisconnect ) {
                    throw err;
                }
            }
        });
    });
    self.conn.addListener("end", function() {
        if ( self.opt.debug )
            util.log('Connection got "end" event');
    });
    self.conn.addListener("close", function() {
        if ( self.opt.debug )
            util.log('Connection got "close" event');
        if ( self.conn.requestedDisconnect )
            return;
        if ( self.opt.debug )
            util.log('Disconnected: reconnecting');
        if ( self.opt.retryCount !== null && retryCount >= self.opt.retryCount ) {
            if ( self.opt.debug ) {
                util.log( 'Maximum retry count (' + self.opt.retryCount + ') reached. Aborting' );
            }
            self.emit( 'abort', self.opt.retryCount );
            return;
        }

        if ( self.opt.debug ) {
            util.log( 'Waiting ' + self.opt.retryDelay + 'ms before retrying' );
        }
        setTimeout( function() {
            self.connect( retryCount + 1 );
        }, self.opt.retryDelay );
    });
}; // }}}
Client.prototype.disconnect = function ( message, callback ) { // {{{
    if ( typeof(message) === 'function' ) {
        callback = message;
        message = undefined;
    }
    message = message || "node-irc says goodbye";
    var self = this;
    if ( self.conn.readyState == 'open' ) {
        self.send( "QUIT", message );
    }
    self.conn.requestedDisconnect = true;
    if (typeof(callback) === 'function') {
      self.conn.once('end', callback);
    }
    self.conn.end();
}; // }}}
Client.prototype.send = function(command) { // {{{
    var args = [];
    for ( var k in arguments )
        args.push(arguments[k]);
    args[args.length-1] = ":" + args[args.length-1];

    // Remove the command
    args.shift();

    if ( this.opt.debug )
        util.log('SEND: ' + command + " " + args.join(" "));

    if ( ! this.conn.requestedDisconnect ) {
        this.conn.write(command + " " + args.join(" ") + "\r\n");
    }
}; // }}}
Client.prototype.activateFloodProtection = function() { // {{{

    var cmdQueue = [],
        safeInterval = 1000,
        self = this,
        origSend = this.send,
        dequeue;

    // Wrapper for the original function. Just put everything to on central
    // queue.
    this.send = function() {
        cmdQueue.push(arguments);
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


}; // }}}
Client.prototype.join = function(channel, callback) { // {{{
    this.once('join' + channel, function () {
        // if join is successful, add this channel to opts.channels
        // so that it will be re-joined upon reconnect (as channels
        // specified in options are)
        if (this.opt.channels.indexOf(channel) == -1) {
            this.opt.channels.push(channel);
        }

        if ( typeof(callback) == 'function' ) {
            return callback.apply(this, arguments);
        }
    });
    this.send('JOIN', channel);
} // }}}
Client.prototype.part = function(channel, callback) { // {{{
    if ( typeof(callback) == 'function' ) {
        this.once('part' + channel, callback);
    }

    // remove this channel from this.opt.channels so we won't rejoin
    // upon reconnect
    if (this.opt.channels.indexOf(channel) != -1) {
        this.opt.channels.splice(this.opt.channels.indexOf(channel), 1);
    }

    this.send('PART', channel);
} // }}}
Client.prototype.say = function(target, text) { // {{{
    var self = this;
    if (typeof text !== 'undefined') {
        text.toString().split(/\r?\n/).filter(function(line) {
            return line.length > 0;
        }).forEach(function(line) {
            self.send('PRIVMSG', target, line);
            self.emit('selfMessage', target, line);
        });
    }
} // }}}
Client.prototype.action = function(channel, text) { // {{{
    var self = this;
    if (typeof text !== 'undefined') {
        text.toString().split(/\r?\n/).filter(function(line) {
            return line.length > 0;
        }).forEach(function(line) {
            self.say(channel, '\u0001ACTION ' + line + '\u0001');
        });
    }
} // }}}
Client.prototype.notice = function(target, text) { // {{{
    this.send('NOTICE', target, text);
} // }}}
Client.prototype.whois = function(nick, callback) { // {{{
    if ( typeof callback === 'function' ) {
        var callbackWrapper = function(info) {
            if ( info.nick == nick ) {
                this.removeListener('whois', callbackWrapper);
                return callback.apply(this, arguments);
            }
        };
        this.addListener('whois', callbackWrapper);
    }
    this.send('WHOIS', nick);
} // }}}
Client.prototype.list = function() { // {{{
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift('LIST');
    this.send.apply(this, args);
} // }}}
Client.prototype._addWhoisData = function(nick, key, value, onlyIfExists) { // {{{
    if ( onlyIfExists && !this._whoisData[nick] ) return;
    this._whoisData[nick] = this._whoisData[nick] || {nick: nick};
    this._whoisData[nick][key] = value;
} // }}}
Client.prototype._clearWhoisData = function(nick) { // {{{
    var data = this._whoisData[nick];
    delete this._whoisData[nick];
    return data;
} // }}}

/*
 * parseMessage(line, stripColors)
 *
 * takes a raw "line" from the IRC server and turns it into an object with
 * useful keys
 */
function parseMessage(rawLine, stripColors) { // {{{
    var message = {};
    var match;

    var line;
    if (stripColors) {
        line = rawLine.replace(/[\x02\x1f\x16\x0f]|\x03\d{0,2}(?:,\d{0,2})?/g, "");
    } else {
        line = rawLine;
    }

    // Parse prefix
    if ( match = line.match(/^:([^ ]+) +/) ) {
        message.prefix = match[1];
        line = line.replace(/^:[^ ]+ +/, '');
        if ( match = message.prefix.match(/^([_a-zA-Z0-9\[\]\\`^{}|-]*)(!([^@]+)@(.*))?$/) ) {
            message.nick = match[1];
            message.user = match[3];
            message.host = match[4];
        }
        else {
            message.server = message.prefix;
        }
    }

    // Parse command
    match = line.match(/^([^ ]+) +/);
    message.command = match[1];
    message.rawCommand = match[1];
    message.commandType = 'normal';
    line = line.replace(/^[^ ]+ +/, '');

    if ( replyFor[message.rawCommand] ) {
        message.command     = replyFor[message.rawCommand].name;
        message.commandType = replyFor[message.rawCommand].type;
    }

    message.args = [];
    var middle, trailing;

    // Parse parameters
    if ( line.indexOf(':') != -1 ) {
        var index = line.indexOf(':');
        middle = line.substr(0, index).replace(/ +$/, "");
        trailing = line.substr(index+1);
    }
    else {
        middle = line;
    }

    if ( middle.length )
        message.args = middle.split(/ +/);

    if ( typeof(trailing) != 'undefined' && trailing.length )
        message.args.push(trailing);

    return message;
} // }}}

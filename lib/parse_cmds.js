// need to set all these locally in function scope
var channels = [],
    channel,
    nick,
    from,
    text,
    to;

var util = require('util');

module.exports = {
    // Set nick to whatever the server decided it really is
    // (normally this is because you chose something too long and
    // the server has shortened it
    // Note our hostmask to use it in splitting long messages.
    // We don't send our hostmask when issuing PRIVMSGs or NOTICEs,
    // of course, but rather the servers on the other side will
    // include it in messages and will truncate what we send if
    // the string is too long. Therefore, we need to be considerate
    // neighbors and truncate our messages accordingly.
    'rpl_welcome': function(self, message) {
        self.nick = message.args[0];
        self.hostMask = message.args[message.args.length - 1];
        self._updateMaxLineLength();
        self.emit('registered', message);
    },

    'rpl_myinfo': function(self, message) {
        self.supported.usermodes = message.args[3];
    },

    'rpl_isupport': function(self, message) {
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
    },

    'rpl_yourhost': '',

    'rpl_created': '',

    'rpl_luserclient': '',

    'rpl_luserop': '',

    'rpl_luserchannels': '',

    'rpl_luserme': '',

    'rpl_localusers': '',

    'rpl_globalusers': '',

    // Random welcome crap, ignoring
    'rpl_statsconn': '',   

    'err_nicknameinuse': function(self, message) {
        if (typeof (self.opt.nickMod) == 'undefined')
            self.opt.nickMod = 0;
        self.opt.nickMod++;
        self.send('NICK', self.opt.nick + self.opt.nickMod);
        self.nick = self.opt.nick + self.opt.nickMod;
        self._updateMaxLineLength();
    },

    'PING': function(self, message) {
        self.send('PONG', message.args[0]);
        self.emit('ping', message.args[0]);
    },

    'PONG': function(self, message) {
        self.emit('pong', message.args[0]);
    },

    'NOTICE': function(self, message) {
        from = message.nick;
        to = message.args[0];
        if (!to) {
            to = null;
        }
        text = message.args[1] || '';
        if (text[0] === '\u0001' && text.lastIndexOf('\u0001') > 0) {
            self._handleCTCP(from, to, text, 'notice', message);
            return;
        }
        self.emit('notice', from, to, text, message);

        if (self.opt.debug && to == self.nick)
            util.log('GOT NOTICE from ' + (from ? '"' + from + '"' : 'the server') + ': "' + text + '"');
    },

    'MODE': function(self, message) {
        if (self.opt.debug)
            util.log('MODE: ' + message.args[0] + ' sets mode: ' + message.args[1]);

        channel = self.chanData(message.args[0]);
        if (!channel) return;
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
            if (mode in self.prefixForMode) {
                // channel user modes
                var user = modeArgs.shift();
                if (adding) {
                    if (channel.users[user].indexOf(self.prefixForMode[mode]) === -1)
                        channel.users[user] += self.prefixForMode[mode];

                    self.emit('+mode', message.args[0], message.nick, mode, user, message);
                }
                else {
                    channel.users[user] = channel.users[user].replace(self.prefixForMode[mode], '');
                    self.emit('-mode', message.args[0], message.nick, mode, user, message);
                }
            }
            else {
                var modeArg;
                // channel modes
                if (mode.match(/^[bkl]$/)) {
                    modeArg = modeArgs.shift();
                    if (modeArg.length === 0)
                        modeArg = undefined;
                }
                // TODO - deal nicely with channel modes that take args
                if (adding) {
                    if (channel.mode.indexOf(mode) === -1)
                        channel.mode += mode;

                    self.emit('+mode', message.args[0], message.nick, mode, modeArg, message);
                }
                else {
                    channel.mode = channel.mode.replace(mode, '');
                    self.emit('-mode', message.args[0], message.nick, mode, modeArg, message);
                }
            }
        });
    },

    'NICK': function(self, message) {
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
    },

    'rpl_motdstart':  function(self, message) {
        self.motd = message.args[1] + '\n';
    },

    'rpl_motd': function(self, message) {
        self.motd += message.args[1] + '\n';
    },

    'rpl_endofmotd': '',

    'err_nomotd': function(self, message) {
        self.motd += message.args[1] + '\n';
        self.emit('motd', self.motd);
    },

    'rpl_namreply': function(self, message) {
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
    },

    'rpl_endofnames': function(self, message) {
        channel = self.chanData(message.args[1]);
        if (channel) {
            self.emit('names', message.args[1], channel.users);
            self.emit('names' + message.args[1], channel.users);
            self.send('MODE', message.args[1]);
        }
    },

    'rpl_topic': function(self, message) {
        channel = self.chanData(message.args[1]);
        if (channel) {
            channel.topic = message.args[2];
        }
    },

    'rpl_away': function(self, message) {
        self._addWhoisData(message.args[1], 'away', message.args[2], true);
    },

    'rpl_whoisuser': function(self, message) {
        self._addWhoisData(message.args[1], 'user', message.args[2]);
        self._addWhoisData(message.args[1], 'host', message.args[3]);
        self._addWhoisData(message.args[1], 'realname', message.args[5]);
    },

    'rpl_whoisidle': function(self, message) {
        self._addWhoisData(message.args[1], 'idle', message.args[2]);
    },

    'rpl_whoischannels': function(self, message) {
       // TODO - clean this up?
        self._addWhoisData(message.args[1], 'channels', message.args[2].trim().split(/\s+/));
    },

    'rpl_whoisserver': function(self, message) {
        self._addWhoisData(message.args[1], 'server', message.args[2]);
        self._addWhoisData(message.args[1], 'serverinfo', message.args[3]);
    },

    'rpl_whoisoperator': function(self, message) {
        self._addWhoisData(message.args[1], 'operator', message.args[2]);
    },

    '330': function(self, message) { // rpl_whoisaccount?
        self._addWhoisData(message.args[1], 'account', message.args[2]);
        self._addWhoisData(message.args[1], 'accountinfo', message.args[3]);
    },

    'rpl_endofwhois': function(self, message) {
        self.emit('whois', self._clearWhoisData(message.args[1]));
    },

    'rpl_liststart': function(self, message) {
        self.channellist = [];
        self.emit('channellist_start');
    },

    'rpl_list': function(self, message) {
        channel = {
            name: message.args[1],
            users: message.args[2],
            topic: message.args[3]
        };
        self.emit('channellist_item', channel);
        self.channellist.push(channel);
    },

    'rpl_listend': function(self, message) {
        self.emit('channellist', self.channellist);
    },

    'rpl_topicwhotime': function(self, message) {
        channel = self.chanData(message.args[1]);
        if (channel) {
            channel.topicBy = message.args[2];
            // channel, topic, nick
            self.emit('topic', message.args[1], channel.topic, channel.topicBy, message);
        }
    },

    'TOPIC': function(self, message) {
        // channel, topic, nick
        self.emit('topic', message.args[0], message.args[1], message.nick, message);

        channel = self.chanData(message.args[0]);
        if (channel) {
            channel.topic = message.args[1];
            channel.topicBy = message.nick;
        }
    },

    'rpl_channelmodeis': function(self, message) {
        channel = self.chanData(message.args[1]);
        if (channel) {
            channel.mode = message.args[2];
        }
    },

    'rpl_creationtime': function(self, message) {
        channel = self.chanData(message.args[1]);
        if (channel) {
            channel.created = message.args[2];
        }
    },

    'JOIN': function(self, message) {
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
    },

    'PART': function(self, message) {
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
    },

    'KICK': function(self, message) {
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
    },

    'KILL': function(self, message) {
        nick = message.args[0];
        channels = [];
        Object.keys(self.chans).forEach(function(channame) {
            var channel = self.chans[channame];
            channels.push(channame);
            delete channel.users[nick];
        });
        self.emit('kill', nick, message.args[1], channels, message);
    },

    'PRIVMSG': function(self, message) {
        from = message.nick;
        to = message.args[0];
        text = message.args[1] || '';
        if (text[0] === '\u0001' && text.lastIndexOf('\u0001') > 0) {
            self._handleCTCP(from, to, text, 'privmsg', message);
            return;
        }
        self.emit('message', from, to, text, message);
        if (self.supported.channel.types.indexOf(to.charAt(0)) !== -1) {
            self.emit('message#', from, to, text, message);
            self.emit('message' + to, from, text, message);
            if (to != to.toLowerCase()) {
                self.emit('message' + to.toLowerCase(), from, text, message);
            }
        }
        if (to == self.nick) self.emit('pm', from, text, message);

        if (self.opt.debug && to == self.nick)
            util.log('GOT MESSAGE from ' + from + ': ' + text);
    },

    'INVITE': function(self, message) {
        from = message.nick;
        to = message.args[0];
        channel = message.args[1];
        self.emit('invite', channel, from, message);
    },

    'QUIT': function(self, message) {
        if (self.opt.debug)
            util.log('QUIT: ' + message.prefix + ' ' + message.args.join(' '));
        if (self.nick == message.nick) {
            // TODO handle?
            return;
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
    },


    // for sasl
    'CAP': function(self, message) {
        if (message.args[0] === '*' &&
             message.args[1] === 'ACK' &&
             message.args[2] === 'sasl ') // there's a space after sasl
            self.send('AUTHENTICATE', 'PLAIN');
    },

    'AUTHENTICATE': function(self, message) {
        if (message.args[0] === '+') self.send('AUTHENTICATE',
            new Buffer(
                self.opt.nick + '\0' +
                self.opt.userName + '\0' +
                self.opt.password
            ).toString('base64'));
    },

    '903': function(self, message) {
        self.send('CAP', 'END');
    },

    'err_umodeunknownflag': function(self, message) {
        if (self.opt.showErrors)
            util.log('\u001b[01;31mERROR: ' + util.inspect(message) + '\u001b[0m');
    },

    'err_erroneusnickname': function(self, message) {
        if (self.opt.showErrors)
            util.log('\033[01;31mERROR: ' + util.inspect(message) + '\033[0m');
        self.emit('error', message);
    },

    default: function(self, message) {
        if (message.commandType == 'error') {
            self.emit('error', message);
            if (self.opt.showErrors) {
                util.log('\u001b[01;31mERROR: ' + util.inspect(message) + '\u001b[0m');
            }
        } else {
            if (self.opt.debug) {
                util.log('\u001b[01;31mUnhandled message: ' + util.inspect(message) + '\u001b[0m');
            }
        }
    }
}
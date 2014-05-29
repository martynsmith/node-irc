#!/usr/bin/env node

var irc  = require('./lib/irc.js');
var util = require('util');
var color = require('ansi-color').set;

var c = new irc.Client(
    'irc.dollyfish.net.nz',
    'nodebot',
    {
        channels: ['#test'],
        //debug: true
    }
);

c.addListener('raw', function(message) { console.log('raw: ', message) });
c.addListener('error', function(message) { console.log(color('error: ', 'red'), message) });

var repl = require('repl').start('> ');
repl.context.repl = repl;
repl.context.util = util;
repl.context.irc = irc;
repl.context.c = c;

repl.inputStream.addListener('close', function() {
    console.log("\nClosing session");
    c.disconnect('Closing session');
});


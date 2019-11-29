'use strict';

var util = require('util');
var EventEmitter = require('events').EventEmitter;

/**
 * This class encapsulates the ping timeout functionality. When enough
 * silence (lack of server-sent activity) time passes, an object of this type
 * will emit a 'wantPing' event, indicating you should send a PING message
 * to the server in order to get some signs of life from it. If enough
 * time passes after that (i.e. server does not respond to PING), then
 * an object of this type will emit a 'pingTimeout' event.
 *
 * To start the gears turning, call start() on an instance of this class To
 * put it in the 'started' state.
 *
 * When server-side activity occurs, call notifyOfActivity() on the object.
 *
 * When a pingTimeout occurs, the object will go into the 'stopped' state.
 */
var ctr = 0;

function CyclingPingTimer(client) {
    var timerNumber = ctr++;
    var started = false;
    var self = this;

    // Only one of these two should be non-null at any given time.
    var loopingTimeout = null;
    var pingWaitTimeout = null;

    // conditionally log debug messages
    function debug(msg) {
        if (client.opt.debug) {
            console.error('CyclingPingTimer ' + timerNumber + ': ' + msg);
        }
    }

    // set up EventEmitter functionality
    EventEmitter.call(self);

    self.on('wantPing', function() {
        debug('server silent for too long, let\'s send a PING');
        pingWaitTimeout = setTimeout(function() {
            self.stop();
            debug('ping timeout!');
            self.emit('pingTimeout');
        }, client.opt.millisecondsBeforePingTimeout);
    });

    self.notifyOfActivity = function() {
        if (started) {
            self.stop();
            self.start();
        }
    };

    self.stop = function() {
        if (!started) {
            return;
        }
        started = false;

        clearTimeout(loopingTimeout);
        clearTimeout(pingWaitTimeout);

        loopingTimeout = null;
        pingWaitTimeout = null;
    };

    self.start = function() {
        if (started) {
            debug('can\'t start, not stopped!');
            return;
        }
        started = true;

        loopingTimeout = setTimeout(function() {
            loopingTimeout = null;
            self.emit('wantPing');
        }, client.opt.millisecondsOfSilenceBeforePingSent);
    };
}

util.inherits(CyclingPingTimer, EventEmitter);

module.exports = CyclingPingTimer;

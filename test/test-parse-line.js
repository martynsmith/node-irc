var parseMessage  = require('../lib/parse_message');
var test = require('tape');

var testHelpers = require('./helpers');

test('irc.parseMessage', function(t) {
    var checks = testHelpers.getFixtures('parse-line');

    Object.keys(checks).forEach(function(line) {
        t.equal(
            JSON.stringify(checks[line]),
            JSON.stringify(parseMessage(line)),
            line + ' parses correctly'
        );
    });
    t.end();
});

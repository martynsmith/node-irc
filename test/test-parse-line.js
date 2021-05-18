const { parseMessage } = require('../lib/parse_message');
const test = require('tape');

const testHelpers = require('./helpers');

test('irc.parseMessage', function(t) {
    const checks = testHelpers.getFixtures('parse-line');

    Object.keys(checks).forEach(function(line) {
        let stripColors = false;
        if (checks[line].hasOwnProperty('stripColors')) {
            stripColors = checks[line].stripColors;
            delete checks[line].stripColors;
        }
        t.deepEqual(
            checks[line],
            parseMessage(line, stripColors),
            line + ' parses correctly'
        );
    });
    t.end();
});

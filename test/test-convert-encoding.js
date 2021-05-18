const irc = require('../lib/irc');
const test = require('tape');
const testHelpers = require('./helpers');
const { Iconv } = require('iconv-lite');
const chardet = require('chardet');
const checks = testHelpers.getFixtures('convert-encoding');

const bindTo = { opt: { encoding: 'utf-8' } };
test('irc.Client.convertEncoding old', (assert) => {
    const convertEncoding = ((str) => {
        if (self.opt.encoding) {
            const charset = chardet.detect(str);
            const to = new Iconv(charset, this.opt.encoding);

            return to.convert(str);
        } else {
            return str;
        }
    }).bind(bindTo);

    checks.causesException.forEach((line) => {
        let causedException = false;
        try {
            convertEncoding(line);
        } catch (e) {
            causedException = true;
        }

        assert.equal(causedException, true, line + ' caused exception');
    });

    assert.end();
});

test('irc.Client.convertEncoding', function(assert) {
    const convertEncoding = irc.Client.prototype.convertEncoding.bind(bindTo);

    checks.causesException.forEach((line) => {
        let causedException = false;

        try {
            convertEncoding(line);
        } catch (e) {
            causedException = true;
        }

        assert.equal(causedException, false, line + ' didn\'t cause exception');
    });

    assert.end();
});

var encode = require('../lib/encode');
var test = require('tape');
var testHelpers = require('./helpers');
var checks = testHelpers.getFixtures('convert-encoding');

var encoded = {
    'UTF-8': {
      'abçdéfg': '\x61\x62\xc3\xa7\x64\xc3\xa9\x66\x67',
      'àíàçã': '\xc3\xa0\xc3\xad\xc3\xa0\xc3\xa7\xc3\xa3'
    },
    Big5: {
      '次常用國字標準字體表': new Buffer([0xa6, 0xb8, 0xb1, 0x60, 0xa5, 0xce, 0xb0,
      0xea, 0xa6, 0x72, 0xbc, 0xd0, 0xb7, 0xc7, 0xa6, 0x72, 0xc5, 0xe9, 0xaa, 0xed])
    },
    MacCyrillic: {
      'широко применяется': new Buffer([0xF8, 0xE8, 0xF0, 0xEE, 0xEA, 0xEE, 0x20,
       0xEF, 0xF0, 0xE8, 0xEC, 0xE5, 0xED, 0xDF, 0xE5, 0xF2, 0xF1, 0xDF])
    },
    'ISO-2022-JP': {
      'ウィキペディアはオープンコンテントの百科事典です。':
      new Buffer([0x1b, 0x24, 0x42, 0x25, 0x26, 0x25, 0x23, 0x25, 0x2d, 0x25,
      0x5a, 0x25, 0x47, 0x25, 0x23, 0x25, 0x22, 0x24, 0x4f, 0x25, 0x2a, 0x21,
      0x3c, 0x25, 0x57, 0x25, 0x73, 0x25, 0x33, 0x25, 0x73, 0x25, 0x46, 0x25,
      0x73, 0x25, 0x48, 0x24, 0x4e, 0x49, 0x34, 0x32, 0x4a, 0x3b, 0x76, 0x45,
      0x35, 0x24, 0x47, 0x24, 0x39, 0x21, 0x23, 0x1b, 0x28, 0x42])
    }
};

test('irc.encode.detect', function(assert) {
    for (charSet in encoded) {
        for (key in encoded[charSet]) {
            var str = encoded[charSet][key];
            console.log(key, str, encode.detect(str));
            assert.equal(encode.detect(str), charSet);
        }
    }
    assert.end();
});

test('irc.encode.convert (two way)', function(assert) {
    for (charSet in encoded) {
        if (charSet != 'UTF-8') for (key in encoded[charSet]) {
            var str1 = encoded[charSet][key];
            var str2 = encode.convert(str1, charSet, 'UTF-8');
            var str3 = encode.convert(key, 'UTF-8', charSet);
            assert.equal(str2, key, 'convert ' + charSet + ' to utf8');
            assert.equal(str3, str1.toString(), 'convert back ' + charSet);
        }
    }
    assert.end();
});

test('irc.encode.convert (to unfittable charset)', function(assert) {
    for (key in encoded.Big5) {
        var str1 = encoded.Big5[key];
        var str2 = encode.convert(str1, 'Big5', 'ISO-8859-15');
        assert.equal(str2, '', 'Big5 "' + key + '" do not fit ISO-8859-15.');
    }
    assert.end();
});

test('irc.encode.convertTo', function(assert) {
    for (charSet in encoded) {
        for (key in encoded[charSet]) {
            var out = encode.convertTo(encoded[charSet][key], 'ISO-8859-15');
            assert.ok(out.length > 0, typeof(out) + ' must be a valid string');
        }
    }
    assert.end();
});

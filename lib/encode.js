var util = require('util');

function Encode(debug) {
    this.debug = debug;
}

var proto = Encode.prototype;

exports.detect = proto.detect = function detect(str) {
    var detector = require('jschardet');
    return detector.detect(str).encoding;
};

// Lib iconv does not translit like iconv bin, or there are version changes.
// uniformString tries to solve the empty string case, following the 2.19 bin model.
exports.uniformString = function uniformString(origStrOrBuffer, resultBuffer, toCharset) {
    var origStr = origStrOrBuffer.toString();
    var resultStr = resultBuffer.toString();
    var translit = false;
    if (toCharset.indexOf('TRANSLIT') > -1) translit = true;
    if (translit && /^\s*$/.test(resultStr)) {
        resultStr = '';
        for (var i = 0; i < origStr.length; i++)
            if (origStr.charAt(i) == ' ') resultStr += ' ';
            else resultStr += '?';
    }
    return resultStr;
}

exports.convert = proto.convert = function convert(str, fromCharset, toCharset) {
    var out = '';
    try {
        var Iconv = require('iconv').Iconv;
        var converter = new Iconv(fromCharset, toCharset);
        out = converter.convert(str);
    } catch (err1) {
        if (this.debug) util.error('\u001b[01;31mIconv lib ERROR: ' + err1 + '\u001b[0m.' +
                                   ' Trying iconv binary...');
        try {
            out = require('child_process').spawnSync(
              'iconv', ['-f', fromCharset, '-t', toCharset],
              { input: str }
            ).stdout;
        } catch (err2) {
            if (this.debug) util.error('\u001b[01;31mIconv bin ERROR: ' + err2 + '\u001b[0m');
        }
    }
    return module.exports.uniformString(str, out, toCharset);
};

// Handily detect the current charset and failsafe convert with '//TRANSLIT//IGNORE'
exports.convertTo = proto.convertTo = function convertTo(str, toCharset) {
    var fromCharset = this.detect(str);
    return this.convert(str, fromCharset, toCharset + '//TRANSLIT//IGNORE');
};

exports.build = function(debug) {
    return new Encode(debug);
};

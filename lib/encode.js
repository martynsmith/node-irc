util = require('util');

module.exports.detect = function(str) {
    // `jschardet` is a better project, however `node-icu-charset-detector`
    // users the advanced libicu. As C extensions may fail by lowlevel API
    // and env issues, we must not use libicu alone.
    var detector;
    try {
        detector = require('node-icu-charset-detector');
        return detector.detectCharset(str).toString();
    } catch (err) {
        detector = require("jschardet");
        return detector.detect(str).encoding;
    }
};

module.exports.convert = function(str, fromCharset, toCharset) {
    try {
        var Iconv = require('iconv').Iconv;
        var converter = new Iconv(fromCharset, toCharset);
        return converter.convert(str);
    } catch (err1) {
        try {
            return require('child_process').spawnSync(
              'iconv', ['-f', fromCharset, '-t', toCharset],
              { input: str }
            ).stdout.toString();
        } catch (err2) {
            return ''
        }
    }
};

// Handily detect the current charset and failsafe convert with '//TRANSLIT//IGNORE'
module.exports.convertTo = function(str, toCharset) {
    var fromCharset = this.detect(str);
    return this.convert(str, fromCharset, toCharset + '//TRANSLIT//IGNORE');
};

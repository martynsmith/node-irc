module.exports.detect = function(str) {
    var detector = require('jschardet');
    return detector.detect(str).encoding;
};

module.exports.convert = function(str, fromCharset, toCharset) {
    try {
        var Iconv = require('iconv').Iconv;
        var converter = new Iconv(fromCharset, toCharset);
        return converter.convert(str).toString() || '';
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

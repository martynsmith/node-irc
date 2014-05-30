var Readable = require("readable-stream/readable");
var util = require("util");

var Channel = function Channel(name, password, stream) {
    this.name = name;
    this.password = password;
    this.stream = stream;

    Readable.call(this);
};

util.inherits(Channel, Readable);

Channel.prototype._read = function _read() {
    // read channel data
};

module.exports = Channel;

var codes = {
    white: '\u000300',
    black: '\u000301',
    dark_blue: '\u000302',
    dark_green: '\u000303',
    light_red: '\u000304',
    dark_red: '\u000305',
    magenta: '\u000306',
    orange: '\u000307',
    yellow: '\u000308',
    light_green: '\u000309',
    cyan: '\u000310',
    light_cyan: '\u000311',
    light_blue: '\u000312',
    light_magenta: '\u000313',
    gray: '\u000314',
    light_gray: '\u000315',
    
    bold: '\u000216',
    underline: '\u001f17',
    
    reset: '\u000f',
};
exports.codes = codes;

function wrap(color, text, reset_color) {
    if(codes[color]) {
        text = codes[color] + text;
        text += (codes[reset_color]) ? codes[reset_color] : codes['reset'];
    }
    return text;
};
exports.wrap = wrap;


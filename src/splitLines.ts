function getUtf8LenAt(text: string, cutPosCurr: number) {
    const char = text.charCodeAt(cutPosCurr);
    if (char <= 0x7f) { // Single width
        return 1;
    }
    if (char <= 0x7ff) { // Double width
        return 2;
    }
    return 3;
}


export default function splitLongLines(text: string, maxLengthInBytes = 450): string[] {
    // If maxLength hasn't been initialized yet, prefer an arbitrarily low
    // line length over crashing.
    if (maxLengthInBytes < 4) {
        // That tight restriction makes no sense in IRC.
        return [text];
    }

    const result = [];

    let cutPosStart = 0, bytesStart = 0;
    let cutPosWord = 0, bytesWord = 0;
    let cutPosCurr = 0, bytesCurr = 0;
    let wasSpace = true;

    while (cutPosCurr < text.length) {
        let utf8len, utf16len, isWhitespace;
        if ((text.charCodeAt(cutPosCurr) & 0xF800) === 0xD800) {
            // Surrogate pair.
            utf8len = 4;
            utf16len = 2;
            isWhitespace = false;
        }
        else {
            utf8len = getUtf8LenAt(text, cutPosCurr);
            utf16len = 1;
            isWhitespace = /\s/.test(text[cutPosCurr]);
        }

        if (!wasSpace && isWhitespace) {
            cutPosWord = cutPosCurr;
            bytesWord = bytesCurr;
        }

        if (bytesCurr + utf8len - bytesStart > maxLengthInBytes) {
            if (cutPosWord !== cutPosStart) {
                cutPosCurr = cutPosWord;
                bytesCurr = bytesWord;
            }

            result.push(text.substring(cutPosStart, cutPosCurr));

            // Skip leading spaces.
            while (cutPosCurr < text.length && text[cutPosCurr].match(/\s/)) {
                // According to [1], `/\s/` does not match code points beyond
                // 0xffff. Consequently, we can assume that any whitespace
                // character consists of single UTF-16 code unit, not a
                // surrogate pair.
                // [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
                cutPosCurr += 1;
                bytesCurr += getUtf8LenAt(text, cutPosCurr);
            }

            cutPosWord = cutPosStart = cutPosCurr;
            bytesWord = bytesStart = bytesCurr;
            wasSpace = true;
        }
        else {
            cutPosCurr += utf16len;
            bytesCurr += utf8len;
            wasSpace = isWhitespace;
        }
    }


    if (cutPosStart !== cutPosCurr) {
        let startPos = cutPosStart;
        if (result.length !== 0) {
            while (startPos < text.length && /\s/.test(text[startPos])) {
                startPos++;
            }
        }
        if (startPos !== text.length || result.length === 0) {
            result.push(text.substring(startPos));
        }
    }
    return result;
}

[![License](https://img.shields.io/badge/license-GPLv3-blue.svg?style=flat)](http://opensource.org/licenses/GPL-3.0)

This is a fork of [node-irc](http://node-irc.readthedocs.org/), which is an IRC client library written in [JavaScript](http://en.wikipedia.org/wiki/JavaScript) for [Node](http://nodejs.org/). This fork is used by the [Matrix-IRC application service](http://github.com/matrix-org/matrix-appservice-irc).

To use this fork:
```
  npm install matrix-org/node-irc
```

Alternatively:
```javascript
"dependencies": {
  "irc": "matrix-org/node-irc#commithash"
}
```

You can access more detailed documentation for this module at [Read the Docs](http://readthedocs.org/docs/node-irc/en/latest/)

# Differences from `node-irc`
The `node-irc` library isn't well maintained and there are a number of issues which are impacting development of the [Matrix-IRC application service](http://github.com/matrix-org/matrix-appservice-irc). We made the decision to fork the project in order to improve reliability of the application service. A summary of modifications from `node-irc@0.3.12` are below:
 - https://github.com/matrix-org/node-irc/pull/1 - Manifested as [BOTS-80](https://matrix.org/jira/browse/BOTS-80)
 - https://github.com/matrix-org/node-irc/pull/4 - Manifested as [BOTS-73] (https://matrix.org/jira/browse/BOTS-73)
 - Addition of `onNickConflict()` option which is called on `err_nicknameinuse`. This function should return the next nick to try. Defaults to suffixing monotonically increasing integers.

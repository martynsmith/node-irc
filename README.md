[![License](https://img.shields.io/badge/license-GPLv3-blue.svg?style=flat)](http://opensource.org/licenses/GPL-3.0)

This is a fork of [node-irc](http://node-irc.readthedocs.org/), which is an IRC client library written in TypeScript for [Node](http://nodejs.org/). This fork is used by the [Matrix-IRC application service](http://github.com/matrix-org/matrix-appservice-irc).

To use this package:
```
  npm install matrix-org-irc
```

# Differences from `node-irc`
The `node-irc` library isn't well maintained and there are a number of issues which are impacting development of the [Matrix-IRC application service](http://github.com/matrix-org/matrix-appservice-irc). We made the decision to fork the project in order to improve reliability of the application service. A summary of modifications from `node-irc@0.3.12` are below:
 - TypeScript support
 - https://github.com/matrix-org/node-irc/pull/1 - Manifested as [BOTS-80](https://matrix.org/jira/browse/BOTS-80)
 - https://github.com/matrix-org/node-irc/pull/4 - Manifested as [BOTS-73] (https://matrix.org/jira/browse/BOTS-73)
 - Handle +R - https://github.com/matrix-org/node-irc/commit/7c16b994b12145b6da8961790bcfa808fb7fcba9
 - Handle more error codes (430,435,438)
 - Fix bug which would fail to connect conflicting nicks which `== NICKLEN`.
 - Fix `err_unavailresource` on connection with reserved nicks.
 - Workaround for the Scunthorpe problem: https://github.com/matrix-org/matrix-appservice-irc/issues/103
 - Add methods for working out if a given text will be split and into how many lines.
 - Add `names` support (incl. multi-prefix).
 - Add functions to determine if a user prefix is more powerful than another (e.g. `@ > &`)
 - Case-map all incoming channels correctly (e.g on PRIVMSG and NOTICE)
 - Allow IP family to be chosen to allow IPv6 connections.
 - Add function for getting channel modes.
 - Workaround terrible RFC3484 rules which means that IPv6 DNS rotations would not be honoured.
 - Add `setUserMode` to set a user's mode.
 - Addition of `encodingFallback` option which allows setting encoding to use for non-UTF-8 encoded messages.
 - Addition of `onNickConflict()` option which is called on `err_nicknameinuse`. This function should return the next nick to try. The function defaults to suffixing monotonically increasing integers. Usage:
   ```javascript
   new Client("server.com", "MyNick", {
      onNickConflict: function() {
        return "_MyNick_";
      }
   });
   ```

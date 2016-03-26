# Change Log

## [v0.5.0](https://github.com/martynsmith/node-irc/tree/v0.5.0) (2016-03-26)
[Full Changelog](https://github.com/martynsmith/node-irc/compare/v0.4.1...v0.5.0)

**Implemented enhancements:**

- Allow tilde in nicks [\#438](https://github.com/martynsmith/node-irc/pull/438) ([hexjelly](https://github.com/hexjelly))

**Fixed bugs:**

- Fixes \#427 [\#429](https://github.com/martynsmith/node-irc/pull/429) ([ghost](https://github.com/ghost))

**Closed issues:**

- How to get current server. [\#453](https://github.com/martynsmith/node-irc/issues/453)
- Library never connects to server  [\#451](https://github.com/martynsmith/node-irc/issues/451)
- Ping timeout causes double reconnect [\#449](https://github.com/martynsmith/node-irc/issues/449)
- Changelog for v4.0? [\#435](https://github.com/martynsmith/node-irc/issues/435)
- How to multiple server connections at the same time [\#434](https://github.com/martynsmith/node-irc/issues/434)
- Add connected flag [\#430](https://github.com/martynsmith/node-irc/issues/430)
- Add link to docs on github wiki page [\#422](https://github.com/martynsmith/node-irc/issues/422)
- maxLineLength is not set by default and can crash the bot [\#419](https://github.com/martynsmith/node-irc/issues/419)
- PING/PONG Error! [\#415](https://github.com/martynsmith/node-irc/issues/415)
- quit event provides wrong channel information [\#398](https://github.com/martynsmith/node-irc/issues/398)
- Detect client timeout ? [\#375](https://github.com/martynsmith/node-irc/issues/375)
- User MODE changes are not being received in +MODE/-MODE handlers [\#374](https://github.com/martynsmith/node-irc/issues/374)
- Error client.say\(nick, "record\\w3xp\\random\\wins"\); [\#369](https://github.com/martynsmith/node-irc/issues/369)
- SASL over SSL never happens [\#250](https://github.com/martynsmith/node-irc/issues/250)
- Message Events Ignored [\#242](https://github.com/martynsmith/node-irc/issues/242)
- Bot crashes on mode +q-o [\#221](https://github.com/martynsmith/node-irc/issues/221)
- Cannot pass MODE command with multiple arguments [\#147](https://github.com/martynsmith/node-irc/issues/147)
- Certain MODE messages could access on undefined [\#144](https://github.com/martynsmith/node-irc/issues/144)
- mode emit event [\#136](https://github.com/martynsmith/node-irc/issues/136)
- QUIT, KILL removes users from user list before processing event hooks [\#73](https://github.com/martynsmith/node-irc/issues/73)

**Merged pull requests:**

- fix\(ping timeouts\): When a ping timeout is detected properly destroy … [\#452](https://github.com/martynsmith/node-irc/pull/452) ([jirwin](https://github.com/jirwin))
- Added link to install instructions for ICU [\#450](https://github.com/martynsmith/node-irc/pull/450) ([spalger](https://github.com/spalger))
- User status isn't updated on MODE if he's not VOICE or OP [\#448](https://github.com/martynsmith/node-irc/pull/448) ([Zoddo](https://github.com/Zoddo))
- Add a Gitter chat badge to README.md [\#444](https://github.com/martynsmith/node-irc/pull/444) ([gitter-badger](https://github.com/gitter-badger))
- Detect and recover from ping timeouts [\#418](https://github.com/martynsmith/node-irc/pull/418) ([philip-peterson](https://github.com/philip-peterson))
- Adding support for command rpl\_whoreply \(352\) [\#413](https://github.com/martynsmith/node-irc/pull/413) ([lan17](https://github.com/lan17))
- Update .gitignore [\#373](https://github.com/martynsmith/node-irc/pull/373) ([Phalanxia](https://github.com/Phalanxia))
- Update license attribute [\#372](https://github.com/martynsmith/node-irc/pull/372) ([pdehaan](https://github.com/pdehaan))

## [v0.4.1](https://github.com/martynsmith/node-irc/tree/v0.4.1) (2016-01-27)
[Full Changelog](https://github.com/martynsmith/node-irc/compare/v0.4.0...v0.4.1)

**Implemented enhancements:**

- Dealing with OPER command replies. [\#439](https://github.com/martynsmith/node-irc/pull/439) ([ellisgl](https://github.com/ellisgl))

**Fixed bugs:**

- Fix SASL auth [\#443](https://github.com/martynsmith/node-irc/pull/443) ([ggreer](https://github.com/ggreer))

**Closed issues:**

- Can't use it sadly [\#433](https://github.com/martynsmith/node-irc/issues/433)
- how do I auto reconnect if the server goes down? [\#431](https://github.com/martynsmith/node-irc/issues/431)
- WebIRC Support [\#427](https://github.com/martynsmith/node-irc/issues/427)
- Error Handling Improvements \(all errors should gracefully fail\)   [\#421](https://github.com/martynsmith/node-irc/issues/421)
- client.send\(\) always include : in first text [\#420](https://github.com/martynsmith/node-irc/issues/420)
- node-irc with express/socket.io [\#417](https://github.com/martynsmith/node-irc/issues/417)
- Not enough parameters' [\#416](https://github.com/martynsmith/node-irc/issues/416)
- Help with error [\#393](https://github.com/martynsmith/node-irc/issues/393)
-  Microsoft Visual Studio needed to install this in windoze [\#390](https://github.com/martynsmith/node-irc/issues/390)
- oper command [\#234](https://github.com/martynsmith/node-irc/issues/234)

**Merged pull requests:**

- Remove \#blah from the example [\#440](https://github.com/martynsmith/node-irc/pull/440) ([ben-rabid](https://github.com/ben-rabid))
- Move dependency 'ansi-color' to devDependencies [\#407](https://github.com/martynsmith/node-irc/pull/407) ([ho-ho-ho](https://github.com/ho-ho-ho))

## [v0.4.0](https://github.com/martynsmith/node-irc/tree/v0.4.0) (2015-09-30)
[Full Changelog](https://github.com/martynsmith/node-irc/compare/v0.3.12...v0.4.0)

**Fixed bugs:**

- Fix compile warnings on node v4 [\#409](https://github.com/martynsmith/node-irc/pull/409) ([feross](https://github.com/feross))

**Closed issues:**

- Error: Cannot enqueue Handshake after already enqueuing a Handshake. [\#404](https://github.com/martynsmith/node-irc/issues/404)
- How to get current Config? [\#401](https://github.com/martynsmith/node-irc/issues/401)
- Error Installing [\#400](https://github.com/martynsmith/node-irc/issues/400)
- maxLineLength undefined when splitting long lines [\#395](https://github.com/martynsmith/node-irc/issues/395)
- Package 'ansi-color' not found [\#389](https://github.com/martynsmith/node-irc/issues/389)
- speak function bug, can't compile [\#388](https://github.com/martynsmith/node-irc/issues/388)
- Error undefined nick [\#371](https://github.com/martynsmith/node-irc/issues/371)
- Send CustomCommand to server [\#367](https://github.com/martynsmith/node-irc/issues/367)
- The framework constantly crashes - "Cannot call method 'replace' of undefined" [\#364](https://github.com/martynsmith/node-irc/issues/364)
- Trying to make a bot and can't figure out how to kick and do other op tasks [\#363](https://github.com/martynsmith/node-irc/issues/363)
- Update Client.chans on change MODE [\#361](https://github.com/martynsmith/node-irc/issues/361)
- Can node-irc determine who is a mod? [\#340](https://github.com/martynsmith/node-irc/issues/340)
- Config with Password? [\#336](https://github.com/martynsmith/node-irc/issues/336)
- Update node-icu-charset-detector version for nodejs 0.12 compatibility [\#332](https://github.com/martynsmith/node-irc/issues/332)
- \[Question\] Timestamps or how much time a user has been connected? [\#321](https://github.com/martynsmith/node-irc/issues/321)

**Merged pull requests:**

- Bug fix: 'pm' event wouldnt always be trigged [\#397](https://github.com/martynsmith/node-irc/pull/397) ([ravenstar](https://github.com/ravenstar))
- Call updateMaxLineLength on connection [\#396](https://github.com/martynsmith/node-irc/pull/396) ([secretrobotron](https://github.com/secretrobotron))
- Fix typo. [\#383](https://github.com/martynsmith/node-irc/pull/383) ([schmich](https://github.com/schmich))
- SyntaxError: Octal literals are not allowed in strict mode. [\#368](https://github.com/martynsmith/node-irc/pull/368) ([tom--](https://github.com/tom--))
- Fix channel user modes on Twitch IRC \(closes \#364\) [\#366](https://github.com/martynsmith/node-irc/pull/366) ([sim642](https://github.com/sim642))

## [v0.3.12](https://github.com/martynsmith/node-irc/tree/v0.3.12) (2015-04-25)
[Full Changelog](https://github.com/martynsmith/node-irc/compare/v0.3.11...v0.3.12)

**Closed issues:**

- Document 'selfMessage' from \#17 [\#349](https://github.com/martynsmith/node-irc/issues/349)
- Random crash after rpl\_luserunknown [\#342](https://github.com/martynsmith/node-irc/issues/342)

**Merged pull requests:**

- Cosmetics: fix minor spelling mistakes \[ci skip\] [\#356](https://github.com/martynsmith/node-irc/pull/356) ([vBm](https://github.com/vBm))
- Travis: Sort supported node versions [\#355](https://github.com/martynsmith/node-irc/pull/355) ([vBm](https://github.com/vBm))
- Readme: Add badges for npm version, dependency status and license [\#354](https://github.com/martynsmith/node-irc/pull/354) ([vBm](https://github.com/vBm))
- Fix for unrealircd auditorium [\#352](https://github.com/martynsmith/node-irc/pull/352) ([PNWebster](https://github.com/PNWebster))
- Add information about action events in the docs [\#350](https://github.com/martynsmith/node-irc/pull/350) ([ekmartin](https://github.com/ekmartin))
- Fix charset conversion for invalid charsets  [\#347](https://github.com/martynsmith/node-irc/pull/347) ([aivot-on](https://github.com/aivot-on))
- fix\(travis\): Add node 0.12 and iojs to travis. [\#333](https://github.com/martynsmith/node-irc/pull/333) ([jirwin](https://github.com/jirwin))

## [v0.3.11](https://github.com/martynsmith/node-irc/tree/v0.3.11) (2015-04-06)
[Full Changelog](https://github.com/martynsmith/node-irc/compare/v0.3.10...v0.3.11)

## [v0.3.10](https://github.com/martynsmith/node-irc/tree/v0.3.10) (2015-04-02)
[Full Changelog](https://github.com/martynsmith/node-irc/compare/v0.3.9...v0.3.10)

**Closed issues:**

- Error with node-icu-charset-detector [\#327](https://github.com/martynsmith/node-irc/issues/327)
- Cannot call method 'match' of undefined [\#326](https://github.com/martynsmith/node-irc/issues/326)
- TypeError: Cannot read property '1' of null [\#325](https://github.com/martynsmith/node-irc/issues/325)
- Crashes if channel is undefined on say command [\#314](https://github.com/martynsmith/node-irc/issues/314)
- Issue installing on OS X Mavericks [\#308](https://github.com/martynsmith/node-irc/issues/308)

**Merged pull requests:**

- Fixed case sensitivity bug in client.whois\(\) [\#338](https://github.com/martynsmith/node-irc/pull/338) ([itsrachelfish](https://github.com/itsrachelfish))
- fix\(deps\): Upgrade node-icu to 0.1.0 for v0.12 support. [\#334](https://github.com/martynsmith/node-irc/pull/334) ([jirwin](https://github.com/jirwin))
- Update API documentation with missing event and internal variable [\#330](https://github.com/martynsmith/node-irc/pull/330) ([RyanMorrison04](https://github.com/RyanMorrison04))
- Documentation improvements [\#323](https://github.com/martynsmith/node-irc/pull/323) ([TimothyGu](https://github.com/TimothyGu))
- fix blank lines being passed to parse message [\#318](https://github.com/martynsmith/node-irc/pull/318) ([helderroem](https://github.com/helderroem))
- Rember to add path.resolve while requiring things! [\#316](https://github.com/martynsmith/node-irc/pull/316) ([Palid](https://github.com/Palid))
- Fix option handling when passing a secure object [\#311](https://github.com/martynsmith/node-irc/pull/311) ([masochist](https://github.com/masochist))
- Added a bit more information about Client.chans [\#310](https://github.com/martynsmith/node-irc/pull/310) ([itsrachelfish](https://github.com/itsrachelfish))

## [v0.3.9](https://github.com/martynsmith/node-irc/tree/v0.3.9) (2015-01-16)
[Full Changelog](https://github.com/martynsmith/node-irc/compare/v0.3.8...v0.3.9)

**Implemented enhancements:**

- Factor out test data into a fixtures file. [\#302](https://github.com/martynsmith/node-irc/pull/302) ([masochist](https://github.com/masochist))

**Fixed bugs:**

- Fix TLS connections. [\#304](https://github.com/martynsmith/node-irc/pull/304) ([masochist](https://github.com/masochist))

**Closed issues:**

- Please add feature for IRCv3 message tags! [\#298](https://github.com/martynsmith/node-irc/issues/298)
- Switch to irc-color [\#297](https://github.com/martynsmith/node-irc/issues/297)
- SSL Broken as of v0.3.8 [\#296](https://github.com/martynsmith/node-irc/issues/296)
- Version 0.3.8 failed while using hubot-irc [\#289](https://github.com/martynsmith/node-irc/issues/289)
- Loading self signed certs [\#262](https://github.com/martynsmith/node-irc/issues/262)
- 0.3.x : 'nicknameinuse' event missing [\#258](https://github.com/martynsmith/node-irc/issues/258)
- Is there an autoConnect callback? [\#239](https://github.com/martynsmith/node-irc/issues/239)

**Merged pull requests:**

- Log net connection errors. Thanks Trinitas. [\#307](https://github.com/martynsmith/node-irc/pull/307) ([jirwin](https://github.com/jirwin))
- Bring in irc-colors for stripping colors [\#306](https://github.com/martynsmith/node-irc/pull/306) ([masochist](https://github.com/masochist))
- do not autorejoin on kicks. bad bot! no cookie! [\#303](https://github.com/martynsmith/node-irc/pull/303) ([masochist](https://github.com/masochist))
- fix\(style\): Clean up various style issues in irc.js [\#299](https://github.com/martynsmith/node-irc/pull/299) ([jirwin](https://github.com/jirwin))
- Write a test for setting the hostmask when nick is in use [\#294](https://github.com/martynsmith/node-irc/pull/294) ([masochist](https://github.com/masochist))
- fix\(parseMessage\): Factor parseMessage to another file for decoupling. [\#293](https://github.com/martynsmith/node-irc/pull/293) ([jirwin](https://github.com/jirwin))
- Set self.hostMask to the empty string to elegantly solve \#286 [\#292](https://github.com/martynsmith/node-irc/pull/292) ([masochist](https://github.com/masochist))
- First draft of contributing doc [\#287](https://github.com/martynsmith/node-irc/pull/287) ([masochist](https://github.com/masochist))
- Fix data split delimiter [\#280](https://github.com/martynsmith/node-irc/pull/280) ([ota42y](https://github.com/ota42y))

## [v0.3.8](https://github.com/martynsmith/node-irc/tree/v0.3.8) (2015-01-09)
[Full Changelog](https://github.com/martynsmith/node-irc/compare/v0.3.7...v0.3.8)

**Fixed bugs:**

- Client.whois on nick not in use crashes bot running with v.0.3.3 [\#267](https://github.com/martynsmith/node-irc/issues/267)

**Closed issues:**

- Documentation on RTD gone? [\#264](https://github.com/martynsmith/node-irc/issues/264)
- Allow passworded IRC connections [\#263](https://github.com/martynsmith/node-irc/issues/263)
- Parse RPL\_CREATIONTIME [\#260](https://github.com/martynsmith/node-irc/issues/260)
- News from 0.3.x? [\#259](https://github.com/martynsmith/node-irc/issues/259)
- The master branch is not up to date with npm [\#257](https://github.com/martynsmith/node-irc/issues/257)
- Browserify support? [\#253](https://github.com/martynsmith/node-irc/issues/253)
- self.chan and self.chandata events [\#243](https://github.com/martynsmith/node-irc/issues/243)

**Merged pull requests:**

- fix\(webirc\): Set sane defaults for WEBIRC options. [\#283](https://github.com/martynsmith/node-irc/pull/283) ([jirwin](https://github.com/jirwin))
- WIP: fix\(tests\): A first attempt at a sane pattern to begin testing the handling of the protocol. [\#282](https://github.com/martynsmith/node-irc/pull/282) ([jirwin](https://github.com/jirwin))
- fix\(irc.js\): Use the proper EventEmitter class. [\#281](https://github.com/martynsmith/node-irc/pull/281) ([jirwin](https://github.com/jirwin))
- Update colors.js [\#279](https://github.com/martynsmith/node-irc/pull/279) ([bcome](https://github.com/bcome))
- Optional encoding option [\#278](https://github.com/martynsmith/node-irc/pull/278) ([tarlepp](https://github.com/tarlepp))
- WEBIRC support [\#276](https://github.com/martynsmith/node-irc/pull/276) ([Trinitas](https://github.com/Trinitas))
- fix\(style\): Remove folding hints from codes and irc. [\#275](https://github.com/martynsmith/node-irc/pull/275) ([jirwin](https://github.com/jirwin))
- fix\(tests\): Ditch mocha and should for tape! [\#274](https://github.com/martynsmith/node-irc/pull/274) ([jirwin](https://github.com/jirwin))
- Add travis with lint and tests [\#271](https://github.com/martynsmith/node-irc/pull/271) ([jirwin](https://github.com/jirwin))
- Add proper long line wrapping. [\#268](https://github.com/martynsmith/node-irc/pull/268) ([masochist](https://github.com/masochist))
- update README regarding npm and the 0.3.x branch [\#256](https://github.com/martynsmith/node-irc/pull/256) ([mbouchenoire](https://github.com/mbouchenoire))
- Updated API information [\#240](https://github.com/martynsmith/node-irc/pull/240) ([Hydrothermal](https://github.com/Hydrothermal))
- Add option to specify bind address when connecting [\#146](https://github.com/martynsmith/node-irc/pull/146) ([revmischa](https://github.com/revmischa))

## [v0.3.7](https://github.com/martynsmith/node-irc/tree/v0.3.7) (2014-05-29)
[Full Changelog](https://github.com/martynsmith/node-irc/compare/v0.3.5...v0.3.7)

**Closed issues:**

- Sending nick out of sequence can cause exceptions [\#235](https://github.com/martynsmith/node-irc/issues/235)
- Events need a different approach [\#231](https://github.com/martynsmith/node-irc/issues/231)
- Check if an user is a voice, half-operator, operator,... [\#230](https://github.com/martynsmith/node-irc/issues/230)
- my script throws error "You have not registered" [\#229](https://github.com/martynsmith/node-irc/issues/229)
- Cannot call method 'indexOf' of undefined [\#227](https://github.com/martynsmith/node-irc/issues/227)
- I need SPEED ! [\#223](https://github.com/martynsmith/node-irc/issues/223)
- With stripColors: true set, a post only containing control characters, such as color or bold crashes the library [\#218](https://github.com/martynsmith/node-irc/issues/218)
- Bot Disconnects Every 10 Minutes [\#215](https://github.com/martynsmith/node-irc/issues/215)
- State of project [\#213](https://github.com/martynsmith/node-irc/issues/213)
- add the 'action' event to the documentation [\#212](https://github.com/martynsmith/node-irc/issues/212)
- line ending problem: module does not support UNIX Line Ending [\#208](https://github.com/martynsmith/node-irc/issues/208)
- identify command? [\#205](https://github.com/martynsmith/node-irc/issues/205)
- looking for a maintainer? [\#197](https://github.com/martynsmith/node-irc/issues/197)
- pm only works with mirc clients? [\#196](https://github.com/martynsmith/node-irc/issues/196)
- message time [\#195](https://github.com/martynsmith/node-irc/issues/195)
- Ping Pong idea [\#194](https://github.com/martynsmith/node-irc/issues/194)
- examples not working [\#193](https://github.com/martynsmith/node-irc/issues/193)
- Code reuse and license compliance [\#192](https://github.com/martynsmith/node-irc/issues/192)
- Pull requests building up in backlog [\#189](https://github.com/martynsmith/node-irc/issues/189)
- Bold text [\#185](https://github.com/martynsmith/node-irc/issues/185)
- Support for server-time extension [\#184](https://github.com/martynsmith/node-irc/issues/184)
- client.removeListener [\#180](https://github.com/martynsmith/node-irc/issues/180)
- Adding callback to say\(\) method of Node IRC client [\#179](https://github.com/martynsmith/node-irc/issues/179)
- Getting "Assertion failed" error with secure:true flag [\#178](https://github.com/martynsmith/node-irc/issues/178)
- PRIVMSG that starts with : causes crash [\#173](https://github.com/martynsmith/node-irc/issues/173)
- MODE change resulting in constant crash [\#171](https://github.com/martynsmith/node-irc/issues/171)
- client.addListener\("message\#Channel" bug [\#169](https://github.com/martynsmith/node-irc/issues/169)
- Reconnection fails because of nick modification [\#168](https://github.com/martynsmith/node-irc/issues/168)
- When sending NICK command, the channel returned is lowercase [\#167](https://github.com/martynsmith/node-irc/issues/167)
- Crash when using NAMES command [\#163](https://github.com/martynsmith/node-irc/issues/163)
- Incompatible with Node 0.10.x with `secure` is `true` [\#160](https://github.com/martynsmith/node-irc/issues/160)
- Handling ISO-8859-1 characters [\#157](https://github.com/martynsmith/node-irc/issues/157)
- Cannot login to twitch irc [\#156](https://github.com/martynsmith/node-irc/issues/156)
- Problem with connecting to Inspircd server [\#154](https://github.com/martynsmith/node-irc/issues/154)
- Method for specifying the user's hostname [\#153](https://github.com/martynsmith/node-irc/issues/153)
- Limit output [\#152](https://github.com/martynsmith/node-irc/issues/152)
- Change nick at runtime? [\#149](https://github.com/martynsmith/node-irc/issues/149)
- how to connect with a server password for twitchtv/justintv? [\#148](https://github.com/martynsmith/node-irc/issues/148)
- please delete it [\#141](https://github.com/martynsmith/node-irc/issues/141)
- Ensure QUIT message is processed correctly when using flood protection [\#138](https://github.com/martynsmith/node-irc/issues/138)
- add connection parameters to include userName and realName [\#135](https://github.com/martynsmith/node-irc/issues/135)
- Add an 'action' event [\#134](https://github.com/martynsmith/node-irc/issues/134)
- chat server connection errors [\#127](https://github.com/martynsmith/node-irc/issues/127)
- CTCP event should provide message object \(similar to message\# event\) [\#126](https://github.com/martynsmith/node-irc/issues/126)
- new npm release? [\#124](https://github.com/martynsmith/node-irc/issues/124)
- MODE messages don't appear to work correctly with JustinTV/TwitchTV chat. [\#123](https://github.com/martynsmith/node-irc/issues/123)
- Colons in user messages cause issues [\#122](https://github.com/martynsmith/node-irc/issues/122)
- rpl\_channelmodeis messages are not parsed correctly [\#120](https://github.com/martynsmith/node-irc/issues/120)
- Issue with Non-ASCII Nick [\#104](https://github.com/martynsmith/node-irc/issues/104)

**Merged pull requests:**

- Fixes \#235 type error where channel does not exist [\#236](https://github.com/martynsmith/node-irc/pull/236) ([qq99](https://github.com/qq99))
- support for use\_strict [\#228](https://github.com/martynsmith/node-irc/pull/228) ([tedgoddard](https://github.com/tedgoddard))
- Fixed irc not connecting to selfsigned servers [\#201](https://github.com/martynsmith/node-irc/pull/201) ([antonva](https://github.com/antonva))
- added 'err\_erroneusnickname' message case' [\#191](https://github.com/martynsmith/node-irc/pull/191) ([redshark1802](https://github.com/redshark1802))
- fix\(package.json\): Add ansi-color to the package dependencies. [\#188](https://github.com/martynsmith/node-irc/pull/188) ([jirwin](https://github.com/jirwin))
- fix\(lib/irc\): Use protected loops when iterating channels to remove users [\#187](https://github.com/martynsmith/node-irc/pull/187) ([jirwin](https://github.com/jirwin))
- Fix the color wrap function [\#186](https://github.com/martynsmith/node-irc/pull/186) ([cattode](https://github.com/cattode))
- Hide 'Sending irc NICK/User' debug msg [\#183](https://github.com/martynsmith/node-irc/pull/183) ([porjo](https://github.com/porjo))
- Added bold/underline "colors" [\#170](https://github.com/martynsmith/node-irc/pull/170) ([BenjaminRH](https://github.com/BenjaminRH))
- Fix Cient.join: when user specify a password [\#166](https://github.com/martynsmith/node-irc/pull/166) ([macpie](https://github.com/macpie))
- Fix a crash bug when a zero length message is received [\#165](https://github.com/martynsmith/node-irc/pull/165) ([shiwano](https://github.com/shiwano))
- Change to be a non-existing server/channel [\#162](https://github.com/martynsmith/node-irc/pull/162) ([chilts](https://github.com/chilts))
- Add support for client certificates in connection handling [\#161](https://github.com/martynsmith/node-irc/pull/161) ([squeeks](https://github.com/squeeks))
- fixed a small typo for util.log\(\) on MODE change [\#158](https://github.com/martynsmith/node-irc/pull/158) ([JohnMaguire](https://github.com/JohnMaguire))
- Fix: codes variable is leaked to global scope [\#155](https://github.com/martynsmith/node-irc/pull/155) ([garyc40](https://github.com/garyc40))
- Added user message support for PART [\#140](https://github.com/martynsmith/node-irc/pull/140) ([qsheets](https://github.com/qsheets))
- Fix for receiving messages with colons [\#137](https://github.com/martynsmith/node-irc/pull/137) ([qsheets](https://github.com/qsheets))
- add names for five numerics; fix handling of 002 and 003 [\#131](https://github.com/martynsmith/node-irc/pull/131) ([rwg](https://github.com/rwg))
- provide message object to ctcp events [\#130](https://github.com/martynsmith/node-irc/pull/130) ([damianb](https://github.com/damianb))
- add names\#channel event [\#129](https://github.com/martynsmith/node-irc/pull/129) ([ydnax](https://github.com/ydnax))
- Added SASL support [\#125](https://github.com/martynsmith/node-irc/pull/125) ([gsf](https://github.com/gsf))

## [v0.3.5](https://github.com/martynsmith/node-irc/tree/v0.3.5) (2013-01-01)
[Full Changelog](https://github.com/martynsmith/node-irc/compare/v0.3.3...v0.3.5)

**Closed issues:**

- How to handle disconnects? [\#117](https://github.com/martynsmith/node-irc/issues/117)
- opping and kicking on freenode.net [\#110](https://github.com/martynsmith/node-irc/issues/110)
- 'LOAD' event issue?  [\#108](https://github.com/martynsmith/node-irc/issues/108)
- TOPIC command doesn't play nicely with send function [\#98](https://github.com/martynsmith/node-irc/issues/98)
- Add support for more channel types [\#97](https://github.com/martynsmith/node-irc/issues/97)
- Passing a large array of channels causes flood kick [\#96](https://github.com/martynsmith/node-irc/issues/96)
- Issuing NICK during session breaks JOIN [\#93](https://github.com/martynsmith/node-irc/issues/93)
- Make Client writable/readable stream? [\#92](https://github.com/martynsmith/node-irc/issues/92)
- whois + host with IPv6 leads to info.host = '0' [\#90](https://github.com/martynsmith/node-irc/issues/90)
- Sending PASS to password protected irc server prepends : [\#87](https://github.com/martynsmith/node-irc/issues/87)
- 'invite' not emitted [\#86](https://github.com/martynsmith/node-irc/issues/86)
- uncaught error on data listener [\#83](https://github.com/martynsmith/node-irc/issues/83)
- Disable stdout for server events without specific listeners [\#78](https://github.com/martynsmith/node-irc/issues/78)
- Handle server connection failures gracefully [\#74](https://github.com/martynsmith/node-irc/issues/74)
- Emit mode change events [\#70](https://github.com/martynsmith/node-irc/issues/70)
- Emit channels for "kill" like for "quit" [\#69](https://github.com/martynsmith/node-irc/issues/69)
- Handle errors when parsing message [\#64](https://github.com/martynsmith/node-irc/issues/64)
- Event on successful pm [\#56](https://github.com/martynsmith/node-irc/issues/56)
- \[Feature request\] Automatic flood protection [\#36](https://github.com/martynsmith/node-irc/issues/36)
- refactor node-irc to emit only one 'event' object [\#18](https://github.com/martynsmith/node-irc/issues/18)

**Merged pull requests:**

- Added library support for the RPL\_ISUPPORT server reply [\#114](https://github.com/martynsmith/node-irc/pull/114) ([qsheets](https://github.com/qsheets))
- Fixed the message splitting on Client.say [\#112](https://github.com/martynsmith/node-irc/pull/112) ([Pumpuli](https://github.com/Pumpuli))
- Fixed the message object being modified on MODE command. [\#111](https://github.com/martynsmith/node-irc/pull/111) ([Pumpuli](https://github.com/Pumpuli))
- Add option to split long messages into multiple PRIVMSG calls [\#106](https://github.com/martynsmith/node-irc/pull/106) ([PherricOxide](https://github.com/PherricOxide))
- Restore Fix for: Handle unverifiable self-signed certificates. [\#102](https://github.com/martynsmith/node-irc/pull/102) ([4poc](https://github.com/4poc))
- If needed, update self.nick when NICK is received [\#94](https://github.com/martynsmith/node-irc/pull/94) ([toolness](https://github.com/toolness))
- This fixes the IPv6-Issue \#90 for me. [\#91](https://github.com/martynsmith/node-irc/pull/91) ([ccoenen](https://github.com/ccoenen))
- Make flood protection timeout setting configurable. [\#84](https://github.com/martynsmith/node-irc/pull/84) ([lewinski](https://github.com/lewinski))
- Event emiter for bad connection [\#77](https://github.com/martynsmith/node-irc/pull/77) ([akavlie](https://github.com/akavlie))
- Include channels user was in when 'kill' is emitted [\#72](https://github.com/martynsmith/node-irc/pull/72) ([alexwhitman](https://github.com/alexwhitman))
- Emit +mode and -mode on mode changes [\#71](https://github.com/martynsmith/node-irc/pull/71) ([alexwhitman](https://github.com/alexwhitman))
- Fix problem with 'QUIT' command [\#68](https://github.com/martynsmith/node-irc/pull/68) ([tapichu](https://github.com/tapichu))
- Emit 'message\#' for a channel message [\#67](https://github.com/martynsmith/node-irc/pull/67) ([alexwhitman](https://github.com/alexwhitman))
- Include message object with emits [\#66](https://github.com/martynsmith/node-irc/pull/66) ([alexwhitman](https://github.com/alexwhitman))
- add some simple CTCP support [\#58](https://github.com/martynsmith/node-irc/pull/58) ([thejh](https://github.com/thejh))
- Updating the certExpired option [\#53](https://github.com/martynsmith/node-irc/pull/53) ([jonrohan](https://github.com/jonrohan))

## [v0.3.3](https://github.com/martynsmith/node-irc/tree/v0.3.3) (2011-11-16)
[Full Changelog](https://github.com/martynsmith/node-irc/compare/v0.3.2...v0.3.3)

**Closed issues:**

- Race condition, mode+- before mode= seems to cause crash [\#65](https://github.com/martynsmith/node-irc/issues/65)
- SSL Failed to connect [\#60](https://github.com/martynsmith/node-irc/issues/60)
- "kill" emits no event [\#59](https://github.com/martynsmith/node-irc/issues/59)
- NAMES command crashes client on InspIRCd-2.0 servers [\#55](https://github.com/martynsmith/node-irc/issues/55)
- Traceback after joining network in 0.3.1 [\#50](https://github.com/martynsmith/node-irc/issues/50)
- Handle erroneous commands gracefully [\#48](https://github.com/martynsmith/node-irc/issues/48)
- Automatic NickServ /IDENTIFYcation? [\#47](https://github.com/martynsmith/node-irc/issues/47)

**Merged pull requests:**

- Handle errors in rpl\_namreply. [\#62](https://github.com/martynsmith/node-irc/pull/62) ([schwuk](https://github.com/schwuk))
- Handle unverifiable self-signed certificates. [\#61](https://github.com/martynsmith/node-irc/pull/61) ([schwuk](https://github.com/schwuk))
- Password support [\#51](https://github.com/martynsmith/node-irc/pull/51) ([wraithan](https://github.com/wraithan))

## [v0.3.2](https://github.com/martynsmith/node-irc/tree/v0.3.2) (2011-10-30)
[Full Changelog](https://github.com/martynsmith/node-irc/compare/v0.3.1...v0.3.2)

## [v0.3.1](https://github.com/martynsmith/node-irc/tree/v0.3.1) (2011-10-29)
[Full Changelog](https://github.com/martynsmith/node-irc/compare/v0.3.0...v0.3.1)

## [v0.3.0](https://github.com/martynsmith/node-irc/tree/v0.3.0) (2011-10-28)
[Full Changelog](https://github.com/martynsmith/node-irc/compare/v0.2.1...v0.3.0)

**Closed issues:**

- Add command for listing channels [\#42](https://github.com/martynsmith/node-irc/issues/42)
- Parse /version instead of hardcoded symbols in MODE [\#40](https://github.com/martynsmith/node-irc/issues/40)
- Channel letter-case crashes client [\#39](https://github.com/martynsmith/node-irc/issues/39)
- Cannot read property 'users' of undefined [\#38](https://github.com/martynsmith/node-irc/issues/38)

**Merged pull requests:**

- Update package.json [\#45](https://github.com/martynsmith/node-irc/pull/45) ([chilts](https://github.com/chilts))
- Added optional callbacks to connect and disconnect [\#44](https://github.com/martynsmith/node-irc/pull/44) ([fent](https://github.com/fent))
- stripColors option [\#43](https://github.com/martynsmith/node-irc/pull/43) ([Excedrin](https://github.com/Excedrin))
- Fixed missing nick in TOPIC socketio event [\#41](https://github.com/martynsmith/node-irc/pull/41) ([alexmingoia](https://github.com/alexmingoia))
- Document internal functions and variables, activateFloodProtection [\#37](https://github.com/martynsmith/node-irc/pull/37) ([Hello71](https://github.com/Hello71))
- first pass at sphinx docs [\#35](https://github.com/martynsmith/node-irc/pull/35) ([wraithan](https://github.com/wraithan))
- adding colors [\#33](https://github.com/martynsmith/node-irc/pull/33) ([wraithan](https://github.com/wraithan))
- split out irc codes from client code. [\#31](https://github.com/martynsmith/node-irc/pull/31) ([wraithan](https://github.com/wraithan))

## [v0.2.1](https://github.com/martynsmith/node-irc/tree/v0.2.1) (2011-10-01)
[Full Changelog](https://github.com/martynsmith/node-irc/compare/v0.2.0...v0.2.1)

**Closed issues:**

- \[Path [\#22](https://github.com/martynsmith/node-irc/issues/22)
- Should sending messages also emit a 'message' signal? [\#17](https://github.com/martynsmith/node-irc/issues/17)
- provide a way to access the current nick [\#12](https://github.com/martynsmith/node-irc/issues/12)

**Merged pull requests:**

- Self signed SSL certificates [\#27](https://github.com/martynsmith/node-irc/pull/27) ([stigi](https://github.com/stigi))
- Adds 'selfMessage' event [\#25](https://github.com/martynsmith/node-irc/pull/25) ([AvianFlu](https://github.com/AvianFlu))
- Added support for flood protection [\#23](https://github.com/martynsmith/node-irc/pull/23) ([epeli](https://github.com/epeli))
- Fixed bug when sending empty strings or several lines to say [\#21](https://github.com/martynsmith/node-irc/pull/21) ([eirikb](https://github.com/eirikb))
- append notice method to Client.prototype. [\#20](https://github.com/martynsmith/node-irc/pull/20) ([futoase](https://github.com/futoase))
- Parsing out ~ & and % in the channel user list [\#15](https://github.com/martynsmith/node-irc/pull/15) ([pusherman](https://github.com/pusherman))
- Reconnect all rooms upon server reconnect.   [\#14](https://github.com/martynsmith/node-irc/pull/14) ([lloyd](https://github.com/lloyd))
- listen for the socket 'close' event rather than 'end'.  'end' is triggere [\#13](https://github.com/martynsmith/node-irc/pull/13) ([lloyd](https://github.com/lloyd))
- Bug fix in join/part/kick events [\#11](https://github.com/martynsmith/node-irc/pull/11) ([luscoma](https://github.com/luscoma))

## [v0.2.0](https://github.com/martynsmith/node-irc/tree/v0.2.0) (2011-04-29)
[Full Changelog](https://github.com/martynsmith/node-irc/compare/v0.1.2...v0.2.0)

**Merged pull requests:**

- Add an event for `/invite` [\#10](https://github.com/martynsmith/node-irc/pull/10) ([jsocol](https://github.com/jsocol))
- Documented the Client.Disconnect method [\#9](https://github.com/martynsmith/node-irc/pull/9) ([mdwrigh2](https://github.com/mdwrigh2))
- Updated ssl support to work with tsl [\#8](https://github.com/martynsmith/node-irc/pull/8) ([indiefan](https://github.com/indiefan))
- QUIT and NICK events [\#7](https://github.com/martynsmith/node-irc/pull/7) ([Mortal](https://github.com/Mortal))
- autoConnect Client option [\#6](https://github.com/martynsmith/node-irc/pull/6) ([Oshuma](https://github.com/Oshuma))
- added a "notice" event [\#5](https://github.com/martynsmith/node-irc/pull/5) ([thejh](https://github.com/thejh))
- Properly handle changing user mode [\#4](https://github.com/martynsmith/node-irc/pull/4) ([justinabrahms](https://github.com/justinabrahms))
- fix unwritable stream error after disconnected [\#3](https://github.com/martynsmith/node-irc/pull/3) ([sublee](https://github.com/sublee))

## [v0.1.2](https://github.com/martynsmith/node-irc/tree/v0.1.2) (2010-05-19)
[Full Changelog](https://github.com/martynsmith/node-irc/compare/v0.1.1...v0.1.2)

## [v0.1.1](https://github.com/martynsmith/node-irc/tree/v0.1.1) (2010-05-15)
[Full Changelog](https://github.com/martynsmith/node-irc/compare/v0.1.0...v0.1.1)

## [v0.1.0](https://github.com/martynsmith/node-irc/tree/v0.1.0) (2010-05-14)


\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*
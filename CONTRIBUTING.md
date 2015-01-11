# Contributing to node-irc

First, and most importantly, thank you for contributing to node-irc! Your efforts make the library
as awesome as it is, and we really couldn't do it without you. Through your pull requests, issues,
and discussion, together we are building the best IRC library for node. So, once again, *thank you*!

What follows is a set of guidelines for contributing to node-irc. We ask that you follow them
because they make our lives as maintainers easier, which means that your pull requests and issues
have a higher chance of being addressed quickly. Please help us help you!

This guide is roughly based on the [Atom contributor's guide](https://github.com/atom/atom/blob/master/CONTRIBUTING.md), so thanks to the Atom team for
providing such a solid framework on which to hang our ideas.

# Submitting Issues
* Include the version of node-irc, or the SHA1 from git if you're using git.
* Include the behavior you expect, other clients / bots where you've seen that behavior, the
 observed behavior, and details on how the two differ if it's not obvious.
* Enable debug mode for node-irc and include its output in your report.
* In the case of a crash, include the full stack trace and any error output.
* Perform a cursory search to see if similar issues or pull requests have already been filed, and
comment on them to move the discussion forward.
* Most importantly, provide a minimal test case that demonstrates your bug. This is the best way
to help us quickly isolate and fix your bug.
* Consider joining us on IRC (##node-irc on freenode) for realtime discussion. Not only is it a
friendly gesture, it also helps us isolate your issue far more quickly than the back-and-forth of
issues on github allows.

# Pull requests
* Add yourself to the contributors section of package.json to claim credit for your work!
* Do your work on a branch from master and file your pull request from that branch to master.
* Make sure your code passes all tests (`npm run test; npm run lint`).
* If possible, write *new* tests for the functionality you add. Once we have sane testing in place,
this will become a hard requirement, so it's best to get used to it now!
* If you change any user-facing element of the library (e.g. the API), document your changes.
* If you make *breaking* changes, say so clearly in your pull request, so we know to schedule the
merge when we plan to break the API for other changes.
* Squash your commits into one before issuing your pull request. If you are not sure how to do this,
take a look at the [edx instructions](https://github.com/edx/edx-platform/wiki/How-to-Rebase-a-Pull-Request) and change the
obvious things to apply to your node-irc fork. If this doesn't make sense, or you're having trouble,
come talk to us on IRC! We'll be glad to walk you through it.
* End files with a newline.

# Commit messages
* Use the present tense ("Add feature" not "Added feature").
* Use the imperative mood ("Change message handling..." not "Changes message handling...").
* Limit the first line to 72 characters or less.
* Reference issues and pull requests liberally.

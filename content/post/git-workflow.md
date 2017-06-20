+++
author = "Dimitris Zorbas"
date = "2017-06-20"
draft = false
title = "Git Guidelines"
image = "images/posts/git/git_logo.png"
tags = ["git", "development"]
comments = true
share = true
+++


### Broken Windows Theory

> Consider a building with a few broken windows.
> If the windows are not repaired, the tendency is for vandals to break a few more windows.
> Eventually, they may even break into the building, and if it's unoccupied, perhaps become squatters or light fires inside.

Source: https://en.wikipedia.org/wiki/Broken_windows_theory

### Some Quality

Readable commit messages are a sign of of quality codebase.

![xkcd-git-commit](https://imgs.xkcd.com/comics/git_commit_2x.png)

### Rules

#### Use Present Tense

Your code base is an organism and it's constantly evolving.

Imagine that you're guiding the evolution of your codebase and those commit
messages are the **commands** to modify its genetic code.

![meta](http://66.media.tumblr.com/d1a43569f872fd040a0ebed83854b523/tumblr_inline_o3g1w3vXJF1qkdogo_500.gif)

#### Help your future self

> Peace of mind produces right values, right values produce right thoughts.
> Right thoughts produce right actions and right actions produce work which will be a material reflection
> for others to see of the serenity at the center of it all.

![future-self](https://imgs.xkcd.com/comics/future_self_2x.png)

It doesn't matter how you developed it. You should should logically group commits together based on what they do,
not what you did to produce them.


#### Arrange Commits in Logical Order

The commit history of a branch should read like cooking instructions:

* Slice the onions
* Pre-heat the oven
* Cook for 30 minutes
* Add salt and pepper

If commit X depends on changes done in commit Y, then commit Y should come before commit X.

#### Be Precise

A commit message should describe exactly what the commit changes. When
you change some source code files for a specific purpose you should make
sure that in the commit you adapt their tests for the behaviour you
describe in the commit.

If you create commit that you know that you'll squash / fixup them later
use:

```shell
git commit --squash 1337acab
# or
git commit --fixup 1337acab
```

#### Be verbose

Keep the first line of the commit message to at most 50 characters.
Leave a newline and write extensive info about the introduced changes after it.

```
Add Lunar Landing Module

Issue: MOON-1337

A Lunar landing module is necessary since our last landing attempt which
used parachutes failed due to the lack of air friction.

This module roughly looks like this: 🚀
```

### Tagging

#### Release Tags

Your release tags will most probably be version numbers.
If you use SEMVER, your versions have the `X.Y.Z` format (where X: Major, Y: Minor, Z: Patch).

Prefix your release tags with `v`, like `v4.2.0` to distinguish them from non-version tags.

A release tag should point to a commit containing all the necessary
changes to differentiate the new version from the others.

* `CHANGELOG`
* `package.json` / `mix.exs` / `*.gemspec`


<style>
.main-header {
  background-size: 17% auto;
}
</style>

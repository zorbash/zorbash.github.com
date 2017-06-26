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


> Treat your git history like your garden
>
> -- Confucius, 475BC

Being meticulous and providing quality information about the changes you
introduce to a codebase can be a mundane. 

Using a few popular and proven patterns can help you find the way towards 
effective collaboration and quicker fire-fighting.

Bad Gardening:

![flying-lawnmower](/images/posts/git/flying_lawnmower_resized.gif)

Good Gardening:

![lawnmower-man](/images/posts/git/lawnmower_man.jpg)

### Making History

Readable commit messages are a sign of a quality codebase.

![xkcd-git-commit](/images/posts/git/xkcd_git_commit_resized.png)

> Consider a building with a few broken windows.
> If the windows are not repaired, the tendency is for vandals to break a few more windows.
> Eventually, they may even break into the building, and if it's unoccupied, perhaps become squatters or light fires inside.

Source: https://en.wikipedia.org/wiki/Broken_windows_theory

#### Help your future self

> Peace of mind produces right values, right values produce right thoughts.  
> Right thoughts produce right actions and right actions produce work  
> which will be a material reflection for others to see of the serenity at the center of it all.
>
> -- Robert M. Pirsig - Zen and the Art of Motorcycle Maintenance

![future-self](/images/posts/git/xkcd_future_self_resized.png)

Authoring good git commits, is the least you can do to keep the interest
rate for your technical debt at low levels.

### Rules

#### Use Present Tense

Your code base is an organism and it's constantly evolving.

Imagine that you're guiding the evolution of your codebase and those commit
messages are the **commands** to modify its genetic code.

![meta](/images/posts/git/someta.gif)

You might also want to check out [gource][gource] 😎.

Commit messages **should** start with a capitalized verb in the present tense.

Example (phoenix):

```
c0b25089 Remove phx_ecto duplication
b7adcb4c Move shared web templates to phx_web
3fd344f1 Split test aparts and increase coverage in Ecto task
c91443b5 Rename mix files to match Elixir structure
dad095c6 Generate dev, test and prod in umbrella with logger
1a9e7d6e Fix live reload paths for new apps
ff2be4ae Update mix.exs and installer path
adb783e6 Rename web to assets. Closes #2116
```

Example (rails):

```
9edc998d2a Refactor driver adapter getter/setter
fa2b7b03cc Inherit from ActionDispatch::IntegrationTest
93eff636a6 Add test assertion helpers
0dc63281da Add configuration option for driver adapter
0056c9b977 Add ForHelper's for system tests
```

#### Arrange Commits in Logical Order

The commit history of a branch should read like cooking instructions:

* Slice the onions
* Pre-heat the oven
* Cook for 30 minutes
* Add salt and pepper

If commit X depends on changes done in commit Y, then commit Y should come before commit X.

It doesn't matter how you developed it. You should should logically group commits together based on what they do,
not what you did to produce them.

#### Be Precise

Our craft requires precise, reasonable actions. Your git history will
stand unchanged (_thou shall not force push to master_) to justify them
for any future readers.

![babbage-difference-engine](/images/posts/git/babbage_resized.jpg)

Original designs of the difference engine by Charles Babbage.  
Just try to imagine this man's git commits!

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

A Lunar landing module is necessary since our last landing attempt which used parachutes, 
failed due to the lack of air friction.

This module roughly looks like this: 🚀
```

#### Be Serious

All commits should look like they were authored by the same person.  
They must have condensed information and are not meant to be
entertaining, or a means to express opinions or personal traits.


Bad

```
2017-07-07 - <The Dude> - "That Plug, it really tied this pubsub room together"
```

Good

```
2017-07-07 - <Walter> - "Remove SomeName Plug which made connections stateful"
```

#### Release Tags

Your release tags will most probably be version numbers.
If you use SEMVER, your versions have the `X.Y.Z` format (where X: Major, Y: Minor, Z: Patch).

Prefix your release tags with `v`, like `v4.2.0` to distinguish them from non-version tags.

A release tag should point to a commit containing all the necessary
changes to differentiate the new version from the others.

* `CHANGELOG`
* `package.json` / `mix.exs` / `*.gemspec`

### Useful Commands / Aliases

```ini
[alias]
# Create a fixup commits which can be automatically autosquashed on rebase
cif = "!f() { git commit --fixup="$1"; }; f"

# Run the RSpec tests you've changed
test = "!f() { git diff-index origin/master --name-only | grep '_spec.rb' | xargs bundle exec rspec; }; f"

# Browse your recent-branches
recent-branches = "!f() { git reflog | grep 'checkout:' | head -n 50 | sed 's/.*moving from //' | sed 's/ to .*//' | sed 's/.* reset: .*//g' | sed '/^$/d' | awk ' !x[$0]++' | head -n 10 | nl; }; f"
```

### Useful Tools

#### [Tig][tig]

Tig is an ncurses-based text-mode interface for git. It functions mainly as a Git repository browser, but can also assist in staging changes for commit at chunk level and act as a pager for output from various Git commands.

![tig](/images/posts/git/ecto_tig.png)

#### [Fugitive][vim-fugitive]

Is a vim plugin which provides useful git commands from within vim.
I frequently use `:Gblame` to interactively browse historical evolution
of a file, like you can see below:

![vim-fugitive](/images/posts/git/vim-fugitive.png)

#### Commitia

Is a vim plugin which improves the commit buffer.

committia.vim splits the buffer into 3 windows; edit window, status window and diff window.

![vim-commitia](/images/posts/git/commitia_vim_resized.png)

### Suggested Reading

* tpope - [A Note About Commit Messages][tpope-commits]
* https://github.com/agis/git-style-guide
* Scott Chacon - [Pro git][progit]
* Stephen Fry - [Making history][making-history]
* Sydney Padua - [The Thrilling Adventures of Lovelace and Babbage][babbage-ada-book]


[tig]: https://jonas.github.io/tig/
[vim-fugitive]: https://github.com/tpope/vim-fugitive
[gource]: http://gource.io/
[progit]: https://git-scm.com/book/en/v2
[tpope-commits]: http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html
[making-history]: https://www.goodreads.com/book/show/317457.Making_History
[babbage-ada-book]: https://www.goodreads.com/book/show/22822839-the-thrilling-adventures-of-lovelace-and-babbage

<style>
.main-header {
  background-size: 17% auto;
}
</style>

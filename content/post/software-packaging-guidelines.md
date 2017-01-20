+++
author = "Dimitris Zorbas"
date = "2017-01-19"
draft = false
title = "Software Packaging Guidelines"
image = "images/posts/packaging_xkcd.png"
tags = ["open-source", "packaging", "guidelines"]
comments = true
share = true
+++


This post is an collection common practices for software packaging.
The ultimate goal is to be able to define a set of guidelines, which can be
applied to a wide range of projects, aiming to build up confidence in using
the packaged source.

</br>

<div class="polaroid">
  <img src="/images/posts/package_conveyor.gif" class="img-medium" alt="oz">
  <p>Continuous Delivery..sort of</p>
</div>

</br>

## Focus of this post

The objective of the guidelines below is to increase efficiency in
communication and raise awareness on good packaging practices. It's
meant to be minimal yet practical, written with rubygems, hex, npm, et al.
packages in mind.  

To avoid confusion about the use of the word "packaging", in this
context, it conveys the meaning of measures to be taken for source code
to be able to be effectively packaged and released for language package management
platforms.


## Build systems, not just apps

Successful open-source projects invest in building a healthy community,
the people, together with the application architecture are a system.

No matter how awesome the code is, it still has to inspire confidence
and satisfy some sane community software release patterns.
This can reduce frustration for dependents of the package and allow the base of 
contributors to expand, as more people will be able to get involved with the release procedure.

It's a basic rule of quality, a process has to be written down, otherwise it cannot improve and be respected.

### Software Packaging Guidelines

### License

Without a license, the default copyright laws apply, meaning that you retain all
rights to your source code and no one may reproduce, distribute, or create derivative
works from your work.

Without an open-source license, it can be hard for people using your software to be
aware in what terms they may contribute back changes or even fork your project.

####  Suggestion

You should have a file in the root of your repo with a name like `license.md`,
`license.txt`. It doesn't matter whether it's uppercase or not.

Visit [www.choosealicense.com][choosealicense] to get help picking the right one for
you project.
The most common licenses on GitHub seem to be [permissive][tldr-permissive] ones like
[MIT][mit-license] and the [FreeBSD/Simplified][freebsd-license]
which allow downstream developers to use and modify the licensed code
without having to share their modifications.

Keep in mind though for licenses which allow project take-overs.
Permissive licenses allow others to release software containing your
work under a commercial license making money out of it.

Remember that in order to change the license for an existing project where many people
own the work, an 100% consensus is required for the license to change.

Where applicable specify your license in your project's package
manifest ([package.json][packagejson-license], [gemspec][gemspec-license],
[project.clj][projectclj-license], etc).

### Release Tags

Tags in your version control matching your release versions.

Greatly improves source discoverability. It can be really beneficial during debugging
and is an absolute requirement for auditing reasons. People want to
know what is the exact snapshot of the code included in your project's
x.y.z version.

####  Suggestion

No matter which versioning scheme your use, you should create a tag for that version.

Example (using git):

You wish to release version 1.4.2 of your source.  
You'll first create an [annotated tag][git-annotated-tag] by running:

```elixir
git tag -a 'v1.4.2'
```

You will then be requested to write a message for the tag.

Info to include in a Git release tag:

* Link to issue tracker milestone
* Link related changelog entry
* Contributors involved in the release (give merit ☺)

If you're hosting your project on GitHub you can easily create a
[release][github-releases] from a tag and add additional information in markdown there.

> Protip: GitHub keeps an rss feed for releases ([example][kitto-releases]), making
it easy for dependents to be notified to update.

Then share the created tag to your repository host.

```elixir
git push origin --tags
```

### Documentation Files

Some files providing information to readers of your code have to be present.

#### Readme

It's the first file someone has to read in your project. It can have
any name like `README`, `README.md`, `README.txt`, `readme.rdoc` and has to
exist in the root of the project's repository.

##### Suggestion

Below there's a small list of things you might want to include in the Readme:

* Goal of the project - The stated reason of the project's existence
* System dependencies required to use it
* Build instructions
* Usage examples
* The versioning scheme it adheres to
* Instructions to run the test suite

#### Contributing

Has to exist in the root of the project's repository. It's commonly named `CONTRIBUTING.md`.

Informs people reading your code, on the procedure to follow if they wish to
contribute back, and the [etiquette][netiquette] to conform to for any communication
concerning the project.

GitHub will prompt users creating an issue to your repo, to read your guidelines,
when such a file is found (read about the GitHub feature [here][github-contributing]).

##### Suggestion

Add a `CONTRIBUTING.md` file at the root of your repo.  
Some guidelines out in the wild on which you can base yours are:

* Rails [contribution guidelines][rails-contributing]
* Atom Editor [contribution guidelines][atom-contributing]
* Kitto Framework [contribution guidelines][kitto-contributing]

#### Changelog

A Changelog is a file communicating changes users should be aware of
for each released version of a project.

Dependents should be able to find concise information for a project's
changes, without looking at the vcs history, to determine the feasibility
to upgrade and the steps required.

##### Suggestion

Add a `CHANGELOG.md` file at the root of your repository.

A template to base yours:

```
# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## Unreleased

### Added

* Experimantal support for Uranus expedition

## [0.1.1] - 2048-01-12

### Fixed

* Reprogrammed HAL 9000 not to browse reddit

## [0.1.0] - 2048-01-06

### Added

* Autopilot humming sounds

### Changed

* Windshield wipers move 10% faster

### Fixed

* Windows updates no longer restart the ship's engines (#42)
```

How not to write a changelog: https://github.com/nodejs/node/blob/v2.5.0/deps/npm/CHANGELOG.md

All versions have to be present in the changelog.
Decide on the format of the changelog you'll use and be consistent. Use
a neutral tone, and exercise brevity. A long list of helpful tips can be
found at [keepachangelog.com][keepachangelog].

> Don't just dump your git log, or use scripts to generate changelog entries it for you


#### Release Signing

This way, your users can verify that the release has been approved by the core 
maintainers of the project.

##### Suggestion

Make sure to gpg sign your release tags.

```elixir
git tag -s -a 'v1.4.2'
```

Additionally, for GitHub you can create signed releases using this [guide][debian-gpg-sign].
Signed commits are marked as `verified` on GitHub:


![signed_commit](/images/posts/github_signed_release.png)

Use the following command to have commits gpg signed by default:

```elixir
git config --global commit.gpgsign true
```

## Further Reading

* [ZeroMQ - Collective Code Construction Contract][zeromq-c4]
* [Linux Foundation - Best Practices Criteria for FLOSS][linux-floss-criteria]
* [Social Architecture - Peter Hintjens][hintjens-social-arch]

You can also find a raw markdown version of the guidelines [here][guidelines-raw].

Feel free to make reading suggestions and comments on the [reddit post][reddit-post]
or [Hacker News][hn-post].

[oss-watch]: http://oss-watch.ac.uk/resources/releasemanagementbestpractice
[apache-releases]: http://www.apache.org/dev/#releases
[apache-package-signing]: http://www.apache.org/dev/release-signing.html#keys-policy
[debian-maint-guide]: https://www.debian.org/doc/manuals/maint-guide/
[choosealicense]: http://choosealicense.com/
[tldr-permissive]: https://tldrlegal.com/license/mit-license
[mit-license]: https://tldrlegal.com/license/mit-license
[freebsd-license]: https://tldrlegal.com/license/bsd-2-clause-license-(freebsd)
[packagejson-license]: https://docs.npmjs.com/files/package.json#license
[gemspec-license]: http://guides.rubygems.org/specification-reference/#license=
[projectclj-license]: https://github.com/technomancy/leiningen/blob/master/sample.project.clj#L31
[git-annotated-tag]: https://git-scm.com/book/en/v2/Git-Basics-Tagging#Annotated-Tags
[github-releases]: https://help.github.com/articles/about-releases/
[netiquette]: https://www.ietf.org/rfc/rfc1855.txt
[github-contributing]: https://help.github.com/articles/setting-guidelines-for-repository-contributors/
[rails-contributing]: https://github.com/rails/rails/blob/master/CONTRIBUTING.md
[atom-contributing]: https://github.com/atom/atom/blob/master/CONTRIBUTING.md
[kitto-contributing]: https://github.com/kittoframework/kitto/blob/master/CONTRIBUTING.md
[kitto-releases]: https://github.com/kittoframework/kitto/releases.atom
[keepachangelog]: http://keepachangelog.com/en/0.3.0/
[debian-gpg-sign]: https://wiki.debian.org/Creating%20signed%20GitHub%20releases
[zeromq-c4]: https://rfc.zeromq.org/spec:42/C4/
[linux-floss-criteria]: https://github.com/linuxfoundation/cii-best-practices-badge/blob/master/doc/criteria.md
[hintjens-social-arch]: https://www.gitbook.com/book/hintjens/social-architecture
[guidelines-raw]: https://gist.github.com/Zorbash/4003bc10f0ac0abb8890b11e045d9d69
[hn-post]: https://news.ycombinator.com/item?id=13445370
[reddit-post]: https://www.reddit.com/r/programming/comments/5p5axf/software_packaging_guidelines/

+++
author = "Dimitris Zorbas"
date = "2022-06-14"
draft = false
title = "ElixirConf.EU 2022"
image = "/images/posts/elixirconfeu2018/logo.png"
tags = ["conference", "erlang", "elixir", "london"]
comments = true
share = true
+++

This year's ElixirConf marks Elixir's 10th birthday, in the rest of this
post I'm sharing my experience of what took place this time.

<!--more-->

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Started from the bottom now we’re here! <br>It has already been 10 years since the first <a href="https://twitter.com/hashtag/Elixir?src=hash&amp;ref_src=twsrc%5Etfw">#Elixir</a> commit. <br>Let’s look back at the Elixir timeline with <a href="https://twitter.com/josevalim?ref_src=twsrc%5Etfw">@Josevalim</a> <a href="https://t.co/UWjuPKlnVF">pic.twitter.com/UWjuPKlnVF</a></p>&mdash; ElixirConf Europe (@ElixirConfEU) <a href="https://twitter.com/ElixirConfEU/status/1534860412725903361?ref_src=twsrc%5Etfw">June 9, 2022</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

## Location

I happen to live in London so this was my first ElixirConf on European
(geographically speaking) soil where I didn't have to pack my bags. I'd
never been in West Brompton though and I had the chance to experience
some of the local pubs. It was surprisingly sunny during both days of
the conf but we didn't get to enjoy that.

## Conference - Day 1

### Keynote - Celebrating the 10 Years of Elixir - [José Valim][profile-Jose-Valim]

In this talk, José talked about the future of the language. He started
with an intend to address "the elephant in the room" which he said is
adding types to the language. We were asked to vote by raising hands
whether we'd welcome types, reject them or "trust the core team". The
majority would welcome them. He went into detail about certain areas
like performance, documentation / developer experience, code
maintanance, specification, design tooling and proofs where types can
potentially bring improvements to the language.

A PhD scholarship was also announced to research and develop
set-theoretic types for Elixir ([announcement][types-announcement]).
[This publication][types-paper] by [Giuseppe Castagna][castagna] supervising this project is an
interesting read.

Besides types, other future areas of focus are the developer and
learning experience, where Dashbit has hired Lukasz Samson to work on
IDEs and machine learning where he shared [live_onnx][live_onnx] as an
example of how easy it to build an [Axon][axon]-powered application
which runs on the GPU with a LiveView UI.

### Building a Block-Based Editor in Phoenix LiveView - [Nikola Begedin][profile-nikola]

Nikola walked us through the challenges he faced developing a
block-based WYSIWYG editor using LiveView.

Thankfully it's open-source so you can take a gander [here][philtre].
The highlight of this talk is how a comprehensive test suite powered by
[Cypress][cypress] helped him iron out the kinks of contenteditable and
other browser quirks.

### Get Your CRUD Together - [Andrew Ek][profile-ek]

This was Andrew's take on making CRUD with Phoenix a bit more.. omakase
by creating a dedicated Repo abstraction. With this meta-programming
contraption, contexts behave a bit more like ActiveRecord models where
you get a whole bunch of ready-to-use functions for data retrieval,
validation and the rest.

The general notions where:

* Separate book-keeping from business logic
* Prefer consistent representations (within a context) where possible
* Structs, aggregates and the "Repo" pattern help build consistency
* Don't be afraid to normalize your database
* Be mindful of performance versus speed of delivery

This talk was through Zoom. I have to admit it's a first for me, working
from home the last few years, going to a conference venue only to "join" a remote call, watching it on the big
screen. We live in the age of remote work, we should embrace it even
if it feels a tad bizarre.

### Observable Elixir - [Bernardo Amorim][profile-amorim]

One of my favourite talks this year. Oh boy does he speak fast, how
fast though? _if only there was telemetry for that 😅_


He started the talk with essential terms about observability relevant to
telemetry.

> Observability is a measure of how well internal states of a system can be
> inferred from knowledge of its external outputs.


Go ahead, set up [OpenTelemetry][opentelemetry] for your app today!

Start with:

```elixir
def deps do
  [
    {:opentelemetry, "~> 1.0"},
    {:opentelemetry_exporter, "~> 1.0"},
    {:opentelemetry_phoenix, "~> 1.0"},
    {:opentelemetry_ecto, "~> 1.0"},
    {:opentelemetry_tesla, "~> 2.0"}
  ]
end
```

Thankfully the slides of the talk are available [here][amorim-slides] as well as the demo
app [here][amorim-demo] so you can use them as a guide to complete the setup.

### Why Is My LiveView Slow and What can I Do About It? - [De Wet Blomerus][profile-blomerus]

This talk is surfacing the differences when it comes to debugging of
"traditional" SPA applications compared to LiveView. With LiveView, one
has to closely monitor the data exchange through a WebSocket. There was
a live demo which wasn't working on Safari and we found out that fly.io
sets by default a concurrency limit of 25 simultaneous connections,
dropping connections past that. Such surprises made the debugging aspect
of the talk more realistic!

The code for the application shown as part of this talk can be found
[here][speedy] and the live demo is still available [speedy.fly.dev](https://speedy.fly.dev/).

### A Blueprint for Intuitive Internal Elixir Ecosystems - [Ryan Young][profile-young]

A very insightful talk with actionable suggestions that can overall
improve team communication and aid Elixir adoption.

Key takewaways:

<details>
  <summary>Set up a software catalog</summary>

  With a service catalog like Spotify's [Backstage](https://backstage.io/)
  discovering libraries and services can be much easier. It also
  provides quick shortcuts to bootstrap new projects.
</details>

<details>
  <summary>Set up a package registry</summary>

  Ryan said setting up [urepo][urepo] for for Hex package hosting was a
  key catalyst and in a short period of time more and more engineers
  published their packages. It's also serves as a convenient way to host
  Hex Docs.

  There was a question from the audience about the advantages of a
  private package registry compared to let's say pointing to a git SHA
  or tag. With the registry, mix can tell us whether a newer version is
  available.
</details>

<details>
  <summary>Streamline publishing documentation</summary>

  [urepo][urepo] also serves as a convenient way to host Hex Docs.
  Making it straightforward for engineers to read the documentation of a
  package gives a significant velocity boost to teams and minimises
  integration errors.
</details>

Watch a clip of what Ryan has built [here][ryan-demo].

And here's a photo Ryan shared (_yay, I'm in the audience_).

![ryan young](/images/posts/elixirconfeu2022/ryan_young.jpeg)

Related resources

* https://dashbit.co/blog/mix-hex-registry-build
* https://hex.pm/docs/self_hosting
* https://github.com/kobil-systems/repo

### Keynote: Sonic Pi - Past, Present & Future - [Sam Aaron][profile-aaron]

Incredible, awe-inspiring talk. What a legend. Without showing a single line of Elixir or a slide
he showed what makes an Alchemist, to have a hacker spirit and bring positive change. Sonic Pi started out as an
educational tool to teach programming to kids through music production.
It has evolved to a whole ecosystem where professional DJs and amateurs
experiment with ways to express themselves through music. It doesn't
require any music training or solid computer science fundamentals. It's
easy to install on Windows, MacOs or Linux and it's so much fun!

Try it out today: [sonic-pi][sonic-pi] and please consider supporting
Sam on [patreon](https://www.patreon.com/samaaron) so he can keep
developing this excellent piece of software.

He also spoke about the technical challenges of running multiple blocks
concurrently synchronising them and even linking a Sonic Pi instance to
external programs like Ableton or other Sonic Pi instances on the
internet. Really cool stuff.

The cherry on the cake is the possibility to embed LiveView apps in
Sonic Pi (experiment) to be used as controls, visualisations etc.

![sam aaron](/images/posts/elixirconfeu2022/sam_aaron.jpg)

### The Party

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Great first day of <a href="https://twitter.com/ElixirConfEU?ref_src=twsrc%5Etfw">@ElixirConfEU</a>. Fantastic closing keynote from <a href="https://twitter.com/samaaron?ref_src=twsrc%5Etfw">@samaaron</a>, followed by live music/coding session!<br><br>Thanks to the organizers for a great 10 years of Elixir party! <a href="https://t.co/SrO4Z3DNVx">pic.twitter.com/SrO4Z3DNVx</a></p>&mdash; José Valim (@josevalim) <a href="https://twitter.com/josevalim/status/1534968139565383680?ref_src=twsrc%5Etfw">June 9, 2022</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

Sam Aaron on the decks. Yes, you can book him for your party!

## Conference - Day 2

### Automating the Automator - [Tonći Galić][profile-tonci]

The slides of the talk are available online [here][tonci-talk].

He told us how once, he managed to automate his job to an extend where
he was let go.

In his talk, he scoped automations to "codemods", tools which work by
converting the source code to AST form, modifying it and saving updated
source code file.

Some recent changes in Elixir 1.13 make this process much easier:

* [Code.string_to_quoted_with_comments/2](https://hexdocs.pm/elixir/1.13.0/Code.html#string_to_quoted_with_comments/2)
* [Code.quoted_to_algebra/2](https://hexdocs.pm/elixir/1.13.0/Code.html#quoted_to_algebra/2)

His very promising plan is to create a Credo plugin using [sourceror][sourceror] to provide
functionality similar to [Rubocop](https://github.com/rubocop/rubocop)'s `--auto-correct` .

**Related Links**

* [doorgan/sourceror](https://github.com/doorgan/sourceror)
* [Arjan Scherpenisse - The problems with the standard Elixir AST](https://www.youtube.com/watch?v=aM0BLWgr0g4&t=117s)

_The [Hydra](https://hades.fandom.com/wiki/Bone_Hydra) from [Hades](https://en.wikipedia.org/wiki/Hades_(video_game)) in one
of the slides was a nice touch._

### Exploring Elixir Project Re-compilation - [Anton Satin][profile-satin]

Notes (copied from the final slide):

* It's easier to prevent cascade recompilation than to fix it. Elixir and Phoenix help with that.
* There could be low hanging fruits in your app:
  - Compile dependencies are the main culprit
  - Cycles are worth checking
* Looking at dependencies gives us new perspective

### Distributing Work With Queues and GCP PubSub - [Johanna Larsson][profile-larsson]

Working with Airline XML APIs that are allegedly impossible to cache seems
very challenging.

They picked GCP PubSub because it ticked the following boxes:

* Topics
* Subscriptions
* Filtered subscriptions
* Auto clean up
* Pull based API (Long polling)
* Push based API
* Managed
* Message acknowledgement deadlines

She also mentioned an issue they faced with [Broadway][broadway] and
long-lived worker processes where memory wasn't being garbage collected.
_I think_ they solved it by hibernating the processes.

### Micro-Services and Events: Friends of Foes? - [Roland Tritsch][profile-roland]

Their architecture diagram:

![community](/images/posts/elixirconfeu2022/arch.png)

Lessons Learned:

* Exactly-once is hard
  - At-least once is much easier
  - At-most once is even easier, but ... no eventual consistency
  - At-least once it is (just make sure your services can deal with duplicated events)
* Daily replays to the rescue
  - Constantly proof the availability/consistency of the event-store
  - Makes the system self-healing
* One more (un-expected operations) benefit: Outage analysis and outage repair!

### TypeCheck - Effortless Runtime Type-Checking [Marten (W-M) Wijnja / Qqwy][profile-wijnja]

He spoke about [TypeCheck](https://github.com/Qqwy/elixir-type_check) a
library for runtime type-checks.

He highlighted some of the common _similar_ tools like [Dialyzer][dialyzer] and [Gradualizer][gradualizer].

Pros:
  * Checks (using the typespecs) for common mistakes
  * Runs statically

Cons:
  * Misses common mistakes (false negatives)
  * Complains about some OK code (false positives)
  * Slow to run, difficult to understand errors
  * Opt-in

[Gradualizer][gradualizer]: Promising, but experimental

His future plans for this library are:

* Stable release (nearly there)
* Companion libraries
  - type overrides for common libs
    (Phoenix, Ecto, Jason, Decimal, Absinthe, etc)
* Improve efficiency
* Support [PropEr][proper] as well (as [StreamData][streamdata])

## Outro

I wish there was a talk by Chris McCord, I'd love to hear what's cooking for Phoenix.

Missed your chance to attend? Well, there's the [US one](https://2022.elixirconf.com/).

**Spotted a Mistake?**

Please contact me on [twitter][me-twitter], or in the comments, or [submit a PR][blog-repo] for corrections.

[profile-Jose-Valim]: https://twitter.com/josevalimG
[types-announcement]: https://twitter.com/josevalim/status/1535008937640181760
[types-paper]: https://arxiv.org/abs/2111.03354
[castagna]: https://www.irif.fr/~gc/
[live_onnx]: https://github.com/thehaigo/live_onnx
[axon]: https://github.com/elixir-nx/axon
[blog-repo]: https://github.com/zorbash/zorbash.github.com
[profile-nikola]: https://github.com/begedin
[philtre]: https://github.com/begedin/philtre
[cypress]: https://github.com/begedin/philtre/tree/main/cypress
[profile-ek]: https://github.com/andrewek
[profile-amorim]: https://www.bamorim.com/
[amorim-slides]: https://bamorim.github.io/2022-elixir-conf-eu/#7
[amorim-demo]: https://github.com/bamorim/observable-elixir-daily
[opentelemetry]: https://hexdocs.pm/opentelemetry/readme.html
[profile-blomerus]: https://dewetblomerus.com/blog/
[speedy]: https://github.com/dewetblomerus/speedy
[profile-young]: https://www.linkedin.com/in/ryan-young-0366b14/
[urepo]: https://github.com/kobil-systems/urepo
[ryan-demo]: https://twitter.com/ryoung786/status/1535187920138665984
[profile-aaron]: https://github.com/samaaron
[sonic-pi]: https://sonic-pi.net/
[profile-tonci]: https://github.com/Tuxified
[tonci-talk]: https://github.com/Tuxified/elixirconfeu-2022-talk
[sourceror]: https://github.com/doorgan/sourceror
[profile-satin]: https://github.com/antonsatin
[profile-larsson]: https://github.com/joladev
[broadway]: https://github.com/dashbitco/broadway
[profile-roland]: https://tedn.life/
[profile-wijnja]: https://wmcode.nl/
[me-twitter]: https://twitter.com/_zorbash
[proper]: https://github.com/proper-testing/proper
[streamdata]: https://github.com/whatyouhide/stream_data
[gradualizer]: https://github.com/josefs/Gradualizer
[dialyzer]: https://www.erlang.org/doc/man/dialyzer.html

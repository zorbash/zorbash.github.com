+++
author = "Dimitris Zorbas"
date = "2017-09-17"
draft = false
title = "About"
share = true
+++

I'm an Athenian G<s>r</s>eek software engineer who lives in London.
When I'm not busy making stuff, I'm breaking stuff.

My guilty pleasure is that I really enjoy writing quality documentation.

Public Key: B2FC 1D21 EAD4 974E 9139 761C D122 8308 112F 8610

## Contact

* [email](mailto:dimitrisplusplus@gmail.com)
* [keybase](https://keybase.io/zorbash)

## Social

* [My Twitter](https://twitter.com/_zorbash)
* [GitHub](https://github.com/zorbash)
* [Tefter Bookmarks](https://tefter.io/zorbash)
* [Goodreads](https://www.goodreads.com/user/show/13437694-dimitrios)
* [Spotify](https://open.spotify.com/user/1199970281?si=7uPPJY3lQWmT8dAdyvzwSw)
* [Speakerdeck](https://speakerdeck.com/zorbash)

## Topics

* Distributed Systems
* System Architecture
* Functional Programming
* Ruby / Erlang / Elixir / Vim
* Product Building & Project Management

## Projects

### Tefter.io

![tefter-banner](/images/about/tefter_banner1.jpg)

Link: https://tefter.io

Privacy-focused social bookmarking service.

Tech: [Ruby][tags-ruby], [Rails][tags-rails], [Elixir][tags-elixir], React, PostgreSQL, ElasticSearch, Redis

#### Press

* [Interview (in greek) - epixeiro.gr](http://www.epixeiro.gr/article/130218)

### Kitto

![kitto-logo](/images/about/kitto.png)

Link: https://github.com/kittoframework/kitto

A framework to build interactive dashboards.

Featured in:

* [Elixir Digest#70](https://elixirdigest.net/digests/70)

Tech: [Elixir][tags-elixir], React, Webpack

### ObserverLive

<img class="observer_live" src="/images/about/observer_live.png"/>

Link: https://liveview.zorbash.com

A port of [observer_cli](https://github.com/zhongwencool/observer_cli)
using Phoenix's [LiveView](https://github.com/phoenixframework/phoenix_live_view)

Blog posts:

* [observer-live][posts-observer-live]

Featured In:

* [Elixir Mix#54](https://elixirmix.com/54)

Tech: [Elixir][tags-elixir], [Phoenix][tags-phoenix], [LiveView][tags-liveview]

### Sourcery-ci

Link: https://sourcery-ci.org

An app which checks whether an open-source repository conforms to
several release conventions.

Tech: [Elixir][tags-elixir], [Phoenix][tags-phoenix], [WebSockets][tags-websockets], PostgreSQL

### Opus

Link: https://github.com/zorbash/opus

A library for pluggable business logic components in Elixir.

Blog posts:

* [How to create beautiful pipelines on Elixir with Opus - Quiqup Engineering](https://medium.com/quiqup-engineering/how-to-create-beautiful-pipelines-on-elixir-with-opus-f0b688de8994)
* [How I Centralized our Scattered Business Logic Into One Clear Pipeline for our Elixir Webhook Service - Pagerduty](https://www.pagerduty.com/eng/elixir-webhook-service/)
* [A Slack bookmarking application in Elixir with Opus][posts-bookmarks-collaboration]

Tech: [Elixir][tags-elixir]

### ExSchedule

Link: https://github.com/quiqupltd/ex_schedule

A library to run recurring jobs in Elixir.

Tech: [Elixir][tags-elixir]

### Libelection

![libelection-logo](/images/about/libelection.png)

Link: https://github.com/quiqupltd/libelection

Library to perform leader election in a cluster of containerized Elixir nodes.

Tech: [Elixir][tags-elixir]

### sidekiq-dry

Link: https://github.com/zorbash/sidekiq-dry

A Sidekiq middleware to serialize [dry-struct][dry-struct] job arguments.

Blog posts:

* [sidekiq-dry]({{< relref "post/sidekiq-dry.md" >}})

Tech: [Ruby][tags-ruby]

### Bookworm 🪱📚

Link: https://github.com/zorbash/bookworm

A command-line tool for offline access of notes and Kindle highlights.
It also syncs highlights to Notion.

Check out: https://github.com/zorbash/notes for my notes generated using this tool.

Blog posts:

* [Organising Book Highlights and Notes]({{< relref "post/highlights-notes.md" >}})
* [Building an Unusual Pomodoro Timer on Elixir and Nerves]({{< relref "post/elixir-nerves-pomodoro-timer.md" >}})

Tech: [Ruby][tags-ruby]

### Brain 🧠

A smart pomodoro timer with an E Ink screen built with Elixir and Nerves.

Blog posts:

* [Building an Unusual Pomodoro Timer on Elixir and Nerves]({{< relref "post/elixir-nerves-pomodoro-timer.md" >}})

Featured In:

* [Elixir Weekly#311][elixirweekly-311]
* [Elixir Digest#331][elixirdigest-331]
* [Elixir Mix][elixir-mix-brain]

Tech: [Elixir][tags-Elixir], [Nerves][tags-nerves], [Raspberry Pi][tags-raspberry]

### Recyclops (WIP)

I'm building a smart recycling bin (hello 👋 [@internetofshit](https://twitter.com/internetofshit)) which detects recycling labels and
only lets you dispose items only when they're really recyclable.

Tech: [Elixir][tags-elixir], [Nerves][tags-nerves], [Raspberry PI][tags-raspberry], Camera

[tags-elixir]: {{< relref "tags/elixir" >}}
[tags-phoenix]: {{< relref "tags/phoenix" >}}
[tags-websockets]: {{< relref "tags/websockets" >}}
[tags-liveview]: {{< relref "tags/live-view" >}}
[tags-ruby]: {{< relref "tags/ruby" >}}
[tags-raspberry]: {{< relref "tags/raspberry-pi" >}}
[tags-nerves]: {{< relref "tags/nerves" >}}
[dry-struct]: https://dry-rb.org/gems/dry-struct/master/
[elixirweekly-311]: https://sendy.elixir-radar.com/w/Acxn1MQ763LbtJAUE4mVlIqQ/J8921cxQ4jeEDmbVKDWh02aw/LDm8bUHockfgZPxjvskA892Q
[elixirdigest-331]: https://elixirdigest.net/digests/331
[posts-observer-live]: {{< relref "post/observer-live" >}}
[posts-slack_bookmarks_collaboration_elixir]: {{< relref "post/slack-bookmarks-collaboration-elixir" >}}
[elixir-mix-brain]: https://elixirmix.com/personal-brain-with-nerves-and-livebook-dimitri-zorbas


<style>
  img.observer_live {
    height: 325px;
  }
</style>

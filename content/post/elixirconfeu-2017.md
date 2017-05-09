+++
author = "Dimitris Zorbas"
date = "2017-05-08"
draft = false
title = "ElixirConf.EU 2017"
image = "images/posts/elixirconfeu2017/elixirconf3.png"
tags = ["open-source", "conference", "erlang", "elixir", "barcelona"]
comments = true
share = true
+++


I was in beautiful Barcelona for [ElixirConf.EU][ElixirConf.EU-2017] 2017.  
In this post I'm sharing some of my notes and impressions about it.

</br>

<div class="polaroid">
  <img src="/images/posts/elixirconfeu2017/team_quiqup_elixirconf.jpg" class="img-medium" alt="team-quiqup">
  <p>Team Quiqup <small>[Zorbas, Hawkins, Rabe]</small></p>
</div>

</br>


## Tutorials

I attended the tutorial "Microservices under the Umbrella" by [Makis Otman][Profile-Makis-Otman] &
[Georgina McFadyen][Profile-Georgina-McFadyen], both working for [8th Light][8th-Light].

We hacked on code from the following repositories:

* https://github.com/Maikon/elixir_setup
* https://github.com/Maikon/pharos

The was goal to create an umbrella application, going through the pros
and cons of such an architecture. We coded a sub-application to query
the Wikipedia API and cache the results to a GenServer. We wrote tests
and finally used [:rpc.call/4][rpc-call] to call functions on a remote node.

Relevant blog post: https://8thlight.com/blog/georgina-mcfadyen/2017/05/01/elixir-umbrella-projects.html

## Conference - Day 1

### Keynote - [José Valim][Profile-Jose-Valim]

The presentation was about the beginnings of the language, the current state of development and
what to expect in upcoming releases.

#### Highlights

Depression Valley
: The point where no-one is using your language and you're unsure you're
headed in the right direction. 

Lego Lang
: That was the original name of the language in the early days.

Rookie Mistakes
: José said that he made some during the first stages of development.

José stated that he knew the features he wanted to include in the
language, the difficult part was to shape it in a way to make people
productive. Early on, too much `eval` was required to make something
non-trivial.

### A Tour of the Elixir Source Code - [Xavier Noria][Profile-Xavier-Noria]

In this talk Xavier demystified parts of the Elixir compiler.
How code is loaded and compiled, Macros and the AST.

Topics:

* Elixir Project Structure
* What is Elixir written in?
* Compilation
* Parallel Compiler
* Implementation of Protocols

Some little-known facts:

* The Elixir compiler wraps your code in a top-level module.

### Ecto - DBConnection - Ecto's SQL Sandbox - [fishcakez][Profile-John-Fish] (aka John Fish)

Stories behind the implementation of [Ecto SQL Sandbox][Ecto.Adapters.SQL.Sandbox], which is a way
to have concurrent tests against the database.

Highlights

* Using process dictionaries is considered a bad practice but it's fine in
a few occasions. See [example][process-dicts]
* He talked about [Binary Efficiency Guide][Binary-Efficiency-Guide]
* Ecto can't optimise insert queries (probably related to [ecto#179][Ecto-Issues-179])
* Upcoming Ecto@2.2 [Ecto.Adapters.SQL.Stage][Ecto.Adapters.SQL.Stage]

### Machine Learning with Elixir and Phoenix - [Eric Weinstein][Profile-Eric-Weinstein]

The talk was about implementing a neural network on stock market data to predict
prices and act upon them.

* Machine Learning on the BEAM is fun practical and super doable
* I think he used the [neat_ex][neat_ex] package for the neural networks

Little or no code was shown during the talk and I couldn't find the
source in one of Erics' GitHub [repositories][weinstein-repos].


---------------------

## Conference - Day 2

### Always Available - [Claudio Ortolina][Profile-Claudio-Ortolina]

[Slides][Slides-Claudio-Ortolina]

* Use one process per request
* Prevent letting the application to go down, when the database goes down
* Elixir > v1.4 [local registry][registry] can be used to register workers
* Hide implementation details, typespecs can be of help, see example:

```elixir
defmodule Libra.Inspector do
 @type url :: String.t
 @type uuid :: String.t
 @spec process_url(url) :: {:ok, uuid} | {:error, term}
 @spec get_page(uuid) :: {:ok, Libra.Page.t} | {:error, :not_found}
end
```

### GraphQL in Practice - [Bruce Williams][Profile-Bruce-Williams] & [Benjamin Wilson][Profile-Ben-Wilson]

The talk was about using [Absinthe][absinthe-graphql], a GraphQL library
for Elixir.

> GraphQL is not just a frontend technology

* Has an active growing [community][graphql-community] with more than 500 slack members
* A [book][book-graphql-elixir]'s coming soon from the pragmatic programmers
* Absinthe has a way to prevent DoS by complex queries. It performs
  complexity analysis of a query (it even provides a way to supply you own
  algorithm/implementation) and does not execute queries above a
  configurable threshold.

### Closing Keynote - [Chris McCord][Profile-Chris-McCord]

* Open-source is hard. You have to handle all sorts of feedback
* Contexts are application barriers
* Goal of Phoenix@1.2: Distributed applications
* Goal of Phoenix@1.3: Design with intent. You have to think design carefully
* Goal of Phoenix@1.4: Convincing the stakeholders
  - Monitoring & Metrics
  - Health Checks
  - Robust applications in production
  - Insights into running apps
  - "ROFLSCALE" apps

* There are a few agents for [APM][APM] services that can affect the performance of a running app.

Chris announced that there will be a common interface for metric collection. Probably implemented
as a standalone library. Read more [here][phoenix-metrics].

He demoed an [phoenix][phoenix] application feeding gauges in realtime with application metrics. A candidate abstraction
for metrics reporting is the following:

```elixir
defmodule Demo.Metrics do
  import Metrics

  def start_link do
    Metrics.Supervisor.start_link(__MODULE__, [
      gauge(:memory,     every: [1, :second]),
      gauge(:cpu,        every: [1, :second]),
      gauge(:processes,  every: [1, :second]),
      gauge(:memory,     every: [1, :second])
    ])
  end

  ## Gauges

  def memory(state) do
    {:ok, :memsup.get_system_memory_data(), state}
  end

  def cpu(state) do
    {:ok, %{usage: :cpu_sup.util()}, state}
  end
end
```

It's going to be part of the roadmap for [Kitto][kitto] to make it easy to have a dashboard for phoenix metrics, maybe in the
looks of [https://kitto.io/dashboards/jobs][kitto-jobs]

## Highlights

</br>

<div class="polaroid">
  <img src="/images/posts/elixirconfeu2017/elixirconf_music.jpg" class="img-medium" alt="musicians">
  <p>🎷 After Party 👯</p>
</div>

</br>

* There were at least 2 reported laptop thefts, which got me worried
* No water/coffee between the talks
* I had a really interesting discussion with Xavier Noria about handling
  money with Elixir. It seems like the ecosystem needs something like [RubyMoney][RubyMoney].
* I tried [black pudding tapas][black-pudding-tapas]. Unforgettably horrible 🤢.
* I competed in the [ElixirCards][elixircards] tournament! I couldn't get past José Valim though 😀.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">So.. I play against <a href="https://twitter.com/josevalim">@josevalim</a> in the ElixirCards tournament. <a href="https://twitter.com/hashtag/doomed?src=hash">#doomed</a> <a href="https://twitter.com/hashtag/elixirconfeu?src=hash">#elixirconfeu</a> <a href="https://t.co/RRyl8OGzER">pic.twitter.com/RRyl8OGzER</a></p>&mdash; Dimitris Zorbas (@_zorbash) <a href="https://twitter.com/_zorbash/status/860444157231472640">May 5, 2017</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

## Upcoming Elixir Conferences

* [ElixirConf.US][ElixirConf.US]
* [Elixir.LDN][Elixir.LDN]  (I'll definitely attend this one)

[ElixirConf.EU-2017]: http://www.elixirconf.eu/elixirconf2017
[8th-Light]: https://8thlight.com/
[rpc-call]: http://erlang.org/doc/man/rpc.html#call-4
[Ecto.Adapters.SQL.Sandbox]: https://hexdocs.pm/ecto/Ecto.Adapters.SQL.Sandbox.html#content
[Ecto-Issues-179]: https://github.com/elixir-ecto/ecto/issues/179
[Binary-Efficiency-Guide]: http://erlang.org/doc/efficiency_guide/users_guide.html
[Ecto.Adapters.SQL.Stage]: https://github.com/elixir-ecto/ecto/pull/2028
[neat_ex]: https://hex.pm/packages/neat_ex
[weinstein-repos]: https://github.com/ericqweinstein
[Profile-Makis-Otman]: https://twitter.com/MakisOtman
[Profile-Georgina-McFadyen]: https://twitter.com/gemcfadyen
[Profile-Jose-Valim]: https://twitter.com/josevalim
[Profile-Xavier-Noria]: https://twitter.com/fxn
[Profile-Claudio-Ortolina]: https://twitter.com/cloud8421
[Profile-John-Fish]: https://github.com/fishcakez
[Profile-Eric-Weinstein]: https://twitter.com/ericqweinstein
[Profile-Bruce-Williams]: https://twitter.com/wbruce
[Profile-Ben-Wilson]: https://twitter.com/benwilson512
[Profile-Chris-McCord]: https://twitter.com/chris_mccord
[Slides-Claudio-Ortolina]: http://s3.amazonaws.com/erlang-conferences-production/media/files/000/000/623/original/ElixirConfEU_2017_-_Always_Available_-_Claudio_Ortolina.pdf?1493997314
[process-dicts]: https://8thlight.com/blog/georgina-mcfadyen/2017/05/01/elixir-umbrella-projects.html
[book-graphql-elixir]: https://pragprog.com/book/wwgraphql/craft-graphql-apis-in-elixir-with-absinthe
[graphql-community]: http://absinthe-graphql.org/community/
[absinthe-graphql]: http://absinthe-graphql.org/
[phoenix-metrics]: https://groups.google.com/forum/#!msg/phoenix-core/mAQkCIbTC-U/zZ6_iPI2BQAJ;context-place=searchin/phoenix-core/metrics%7Csort:relevance
[elixircards]: http://www.elixircards.co.uk/
[APM]: https://en.wikipedia.org/wiki/Application_performance_management
[ElixirConf.US]: https://elixirconf.com/
[Elixir.LDN]: http://www.elixir.london/
[kitto]: https://github.com/kittoframework/kitto/
[kitto-jobs]: https://kitto.io/dashboards/jobs
[registry]: https://hexdocs.pm/elixir/master/Registry.html
[phoenix]: http://www.phoenixframework.org/
[black-pudding-tapas]: https://www.google.co.uk/search?q=morcilla&tbm=isch
[RubyMoney]: https://github.com/RubyMoney/

+++
author = "Dimitris Zorbas"
date = "2017-08-20"
draft = false
title = "Elixir.LDN 2017"
image = "images/posts/elixirldn2017/logo.png"
tags = ["open-source", "conference", "erlang", "elixir", "london"]
comments = true
share = true
+++


I returned from vacations in beautiful Greece ([Amorgos][amorgos] island 🏝), to
attend [Elixir.LDN-2017][Elixir.LDN-2017] in London.

## General Feeling

The [venue][conf-venue] was at a very convenient location and was well suited for the conference.
I could see many familiar faces and felt like a supercharged edition of the London Elixir meetup.

If you're interested in attending the Elixir London meetups you probably
want to join #london of the [elixir-lang slack][elixir-lang-slack] (get an [invite][elixir-lang-invite]) and 
the [meetup.com group][elixir-london-meetup].

## The Talks

### Keynote - [José Valim][Profile-Jose-Valim] - Elixir 1.5 Update and Q&A

[Video][Video-keynote]

The talk was mostly about Elixir 1.5 features and demystifying the way Elixir files are loaded,
parsed and compiled to BEAM files.

There was a lot of focus on the importance of the introduction of the [Dbgi Chunk][beam_lib-debug_info] in OTP 20 (see
[this PR][otp-pr-1367] and [mailing list discussion][dbgi-mailing-list]).

An example of how it is used can be seen in the code below (found in elixir@1.5.1 [lib/iex/lib/iex/pry.ex][pry.ex-github]):

```elixir
defp fetch_elixir_debug_info_with_fa_check(module, fa) do
  case :code.which(module) do
    beam when is_list(beam) ->
      case :beam_lib.chunks(beam, [:debug_info]) do
        {:ok, {_, [debug_info: {:debug_info_v1, backend, {:elixir_v1, map, _} = elixir}]}} ->
          case List.keyfind(map.definitions, fa, 0) do
            {_, _, _, _} -> {:ok, beam, backend, elixir}
            nil -> {:error, :unknown_function_arity}
          end
        {:ok, {_, [debug_info: {:debug_info_v1, _, _}]}} ->
          {:error, :non_elixir_module}
        {:error, :beam_lib, {:unknown_chunk, _, _}} ->
          {:error, :otp_20_is_required} # TODO: Remove this when we require OTP 20+
        {:error, :beam_lib, {:missing_chunk, _, _}} ->
          {:error, :missing_debug_info}
        _ ->
          {:error, :outdated_debug_info}
      end
    _ ->
      {:error, :no_beam_file}
  end
end
```


This feature enables quicker debugging (see: [stackoverflow-question][so-question] and
related [PR][elixir-plug-pr]) for `IEx`, `Plug`, `ExUnit` and opens a wide spectrum of possibilities, even adding a
full type system in Elixir as José hinted during the Q&A session.

#### Exception.blame

José also talked about the new [Exception.blame/3][Exception.blame/3] function which is capable of
attaching debug information to certain exceptions.

Currently this is used to augment `FunctionClauseErrors` with a summary of all clauses and which parts of clause match and which ones didn’t.

The feature is showcased best by the video below:

<script type="text/javascript" src="https://asciinema.org/a/14.js" data-theme="solarized-dark" id="asciicast-EgQUdDe1CIz90EYYeipiS8jo8" async></script>

#### ElixirScript@0.30.0
José mentioned the release of ElixirScript version 0.30.0 which now
supports compiling Elixir code to JavaScript on the fly. Read the
release notes [here][elixirscript-release-notes].


### [Evadne Wu][Profile-Evadne-Wu] - How to Sell Elixir

[Slides][Slides-Evadne-Wu]
[Video][Video-wu]

The talk was about suggesting the use of Elixir for a system of Faria Education Group where Evadne works
, what it took to convince the management and their story developing it.

Some of the quotes I noted from this talk are:

* When choosing technologies, you're managing risk
* Good technology can't save you from bad specification
* JVM is a good ecosystem to get things done

### [Peter Saxton][Profile-Peter-Saxton] - Working with HTTP/2 in Elixir

[Slides][Slides-Peter-Saxton]
[Video][Video-saxton]

Peter has built an HTTP/2 only server entirely in Elixir. The server is
called [Ace][ace].

Some of the quotes I noted from this talk are:

* Handling binary protocols in Elixir is easy
* Prefer coding library apps where possible
* Don't use `config.exs` for your library apps

Deconstructing HTTP/2 frames from a binary stream:

```elixir
def parse_from_buffer(
  <<
    length::24,
    type::8,
    flags::bits-size(8),
    _R::1,
    stream_id::31,
    payload::binary-size(length),
    rest::binary
  >>, max_length: max_length)
  when length <= max_length
do
  {:ok, {{type, flags, stream_id, payload}, rest}}
end
```

### [Louis Pilfold][Profile-Louis-Pilfold] - Getting Pretty Serious

[Video][Video-lpil]

</br>

<div class="polaroid">
  <img src="/images/posts/elixirldn2017/lpil2.png" class="img-medium" alt="louis pilfold">
  <p>Louis "getting pretty serious"</p>
</div>

</br>

Louis is the author of [exfmt][exfmt] and talked about the differences
between linters and formatters and the difficulties of implementing a
formatter.

He said that he based his algorithm on Philip Wadler's algorithm for
pretty printing (see: [paper][wadler-pp]) and [Inspect.Algebra][hexdocs-inspect-algebra], which is in turn based on
the ["Strictly Pretty" paper][strictly-pretty-linding] by Christian Linding.

There was also a GSoC project for the implementation of a code formatter
for Elixir (see: [here][gsoc-elixir]).

Quotes from the talk:

* Compilers are easy, people are hard
* Adhering to a consistent code style saves you money

I could see that Louis was using the `:Neoformat` command from inside (Neo)Vim to demonstrate exfmt and
luckily there are instructions for integration with Vim [here][exfmt-vim-instructions] 🙌.


### [Georgina McFadyen][Profile-Georgina-McFadyen] - Elixir Umbrella - Microservices or Majestic Monolith?

[Video][Video-mcfadyen]

This was an informative talk about creating, developing and releasing
[umbrella applications][umbrella-apps]. It seemed to me like a condensed version of the
["Microservices under the Umbrella"][microservices-umbrella-link] workshop which I attended at
Elixironf.EU 2017.

She said that you can choose to deploy you application with
[Distillery][distillery] building a release per sub-app, one release
including all sub-apps or you can group sub-apps and release separately.

An interesting question during the Q&A session was if you can nest
umbrella apps where Georgina responded that it's probably not possible
but she hasn't tried it.

In case you didn't know you can scaffold a new umbrella application using:

```shell
mix new some_project --umbrella
```

### [Nikolay Tsvetinov][Profile-Nikolay-Tsvetinov] - How We Created The University Course - Functional Programming With Elixir

Nikolay presented his story teaching Elixir in a functional programming
course at the university of Sofia.

[Slides][slides-meddle]
[Video][Video-tsvetinov]

### [Gary Rennie][Profile-Gary-Rennie] - HTTP/2 Plug to Phoenix, Cowboy too

[Video][Video-Rennie]

Plug is HTTP/1.1 only and developed mostly with the [Cowboy][cowboy] Erlang server
in mind.
Then next major version of Cowboy (2) is soon to be released,
but it has taken a few years. You can read the migration guide [here][cowboy-migration].

Gary did a demo of using Cowboy directly from Elixir and later
one of an HTTP/2 chat service with [Phoenix][phoenix] and [Chatterbox][chatterbox].

### [Péter Gömöri][Profile-Gomori] - Profiling and Tracing for all with Xprof

[Video][Video-gomori]

This talk was about the [Xprof][xprof] tool which is a single-function
profiler aimed for production safety, ideal for immediate visual
feedback and ad-hoc debugging.

It uses ["match_spec"][match_spec] flavored filtering to provide an expressive way to
filter function calls by their usage.

![xprof](/images/posts/elixirldn2017/xprof_resized.png)

#### Q&A Session

Q: Is it safe for production usage?

A: It is meant to be turned on for investigations, not to be constantly
on, just to be safe. It only keeps 1 minute worth of data.

### [Andrea Leopardi][Profile-leopardi] - Stepping into a New Era: Injecting Elixir in an Existing System

[Slides][Slides-leopardi]
[Video][Video-leopardi]

Quotes from the talk:

* Services are good, use the best tool for the job
* Using Elixir in [Football Addicts][football-addicts] was a huge success (perf went ☝️, Resources / Server usage went 👇)

### [Brooklyn Zelenka][Profile-zelenka] - Witchcraft: Monads for the Working Alchemist

[Slides][Slides-zelenka]
[Video][Video-zelenka]

She talked about the [Blub Paradox][blub-paradox], coming from a more powerful language (Haskell), 
she felt the need to make Elixir look more like it.

She authored the following libraries to achieve that:

* [quark](https://github.com/expede/quark)
* [algae](https://github.com/expede/algae)
* [type_class](https://github.com/expede/type_class)
* [witchcraft](https://github.com/expede/witchcraft)

### Lighthing Talks

I can only remember a talk about [elchemy][elchemy] (Elm -> Elixir) by [Krzysztof Wende][wende].

## Highlights

### After Party

</br>

<div class="polaroid">
  <img src="/images/posts/elixirldn2017/after_party_resized.jpg" class="img-medium" alt="elixirldn after-party">
  <p>The venue of the after-party</p>
</div>

</br>


Lot's of amazing conversations which I'm probably still digesting.

## Upcoming Conferences

* [CodeMesh][codemesh] While it's not targeting Elixir specifically, features
  ([Joe Armstrong][armstrong-blog], [Robert Virding][virding-blog], [Fred Herbert][ferd], [Guy L. Steele][guy-steele])
  amongst many others, making the conf profoundly attractive to Erlang / Elixir / Functional Programming engineers.

* For news and announcements about Elixir.LDN follow [@LdnElixir][twitter-elixirldn] on twitter.

[Elixir.LDN-2017]: http://www.elixir.london/
[elixir-lang-slack]: elixir-lang.slack.com
[elixir-lang-invite]: https://elixir-slackin.herokuapp.com/
[elixir-london-meetup]: https://www.meetup.com/Elixir-London
[amorgos]: https://en.wikipedia.org/wiki/Amorgos
[conf-venue]: https://www.etcvenues.co.uk/venues/155bishopsgate
[ferd]: https://ferd.ca/
[armstrong-blog]: http://joearms.github.io/
[virding-blog]: http://rvirding.blogspot.co.uk/
[guy-steele]: https://labs.oracle.com/pls/apex/f?p=labs:bio:0:120
[Profile-Jose-Valim]: https://twitter.com/josevalim
[so-question]: https://stackoverflow.com/questions/44087086/how-to-debug-quickly-in-phoenix-elixir
[elixir-plug-pr]: https://github.com/elixir-plug/plug/issues/552
[otp-pr-1367]: https://github.com/erlang/otp/pull/1367/files
[dbgi-mailing-list]: http://erlang.org/pipermail/erlang-questions/2017-March/091883.html
[beam_lib-debug_info]: http://erlang.org/doc/man/beam_lib.html#type-debug_info
[pry.ex-github]: https://github.com/elixir-lang/elixir/blob/v1.5.1/lib/iex/lib/iex/pry.ex#L306
[Exception.blame/3]: https://hexdocs.pm/elixir/master/Exception.html#blame/3
[elixirscript-release-notes]: https://elixirscript.github.io/post/elixirscript-0.30.0-released/
[Profile-Evadne-Wu]: https://twitter.com/evadne
[Slides-Evadne-Wu]: https://speakerdeck.com/evadne/how-to-sell-elixir
[Slides-Peter-Saxton]: http://crowdhailer.me/talks/2017-08-17/working-with-http2-in-elixir/slides.html#1
[Profile-Peter-Saxton]: http://crowdhailer.me/
[ace]: https://github.com/CrowdHailer/Ace
[Profile-Louis-Pilfold]: https://twitter.com/louispilfold
[exfmt]: https://github.com/lpil/exfmt
[exfmt-vim-instructions]: https://github.com/lpil/exfmt#vim
[gsoc-elixir]: https://summerofcode.withgoogle.com/projects/?sp-page=2#5205518009237504
[wadler-pp]: https://homepages.inf.ed.ac.uk/wadler/papers/prettier/prettier.pdf
[hexdocs-inspect-algebra]: https://hexdocs.pm/elixir/Inspect.Algebra.html
[strictly-pretty-linding]: http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.34.2200
[codemesh]: http://www.codemesh.io/
[Profile-Georgina-McFadyen]: https://twitter.com/gemcfadyen
[microservices-umbrella-link]: {{< relref "post/elixirconfeu-2017.md#tutorials" >}}
[umbrella-apps]: https://elixir-lang.org/getting-started/mix-otp/dependencies-and-umbrella-apps.html
[distillery]: https://github.com/bitwalker/distillery
[slides-meddle]: https://gitpitch.com/meddle0x53/elixir_ldn_2017
[Profile-Nikolay-Tsvetinov]: https://twitter.com/ntzvetinov
[Profile-Gary-Rennie]: https://twitter.com/TheGazler
[cowboy]: https://github.com/ninenines/cowboy
[cowboy-migration]: https://github.com/ninenines/cowboy/blob/master/doc/src/guide/migrating_from_1.0.asciidoc
[phoenix]: http://phoenixframework.org/
[chatterbox]: https://github.com/joedevivo/chatterbox
[elchemy]: https://github.com/wende/elchemy
[wende]: https://github.com/wende
[Profile-Gomori]: https://github.com/gomoripeti
[xprof]: https://github.com/Appliscale/xprof
[match_spec]: http://erlang.org/doc/apps/erts/match_spec.html
[Profile-leopardi]: https://twitter.com/whatyouhide
[Slides-leopardi]: https://speakerdeck.com/whatyouhide/stepping-into-a-new-era-injecting-elixir-in-a-ruby-app
[football-addicts]: https://www.footballaddicts.com/
[Profile-Zelenka]: https://twitter.com/expede
[Slides-zelenka]: https://www.slideshare.net/BrooklynZelenka/witchcraft-78939455
[blub-paradox]: https://en.wikipedia.org/wiki/Paul_Graham_(computer_programmer)#The_Blub_paradox
[Video-lpil]: https://www.youtube.com/watch?v=g4HXeP_CZbc
[Video-zelenka]: https://www.youtube.com/watch?v=psdG5iV57q0
[twitter-elixirldn]: https://twitter.com/LdnElixir
[Video-saxton]: https://www.youtube.com/watch?v=zqzkrUVfv-k
[Video-wu]: https://www.youtube.com/watch?v=YviCIOT7C6I
[Video-Rennie]: https://www.youtube.com/watch?v=R5xTuw7NYg8
[Video-keynote]: https://www.youtube.com/watch?v=p4uE-jTB_Uk
[Video-leopardi]: https://www.youtube.com/watch?v=5EDD1oZ23tY
[Video-mcfadyen]: https://www.youtube.com/watch?v=QJ3tDAdTjPI
[Video-gomori]: https://www.youtube.com/watch?v=AAXtjPiXbWE
[Video-tsvetinov]: https://www.youtube.com/watch?v=cKfme8i_nO0

<style>
.main-header {
  background-size: contain;
}
</style>

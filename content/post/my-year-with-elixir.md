+++
author = "Dimitris Zorbas"
date = "2016-12-22"
draft = false
title = "My year with Elixir"
image = "images/posts/elixir-horizontal.png"
tags = ["elixir", "kitto", "functional-programming"]
comments = true
share = true
+++

I started fiddling with Elixir about 1.5 year ago. Today I feel like sharing my 
experience with the language.

I've been coding with Ruby for the past 5 years (mostly around the Rails
ecosystem) and I try to learn a new programming language every year.

> 2016 is definitely the year of Elixir for me.

My original curiosity for the language, unfolded to a quest to learn about
distributed applications following the path of Erlang.

</br>

<div class="polaroid">
  <img src="http://i.imgur.com/n3CIYyt.jpg" class="img-medium" alt="oz">
  <p>Fellow Alchemists marching to the land of OTP</p>
</div>

</br>

## Why Elixir

My first experience with Elixir came when at [work](http://skroutz.gr) my team was
looking for a web application framework to receive enormous
loads of Analytics traffic (see related [analytics-blogpost][analytics-blogpost]).

We investigated many options in nodejs, Erlang, Clojure and Ruby.
We ended up using [Goliath][goliath], an [Event-Machine][eventmachine] based web server
framework in Ruby for team productivity reasons (team consisted of .


Upon considering Erlang and [Chicago Boss][chicago-boss], I also
found out about Elixir and Phoenix (which was just released at the time) and both caught my eye.

### First Thoughts

The first things that came to my mind, initially fiddling with Elixir were:

* Oh it looks a lot like Ruby, neat!
* How can I define a class? What do you mean there are no classes here?!
* Does everything have to be so explicit? Why do I have to alias all the things?
* The REPL (iex) does not keep history? Are you kidding me?
* Seems like a trap for rubyists to adapt to functional programming practices

So why did I invest my time trying to master it?

Well, [José Valim][valim] has made tremendous efforts in organising and maintaining a healthy
community around the language.

A lot of renowned rubyists have acknowledged the struggle to mend the things ruby is bad at.
[José][valim] has created an evolved ruby, a new language, which is so new yet
already feels mature and practical.

I bet on the future of Elixir not only because of the features, but
because I can see others share the same enthusiasm as mine, cooperating
in harmony on open-source projects of the ecosystems, __being nice__ to each
other. The github repo of the language already has almost 500
contributors, that's incredible.

### Features

I'm pretty sure others have covered the features of the language in
great detail, if you haven't read ["why Elixir"][why-elixir] by [Saša Jurić][juric],
I wholeheartedly tempt you to give it a look.

Elixir runs on the Erlang VM and integrates beautifully with [OTP][otp]
which is trusted by many companies to build resilient, performant, distributed applications.

For those unfamiliar with OTP, it's a development environment for
concurrent programming, featuring:

* The Erlang interpreter and compiler
* Erlang standard libraries
* [Dialyzer][dialyzer], a static analysis tool
* [Mnesia][mnesia], a distributed database
* Erlang Term Storage (ETS), an in-memory database
* A debugger
* [Observer][observer], a GUI with information about characteristics of the system
* An event tracer
* A release-management tool

Elixir applications are meant to be build upon the principles of Erlang:
<img src="http://i.imgur.com/rv6a5zV.jpg" alt="trinity">

It's an expressive language, easily extensible using hygienic [macros][macros].  
Defining a parallel map function is as simple as:

```elixir
defmodule Parallel do
  def pmap(collection, func) do
    collection
    |> Enum.map(&(Task.async(fn -> func.(&1) end)))
    |> Enum.map(&Task.await/1)
  end
end
```

_(snippet taken from [elixir-recipes][elixir-recipes])_

Elixir focuses on the points where Ruby arguably is lacking more, having a homey
syntax for rubyists (compared to Erlang).

I also find it important that Elixir ships with a build tool (Mix), a
testing framework (ExUnit) and offers intuitive [interoperability] with Erlang.

### Community

The community is amazing. We call ourselves alchemists and I really like
the mystery vibes around the name.

#### Elixir Hubs

* https://elixirforum.com/
* https://www.reddit.com/r/elixir/
* http://elixir-lang.slack.com/

On all the above platforms, I found people to be responsive to
questions, nice and talkative. The community seems to be blooming, slack
has already more than 11.000 members with ~1000 of them active at any time.

### Pattern Matching

Elixir makes pattern matching more approachable.

As stated in [Introduction to Functional Programming (1992)][introduction-fp]

> Pattern matching is one of the cornerstones of an equational style of
> definition; more often than not it leads to a cleaner and more readily understandable
> definition than a style based on conditional equations.
> (...) it also simplifies the process of reasoning formally about functions.

Since most people are familiar with equational style of definition from math,
pattern matching seems like the natural way to adapt from math to programming.

### My Progress so far

* Solved some [adventofcode][adventofcode] exercises using Elixir to familiarize myself more
* Read [Introducing Elixir][introducing-elixir]
* Wrote an API client for work [skroutz.ex][skroutz.ex])
* Talked about Elixir at [Athens Ruby Meetup][ruby-meetup] ([presentation][elixir-presentation])
* Been at Elixir meetups in Berlin and London
* Read [Programming Elixir][programming-elixir]
* Created and maintain [Kitto][kitto] and open-source framework to create dashboards
* Read [Elixir in Action][elixir-in-action]
* Read [Metaprogramming Elixir][metaprogramming-elixir]
* Read [Concurrent Programming in
  ERLANG][concurrent-programming-erlang]
* Read [programming phoenix][programming-phoenix]

## Next steps

* Finish reading [The Little Elixir & OTP Guidebook][elixir-otp-guidebook]
* Dive in deeper in OTP and read more Erlang books
* Give [GenStage][gen_stage] a try
* Improve and extend [Kitto][kitto]
* Blog about [Kitto][kitto] (stay tuned)
* Release a project I'm working on these days (hint: CI for packages), built with Phoenix

Feel free to make reading suggestions and comments on the [reddit post](https://www.reddit.com/r/elixir/comments/5jwxuc/my_year_with_elixir/).

[analytics-blogpost]: https://engineering.skroutz.gr/blog/skroutz-analytics/
[goliath]: https://github.com/postrank-labs/goliath
[kitto]: https://github.com/kittoframework/kitto
[valim]: https://github.com/josevalim
[otp]: https://github.com/erlang/otp
[skroutz.ex]: https://github.com/skroutz/skroutz.ex
[elixir-presentation]: https://speakerdeck.com/zorbash/lets-talk-about-elixir
[introducing-elixir]: https://www.goodreads.com/book/show/18194084-introducing-elixir
[programming-elixir]: https://www.goodreads.com/book/show/17971957-programming-elixir
[elixir-in-action]: https://www.goodreads.com/book/show/20524444-elixir-in-action
[metaprogramming-elixir]: https://www.goodreads.com/book/show/20524444-elixir-in-action
[concurrent-programming-erlang]: https://www.goodreads.com/book/show/808815.Concurrent_Programming_ERLANG
[programming-phoenix]: https://www.goodreads.com/book/show/26871792-programming-phoenix
[elixir-otp-guidebook]: https://www.goodreads.com/book/show/25563811-the-little-elixir-otp-guidebook
[introduction-fp]: https://www.amazon.com/dp/0134841972
[interoperability]: http://elixir-lang.org/getting-started/erlang-libraries.html
[elixir-recipes]: http://elixir-recipes.github.io
[macros]: http://elixir-lang.org/getting-started/meta/macros.html
[elixir-contributors]: https://github.com/elixir-lang/elixir/graphs/contributor://github.com/elixir-lang/elixir/graphs/contributors
[gen_stage]: https://github.com/elixir-lang/gen_stage
[eventmachine]: https://github.com/eventmachine/eventmachine
[ruby-meetup]: https://www.meetup.com/Athens-Ruby-Meetup/
[why-elixir]: http://theerlangelist.com/article/why_elixir
[juric]: https://github.com/sasa1977
[adventofcode]: https://adventofcode.com/
[dialyzer]: http://learnyousomeerlang.com/dialyzer
[mnesia]: https://elixirschool.com/lessons/specifics/mnesia/
[observer]: http://elixir-lang.org/getting-started/mix-otp/supervisor-and-application.html#observer
[chicago-boss]: http://chicagoboss.org/

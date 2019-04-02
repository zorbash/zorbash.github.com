+++
author = "Dimitris Zorbas"
date = "2019-04-02"
draft = false
title = "Observer Live"
image = "images/posts/observer_live/logo.png"
tags = ["open-source", "elixir", "phoenix", "live-view"]
comments = true
share = true
+++

Yesterday I published a demo of my port of [observer_cli][observer_cli] using [LiveView][liveview].
It took me a few of minutes to familiarise myself with this new web
development concept. The docs are clear, accurate and provide a very smooth
introduction to the capabilities of this interactive server-side
rendering way of doing things. I have to say that I'm really impressed 🙂.

You can try the demo yourself [here][demo].

Or.. see this gif.

<img src="/images/posts/observer_live/observer_live.gif" class="img-observer" alt="ravioli">

### observer_cli

It's one of my favourite hex packages. It can be very helpful to
diagnose problems on a running node visually. It uses the excellent
[:recon][recon] library under the hood. If you're more interested in tracing,
have a look at some previous posts:

* [Debugging Elixir Applications][debugging-elixir-applications]
* [Phoenix WebSockets Under a Microscope][phoenix-websockets-under-a-microscope]

### Next Steps

The port is ~40% done at this point and a few people have already
expressed their desire to contribute on Twitter.
I'll make sure to shape a roadmap in the form of GitHub issues.
If there are people out there who'd like to use this for their apps from a package,
please let me know in the comments or Twitter ([_@zorbash][twitter-me]). Not quite
sure how to package a live view yet 😬.

### Opus

Can't wait to use it in [Opus][opus] to finally build some interactive
visualisation of the pipelines graph and live tracing using the
instrumentation.

### Thanks

I want to thank Chris McCord and all the contributors for bringing
such a fantastic idea to life. It never ceases to amaze me how the
phoenix framework team consistently delivers such refreshing features
without sacrificing stability, performance or developer happiness.


Next week I'll be at ElixirConf EU, come talk to me about LiveView and
the stuff you're building using it and Elixir in general.

<style>
.main-header {
  background-size: 32% auto;
}

.post-content img.img-observer {
  height: 500px;
}
</style>


[observer_cli]: https://github.com/zhongwencool/observer_cli
[previous-post]: {{< relref "post/debugging-elixir-applications.md" >}}
[recon]: http://ferd.github.io/recon/
[debugging-elixir-applications]: {{< relref "post/debugging-elixir-applications.md" >}}
[opus]: https://github.com/zorbash/opus
[liveview]: https://github.com/phoenixframework/phoenix_live_view
[demo]: https://liveview.zorbash.com
[phoenix-websockets-under-a-microscope]: {{< relref "post/phoenix-websockets-under-a-microscope.md" >}}
[twitter-me]: https://twitter.com/_zorbash


+++
author = "Dimitris Zorbas"
date = "2019-06-08"
draft = true
title = "Building a Smart Recycling Bin"
image = "images/posts/elixirconfeu2018/logo.png"
tags = ["iot", "nerves", "elixir", "raspberry pi", "recycling"]
comments = true
share = true
+++

I decided to finally build something useful 😀 which might benefit
others, non-tech people and the environment.
My idea is to have a recycling bin which only opens when the item to be
binned is recyclable. It scans recycling labels or tries to identify is
the item is dirty.

I named this project "Recyclops" and I need a logo.

## Step 1 - Setting Up Nerves

I decided to use a raspberry pi 2 I had sitting in a drawer for quite
some time. I followed the "getting started" guide
(https://hexdocs.pm/nerves/getting-started.html).

So I did:

```elixir
mix archive.install hex nerves_bootstrap
export MIX_TARGET=rpi2
mix nerves.new recyclops
```

The I configured it to connect to my home's wifi:

```elixir
config :nerves_init_gadget,
  mdns_domain: "recyclops.local",
  node_name: node_name,
  node_host: :mdns_domain,
  ifname: "wlan0",
  address_method: :dhcp

# Configure wireless settings

config :nerves_network, :default,
  wlan0: [
    ssid: System.get_env("NERVES_NETWORK_SSID"),"zhome_api1",
    psk: System.get_env("NERVES_NETWORK_PSK"),
    key_mgmt: String.to_atom(System.get_env("NERVES_NETWORK_KEY_MGMT"))
  ]
```

Then I assembled a release

```
mix nerves.release.init
```


<style>
.main-header {
  background-size: 32% auto;
}

.highlight {
  line-height: 20px;
}
</style>

[ElixirConf.EU-2019]: http://www.elixirconf.eu
[ElixirConf.US]: https://elixirconf.com/
[profile-Jose-Valim]: https://twitter.com/josevalim
[profile-mccord]: https://twitter.com/chris_mccord
[blog-repo]: https://github.com/zorbash/zorbash.github.com
[akka]: https://akka.io/
[broadway]: https://github.com/plataformatec/broadway
[discord]: https://blog.discordapp.com/tagged/engineering
[adroll]: https://www.adroll.com/
[forzafootball]: https://www.forzafootball.com/
[broadway-sqs]: https://github.com/plataformatec/broadway_sqs
[broadway-rabbitmq]: https://github.com/plataformatec/broadway_rabbitmq/
[broadway-rabbitmq-blogpost]: http://blog.plataformatec.com.br/2019/04/announcing-the-rabbitmq-connector-for-broadway/
[gausby-blogpost]: https://www.erlang-solutions.com/blog/thoughts-on-elixirconf-eu.html
[tefter-list]: https://www.tefter.io/zorbash/lists/elixirconf-eu-2019
[telnyx]: https://telnyx.com/
[freeswitch]: https://freeswitch.org/confluence/display/FREESWITCH/XML+Dialplan
[profile-Ranelli]: https://twitter.com/renanranelli
[profile-Gausby]: https://twitter.com/gausby
[code-elixir]: https://codesync.global/conferences/code-elixir-ldn-2019/
[tortoise]: https://github.com/gausby/tortoise
[profile-Muskala]: https://twitter.com/michalmuskala
[lokal-brewery]: https://goo.gl/maps/uVuAn53BV4UW4spu7
[muskala-thread-progress]: https://github.com/erlang/otp/tree/master/emulator/internal_doc
[instrs.tab]: https://github.com/erlang/otp/blob/master/erts/emulator/beam/instrs.tab
[preloaded-makefile]: https://github.com/erlang/otp/blob/master/erts/preloaded/src/Makefile
[profile-wijnja]: https://twitter.com/WiebeMarten
[slides-wijnja]: https://slides.com/qqwy/an-adventure-in-distributed-programming#/
[planga]: https://planga.io/
[planga-source]: https://github.com/ResiliaDev/Planga/
[cap-theorem]: https://en.wikipedia.org/wiki/CAP_theorem
[byzantine]: https://en.wikipedia.org/wiki/Byzantine_fault
[delta-crdts]: https://arxiv.org/pdf/1603.01529.pdf
[mnesia]: http://erlang.org/doc/man/mnesia.html
[cassandra]: http://cassandra.apache.org/
[couchdb]: http://couchdb.apache.org/
[riak]: https://riak.com/index.html
[profile-keythley]: https://twitter.com/ChrisKeathley
[slides-keathley]: http://s3.amazonaws.com/erlang-conferences-production/media/files/000/000/936/original/Chris_Keathley_-_Building_Resilient_Systems_with_Stacking.pdf?1556699005
[video-keathley]: https://www.youtube.com/watch?v=lg7M0h9eoug
[video-evadne]: https://www.youtube.com/watch?v=8mXqxBBvNdk
[video-valim]: https://www.youtube.com/watch?v=IzFmNQGzApQ
[profile-keathley]: https://twitter.com/ChrisKeathley
[riak-ecto]: https://github.com/Qqwy/elixir_riak_ecto3
[lasp]: https://lasp-lang.readme.io/
[partisan]: https://github.com/lasp-lang/partisan
[libcluster]: https://github.com/bitwalker/libcluster
[elixirconf-2017]: {{< relref "post/elixirconfeu-2017.md" >}}
[elixirconf-2018]: {{< relref "post/elixirconfeu-2018.md" >}}
[how-complex-systems-fail]: https://web.mit.edu/2.75/resources/random/How%20Complex%20Systems%20Fail.pdf
[erlang-alarms]: http://erlang.org/doc/man/alarm_handler.html
[circuit-breakers]: https://martinfowler.com/bliki/CircuitBreaker.html
[fuse]: https://github.com/jlouis/fuse
[profile-mertens]: https://github.com/mertonium
[profile-de-maio]: https://twitter.com/nirev
[slides-de-maio]: http://s3.amazonaws.com/erlang-conferences-production/media/files/000/000/934/original/Guilherme_de_Maio_-_Ecto_without_SQL.pdf?1556698701
[profile-mccord]: https://twitter.com/chris_mccord
[video-mccord]: https://www.youtube.com/watch?v=8xJzHq8ru0M
[observer-live]: {{< relref "post/observer-live.md" >}}
[liveview-tefter-list]: https://tefter.io/zorbash/lists/phoenix-liveview-examples
[thermostat-demo]: https://phoenix-live-view-example.gigalixirapp.com/thermostat
[telemetry]: https://github.com/beam-telemetry/telemetry
[morphdom]: https://github.com/patrick-steele-idem/morphdom
[liveview-debounce]: https://github.com/phoenixframework/phoenix_live_view/issues/4
[me-twitter]: https://twitter.com/_zorbash
[phoenix-pubsub]: https://github.com/phoenixframework/phoenix_pubsub

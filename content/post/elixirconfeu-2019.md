+++
author = "Dimitris Zorbas"
date = "2019-04-16"
draft = false
title = "ElixirConf.EU 2019"
image = "images/posts/elixirconfeu2018/logo.png"
tags = ["conference", "erlang", "elixir", "prague"]
comments = true
share = true
+++


I was lucky enough to attend [ElixirConf.EU][ElixirConf.EU-2019] for the
third time and in this post I'm sharing some thoughts about the talks I
saw, some of my notes and insights on the future of this community in general.

## Location

I'd never visited Prague before and the conf was an amazing opportunity
to combine business and pleasure. While writing this post though, a week
after, I realised I didn't visit most of the landmarks that I was
planning to. Looks like I was immersed in the vibe of the city and had a
great time there 😀.

</br>

<div class="polaroid">
  <img src="/images/posts/elixirconfeu2019/prague_resized.jpg" class="img-medium" alt="prague">
  <p>View over the Vltava river</p>
</div>

</br>

### The Fun Stuff

In the few nights spent in Prague, I picked out the following places, which I wholeheartedly recommend:

* [Vzorkovna](https://goo.gl/maps/xPKGt8xPzDThoJhw7)
* [Joystick Bar](https://goo.gl/maps/DQ2w4LrYjdyvY4qG8)

Now for the Czech cuisine, I don't remember much, but the bread dumplings (Knedlíky?) and the
guláš were quite tasty. The beer on the other hand didn't match my taste.

### The venue

Spacious, clean and only a short commute from my staying.

## Conference - Day 1

### Keynote - The Road to Broadway - [José Valim][profile-Jose-Valim]

[video][video-valim]

<img src="/images/posts/elixirconfeu2019/broadway_resized.jpg" class="img-medium" alt="valim-broadway"/>

The talk was about [broadway][broadway], a new open source project by Plataformatec aiming
to streamline data processing pipelines.

The presentation started with a short history of steps towards the goal
of making collections from eager -> lazy -> concurrent -> distributed.

Imagine the following:

```elixir
File.stream(path)
|> ...
|> Stream.async()
|> ...
|> Stream.async()
|> ...
|> Stream.run
```

The issues with it are that it's:

* Too manual
* Moving data between processes a lot
* Hard to reason about fault-tolerance

A better abstraction was needed and thus GenStage was born.

It was inspired by [Akka][akka] streams and the Akka team was helpful and
answered many questions.

Some of the companies using GenStage in production:

* [Discord][discord]
* [Adroll][adroll]
* [ForzaFootball][forzafootball]

#### Broadway

Broadway takes the burden of defining concurrent GenStage topologies and provide a simple configuration API that automatically defines concurrent producers, concurrent processing, batch handling, and more, leading to both time and cost efficient ingestion and processing of data. 

Features:

* Back-pressure
* Automatic acknowledgements at the end of the pipeline
* Batching
* Automatic restarts in case of failures
* Graceful shutdown
* Built-in testing
* Partitioning

Coming up:

* Multiple processors
* Metrics and statistics

Surprisingly in the audience 2 or 3 people raised their hands when José
asked who's using Broadway already in production.

Want to contribute? Write a producer.

Available producers:

* [SQS][broadway-sqs]
* [RabbitMQ][broadway-rabbitmq] (also see: [blogpost][broadway-rabbitmq-blogpost])
* (soon) Kafka

#### Q & A

Q. Can I build a producer in another language?

Totally doable as long as there's a API for that external app.

Q. Is there an overlap between Flow and Broadway?

Flow focuses on data aggregation. Broadway is about the individual
messages and not the data as a whole.

I'm really looking forward to use broadway in some project, it might be
the perfect abstraction for some of the problems, I'm solving over and
over from scratch.

Q. Is the goal to replace RabbitMQ or Kafka?

No, it's to work with them and become very good friends

### Rewritting Critical Software in Elixir - [Renan Ranelli][profile-Ranelli]

The talk was a case study of adopting Elixir at [Telnyx][telnyx].
Telnyx aims to be like AWS but for telcos.

<img src="/images/posts/elixirconfeu2019/ranelli_resized.jpg" class="img-medium" alt="ranelli"/>

They went to rewrite a dialplan service which was originally written in
Python to Elixir.

> Python is notoriously harder to scale vertically & horizontally than Elixir

Characteristics of the service:

* Uses [freeswitch][freeswitch] XML to route calls
* Stateless
* Latency sensitive
* Low throughput

The migration to the new Elixir service was challenging, since changes
kept being made in the Python codebase, making it a race for feature
parity.

They approached the problem by routing production traffic to both the
existing Python service and the experimental Elixir one, capturing the
responses and diffing them, to verify compatibility.

They used the responses to automatically generate regression tests.

For them, the experiment was successful as parallelisation was
ridiculously simpler and cheaper with Elixir.

### Tortoise Evolved - [Martin Gausby][profile-Gausby]

This talk was about [Tortoise][tortoise], an MQTT client for Elixir.

<img src="/images/posts/elixirconfeu2019/gausby_resized.jpg" class="img-medium" alt="gausby"/>

MQTT is a lightweight Publish/Subscribe (PubSub) protocol, designed to operate on high-latency networks or unreliable networks. It's commonly used in IoT.

You publish messages in topics. Topics are namespaced using slashes, for
example `ocp-tower/2/temperature`.
A client can subscribe to messages using topic filters.

Example:

Start a connection process:

```elixir
client_id = "toes"
{:ok, pid} = Tortoise.Connection.start_link(
  client_id: client_id,
  server: {Tortoise.Transport.Tcp, host: 'localhost', port: 1833},
  handler: {Tortoise.Handler.Default, []}
)
```

Then publish a message:

```elixir
topic = "ocp-tower/3/temperature"
payload = <<21::float-32>>
Tortoise.publish(client_id, topic, payload, [qos: 0])
```

#### Upcoming Changes

* Tortoise (for MQTT .1.1) is ready for production today
* MQTT will cause some changes to the API
* MQTT 5 support in a branch, kinda works, but needs some time
* Tortoise will drift towards a low-level API to support everything

I wanted to ask, if there's plan for a Broadway producer in Tortoise,
but I completely forgot about it.

### Let there be light - [Michał Muskała][profile-Muskala]

<img src="/images/posts/elixirconfeu2019/muskala_resized.jpg" class="img-medium" alt="muskala"/>

This talk tries to explore the necessary steps for an Erlang application
to boot.

So..

* `./bin/erl` is a sh script, which calls `erlexec`
* `erlexec` calls beam-smp (OTP 21 removed single-threaded implementation)
* `erl_init.c`
  * configures time monitoring for time-warp mode. The BEAM has its own
      way to measure time
  * starts thread progress services (see: [here][muskala-thread-progress])
  * sets the stack size - 1 MB for regular schedulers and 320 KB for dirty schedulers
  * starts a bunch of system processes
* Some essential modules cannot be reloaded and are bootstrapped as
    embedded C arrays. See [preloaded/src/Makefile][preloaded-makefile]
* There's Perl in the codebase, see [instrs.tab][instrs.tab]
* `beam_emu.c`
  * Implements the main process loop
  * A huge-function with goto all over the place
  * Generated from pseudo-C by perl scripts into C with macros on top of macros
  * Implements bytecode different from BEAM files and a translation is
      done by the loader
* There's an undocumented flag `profile_boot`, which profiles the boot operation
* You can do some Ruby-like metaprogramming using `$handle_undefined_function`, but please don't!

#### Key Takeaways

* Many VM services are implemented in Erlang
* Command-line arguments are parsed many times each time an erlang
    program is started (It's 6 may 7 times, I cannot recall exactly)
* Elixir adds layers on top and underneath the OTP boot process
* Lot's of command-line arguments of the VM are not well documented
* It looks like there's a module for everything in OTP

For me this was the most insightful and true talk of the conference. No
marketing talk, not another success story. Digging into the core of the
system, trying to see how it works.
I love code exploration talks. You can learn so much from them.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">My face after <a href="https://twitter.com/michalmuskala?ref_src=twsrc%5Etfw">@michalmuskala</a>&#39;s talk today. <a href="https://twitter.com/hashtag/ElixirconfEU?src=hash&amp;ref_src=twsrc%5Etfw">#ElixirconfEU</a> <a href="https://t.co/HqdHdtUVbN">pic.twitter.com/HqdHdtUVbN</a></p>&mdash; Dimitris Zorbas (@_zorbash) <a href="https://twitter.com/_zorbash/status/1115337936977956864?ref_src=twsrc%5Etfw">April 8, 2019</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

By the way the brewery ([link][lokal-brewery]), where the above photo was taken is awesome.

### An Adventure in Distributed Programming - [Wiebe-Marten Wijnja][profile-Wijnja]

[slides][slides-wijnja]

<img src="/images/posts/elixirconfeu2019/wijnja_resized.jpg" class="img-medium" alt="wijnja"/>

This talk was about [Planga][planga] a chat application and the
challenges they faced building it. The app is [open-source][planga-source].

There were references to:

* The [CAP theorem][cap-theorem]
* The [byzantine generals][byzantine] problem
* Comparison of distributed databases {[Mnesia][mnesia], [Cassandra][cassandra], [CouchDB][couchdb], [Riak][riak]}

Planga's working on an Ecto adapter for Riak, see [here][riak-ecto].

**Remarks**

* Distributed applications are hard
* Elixir makes it reasonably bearable
* Tooling can be (and is being) improved

**Projects to Check out**

* [LASP][lasp] / [Partisan][partisan]
* [Phoenix.PubSub][phoenix-pubsub]
* [libcluster][libcluster]
* [RiakEcto3][riak-ecto]

#### Q & A

Q. CRDTs. How do you use them? Any patterns?

It depends what you're trying to abstract. We use Riak CRDTs which I 
believe use [delta-CRDTs][delta-crdts].

Q. Why did you stop using Mnesia?

The Ecto adapter was far from perfect and also we wanted a DB which
doesn't live in the node.

### Building Resilient Systems with Stacking - [Chris Keathley][profile-keathley]

[slides][slides-keathley]
[video][video-keathley]

<img src="/images/posts/elixirconfeu2019/keathley_resized.jpg" class="img-medium" alt="keathley"/>

Alternate Title: "How to boot your apps correctly"

Definitions:

**Resilience**

An ability to recover from or adjust easily to misfortune or change.

**System**

A group of interacting, interrelated, or
interdependent elements forming a complex whole.

> …complex systems run as broken systems. The system continues to function because it contains
> so many redundancies and because people can make it function, despite the presence of many
> flaws… System operations are dynamic, with components (organizational, human, technical) failing
> and being replaced continuously.

See: [How Complex Systems Fail][how-complex-systems-fail]

<div></div>

> Scaling is a problem of handling failure

This is why Erlang is so good at scale.

> You have to treat humans as first-class citizens.

Don't use mix for runtime config.

See: https://github.com/keathley/vapor

```elixir
defmodule Jenga.Config do
  use GenServer

  def start_link(desired_config) do
    GenServer.start_link(__MODULE__, desired_config, name: __MODULE__)
  end

  def init(desired) do
    :jenga_config = :ets.new(:jenga_config, [:set, :protected, :named_table])
    case load_config(:jenga_config, desired) do
      :ok ->
        {:ok, %{table: :jenga_config, desired: desired}}
      :error ->
        {:stop, :could_not_load_config}
    end
  end

  defp load_config(table, config, retry_count \\ 0)
  defp load_config(_table, [], _), do: :ok
  defp load_config(_table, _, 10), do: :error
  defp load_config(table, [{k, v} | tail], retry_count) do
    case System.get_env(v) do
      nil ->
        load_config(table, [{k, v} | tail], retry_count + 1)
      value ->
        :ets.insert(table, {k, value})
        load_config(table, tail, retry_count)
    end
  end
end
```

To watch for the health of your system's components, you can use [alarms][erlang-alarms].

Example:

```elixir
defmodule Jenga.Database.Watchdog do
  use GenServer

  def init(:ok) do
    schedule_check()
    {:ok, %{status: :degraded, passing_checks: 0}}
  end

  def handle_info(:check_db, state) do
    status = Jenga.Database.check_status()
    state = change_state(status, state)
    schedule_check()
    {:noreply, state}
  end

  defp change_state(result, %{status: status, passing_checks: count}) do
    case {result, status, count} do
      {:ok, :connected, count} ->
        if count == 3 do
          :alarm_handler.clear_alarm(@alarm_id)
        end
        %{status: :connected, passing_checks: count + 1}

      {:ok, :degraded, _} ->
        %{status: :connected, passing_checks: 0}

      {:error, :connected, _} ->
        :alarm_handler.set_alarm({@alarm_id, "We cannot connect to the database”})
          %{status: :degraded, passing_checks: 0}
          {:error, :degraded, _} ->
            %{status: :degraded, passing_checks: 0}
    end
  end
end
```

When communicated with other services, you may want to use [circuit-breakers][circuit-breakers].
For BEAM projects [fuse][fuse] is the go-to library.


### Lessons From our first trillion messages with Flow - [John Mertens][profile-mertens]

John is a principal engineer for https://change.org
It's written primarily in Ruby, but they started adopting Elixir in
2018.

This is an example of how they use Flow:

```elixir
SqsClient.sqs_producers()
|> Flow.from_stages()
|> Flow.map(&prep_incoming_message/1)
|> Flow.map(&run_biz_logic/1)
|> Flow.map(&commit_side_effects/1)
|> Flow.map(&log_errors/1)
|> Flow.partition(window: ack_window, stages: 1)
|> Flow.reduce(fn -> [] end, &ack_accumulator/2)
|> Flow.on_trigger(fn messages ->
   ack_messages(messages, queue_name)
   {[], []}
 end)
```

With the help of pattern-matching they can handle a variety of data:

```elixir
@spec run_biz_logic(Message.t()) :: Message.t()
def run_biz_logic(
  %Message{status: :ok, message_type: "click"} = msg
  ) do
  # functionality for the "click" message type
end

def run_biz_logic(
  %Message{status: :ok, message_type: "sign"} = msg
  ) do
  # functionality for the "sign" message type
end
```

A glimpse of Broadway from change.org's codebase:

```elixir
def start_link({input_queue: queue, sqs_worker_count: producers) do
  Broadway.start_link(__MODULE__,
  name: __MODULE__,
  producers: [
    default: [
      module: {BroadwaySQS.Producer, queue_name: queue},
      stages: producer_count
    ]
  ],
  processors: [default: [stages: 100]],
  batchers: [default: [batch_size: 10, batch_timeout: 5_000]]
end

def handle_message(_, %Message{data: sqs_msg} = message, _) do
  new_msg =
  sqs_msg
  |> prepare_incoming_message()
  |> run_biz_logic
  |> commit_side_effects()
  |> log_errors()

  case new_msg.status do
    :error ->
      Message.failed(message, new_msg.status_metadata.error.response
    _ ->
      Message.update_data(message, fn _ -> new_msg end)
  end
end
```

### Ecto without SQL - [Guilherme de Maio][profile-de-maio]

[slides][slides-de-maio]

<img src="/images/posts/elixirconfeu2019/de_maio_resized.jpg" class="img-medium" alt="de_maio"/>

It turns out [Ecto][ecto] is more than a database library for Elixir.

> Ecto is a toolkit for data
> mapping and language
> integrated query for Elixir

the main modules of Ecto are:

* Schema
* Changeset
* Repo
* Query

It's not an ORM.

Defining a type:

```elixir

defmodule Sample.Phone do
  @behaviour Ecto.Type
  defstruct [:number]

  def type, do: :string

  def cast(string) when is_binary(string) do
    case Phone.parse(string) do
      {:ok, phone} -> {:ok, %__MODULE__{number: format(phonenumber)}}
      _otherwise -> :error
    end
  end
  def cast(phone = %__MODULE__{}), do: {:ok, phone}
  def cast(nil), do: {:ok, nil}
  def cast(_), do: :error

  def dump(%__MODULE__{number: string}), do: {:ok, string}
  def dump(nil), do: {:ok, nil}
  def dump(_), do: :error

  def load(nil), do: {:ok, nil}
  def load(string), do: {:ok, %__MODULE__{number: string}}
end
```

You can use Ecto without SQL. By defining an adapter.

Some examples:

* https://github.com/circles-learning-labs/ecto_adapters_dynamodb
* https://github.com/jeffweiss/ecto_ldap
* https://github.com/ankhers/mongodb_ecto
* https://github.com/wojtekmach/ets_ecto
* https://github.com/almightycouch/rethinkdb_ecto

However `Ecto.Query` is very SQL-centric.

You may use changesets without Repo for validations.
Example:

```elixir
defmodule ApiWeb.Call.AnswerValidator do
  @moduledoc """
  Validate requests to answer command
  """
  @schema %{client_state: :string}
  @all_fields Map.keys(@schema)

  use ApiWeb.Validator, schema: @schema

  alias ApiWeb.Validator.ClientStateValidator

  def changeset(changeset, params) do
    changeset
    |> cast(params, @all_fields)
    |> ClientStateValidator.validate_client_state()
  end
end
```

This is a way to get a consistent error handling strategy for controller actions.

### Closing Keynote - [Chris McCord][profile-mccord]

[video][video-mccord]

<img src="/images/posts/elixirconfeu2019/mccord_resized.jpg" class="img-medium" alt="mccord"/>

The idea is to be able to write interactive, Real-Time apps that are
"scriptless", meaning that you don't have to write any JavaScript.

Chris showed the following demos on stage:

* https://liveview.zorbash.com
* https://elegant-monstrous-planthopper.gigalixirapp.com
* https://flappy-phoenix.herokuapp.com/game
* https://polite-angelic-beaver.gigalixirapp.com

Imagine my surprise and excitement when Chris opened a browser tab with the first demo,
which I wrote 🥳  You may read [my previous post][observer-live] about that.

He said, they're going to be able to use LiveView to lift
information out of the VM and produce the Phoenix [Telemetry][telemetry] integration.

For more demos, guides and tutorials about LiveView, check out [this
list][liveview-tefter-list].

So Chris said that LiveView isn't going to replace SPA frameworks. For
example one wouldn't write google docs, or google maps using LiveView.
However there's many simpler apps which can be written with LiveView,
avoiding the rabbit hole of complexity of client-side development.

LiveView is a new paradigm questioning some of the existing techniques
for developing interactive apps. Imagine building an interactive
thermostat UI like [this one][thermostat-demo]. You'd need to code:

**Server**

* Define routes
* Create Controller / Channel
* Define JSON/payload contracts

**Client**

* Handle events and syncing state
* Handle client actions
* Handle error recovery
* Navigate the JS library labyrinth

That thermostat example, can be coded like:

```elixir
defmodule DemoWeb.ThermostatView do
  use Phoenix.LiveView
  import Calendar.Strftime

  def render(assigns) do
    ~L"""
    <div class="thermostat">

      <div class="bar <%= @mode %>">
        <a phx-click="toggle-mode"><%= @mode %></a>
        <span><%= strftime!(@time, "%r") %></span>
      </div>
      <div class="controls">
        <span class="reading"><%= @val %></span>
        <button phx-click="dec" class="minus">-</button>
        <button phx-click="inc" class="plus">+</button>
      </div>
    </div>
    """
  end

  def mount(_session, socket) do
    if connected?(socket), do: Process.send_after(self(), :tick, 1000)
    {:ok, assign(socket, val: 72, mode: :cooling, time: :calendar.local_time())}
  end

  def handle_info(:tick, socket) do
    Process.send_after(self(), :tick, 1000)
    {:noreply, assign(socket, time: :calendar.local_time())}
  end

  def handle_event("inc", _, socket) do
    {:noreply, update(socket, :val, &(&1 + 1))}
  end

  def handle_event("dec", _, socket) do
    {:noreply, update(socket, :val, &(&1 - 1))}
  end

  def handle_event("toggle-mode", _, socket) do
    {:noreply,
     update(socket, :mode, fn
       :cooling -> :heating
       :heating -> :cooling
     end)}
  end
end
```

Where the EEx part of it, can be extracted to a separate file.

An important aspect of app development with LiveView is failure
isolation. With a JavaScript application, an exception, unless rescued
would freeze the UI. However with LiveView a process isolates failure
and restarts a view with a known good state.

### Optimisations

LiveView uses [morphdom][morphdom] to optimally update the DOM with the
changes pushed down the web socket. LiveView tries to push only the
changes in the state and positions in the markup to be updated.

In the future the ability to throttle keyboard events will be added and
there's an [open issue][liveview-debounce] for that.

### First-Class Testing

With code like the following, you can test-drive your statefull actual
running process without a browser.

```elixir
test "thermostat controls" do
  {:ok, thermo_live, _html} = mount(Endpoint, ThermostatLive)

  assert render(thermo_live) =~ "70°"
  assert render_click(thermo_live, :inc) =~ "71°"

  assert [clock_live] = children(thermo_live)
  assert render(clock_live) =~ ~r/..:.. [A|P]M/

  :ok = GenServer.call(clock_live.pid, {:set, "12:01 PM"})
  assert render(clock_live) =~ "12:01 PM"
end
```

Finally Chris also showed a comparison of library sizes to build an
interactive app:

Name                     | Size (minified)
-------------------------|-----------------
LiveView.js + morphdom   | 29K
Vue 2.5.20               | 88K
React 16.6.3 + React DOM | 112K
Ember 3.0.0.beta.2       | 468K

### Next Steps

* Optimised collections with prepend and append operations
* pushState support for proper URLs on state change
* Enhanced loading states
* File uploads
* Guides
* Initial hex release

### Q & A

Q. WebSockets don't work in some cases where there are proxes

You can give it the longpoll option

Q. What about working on an open standard?

It would impede development. We can get to specify it at some point. Too
early to say.

Q. Does it work without JS (for SEO)?

If you curl it, responds with the expected HTML, so yes.

## Outro

You might also be interested to read:

* Martin Gausby's [thoughts][gausby-blogpost] on this year's conf
* Read my previous posts for [2018][elixirconf-2018] and [2017][elixirconf-2017]
* This [list][tefter-list] of bookmarks from the conference

**Spotted a Mistake?**

Please contact me on [twitter][me-twitter], or in the comments, or [submit a PR][blog-repo] for corrections.

## Upcoming Elixir Conferences

* [CodeElixir - LDN][code-elixir]
* [ElixirConf.US][ElixirConf.US]

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

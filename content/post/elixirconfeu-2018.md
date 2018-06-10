+++
author = "Dimitris Zorbas"
date = "2018-06-09"
draft = false
title = "ElixirConf.EU 2018"
image = "images/posts/elixirconfeu2018/logo.png"
tags = ["open-source", "conference", "erlang", "elixir", "warsaw"]
comments = true
share = true
+++


I attended [ElixirConf.EU][ElixirConf.EU-2018] 2018, it took place in Warsaw this time.
The food was fantastic, the weather was very favourable and the presentations a blast.

## The Food

Announcement: This blog is from now on about food ..Not.   
That [zapiecek][zapiecek] place was sooo good though. We ate there almost
twice a day. They had those ravioli-like pasta called pierogi,
absolutely mouth-watering. I might visit Poland again just for the food!  
`</food>`

</br>

<div class="polaroid">
  <img src="/images/posts/elixirconfeu2018/zapiecek.jpg" class="img-medium" alt="ravioli">
  <p>Yummy pierogis</p>
</div>

</br>

We also enjoyed strolling around [Łazienki][lazienki] park.

<div class="polaroid">
  <img src="/images/posts/elixirconfeu2018/lazienki.jpg" class="img-medium" alt="ravioli">
  <p>Lazienki park</p>
</div>

</br>


## Conference - Day 1

### Keynote - Introducing HDD: Hughes Driven Development - [José Valim][Profile-Jose-Valim]

{[slides][valim-slides], [video][valim-video]}

The title of the talk "Hughes Driven Development" is a reference to [John Hughes][hughes]
who pioneered in the area of property based testing as one of the
developers of [QuickCheck][QuickCheck].

The Elixir core team is developing a library,
[stream_data][stream_data] for property-based testing.

A test for a String concatenation function could look like:

```elixir
check all left <- string(),
  right <- string() do
  string = left <> right
  assert String.contains?(string, left)
  assert String.contains?(string, right)
end
```

This library is likely to be part of ExUnit as of Elixir@1.7.

José also talked about some of the progress in the development of code
formatter (`mix format`) and its algorithmic foundations:

* [Pretty Printing][wadler-pretty-printing] - Wadler
* [Strictly Pretty][strictly-pretty-linding] - Linding

At the end of his talk he was awarded a 3D-printed Elixir logo by the
people of [kloeckner.i][kloeckner.i]. What a nice surprise!

</br>

<div class="polaroid">
  <img src="/images/posts/elixirconfeu2018/valim_award.png" class="img-medium" alt="valim award">
  <p>🏅🏅🏅</p>
</div>

</br>

### Robust Data Processing Pipeline with Elixir and Flow - [László Bácsi][Profile-bacsi]

{[slides][bacsi-slides], [video][bacsi-video]}

His talk revolved around the topic of using [Flow][elixir-flow] to
express complex computations.

> If you're thinking re-writting everything using flow, don't. It's an
> overkill.

```elixir
defmodule ImportFeeds do
  @spec flow(Enumerable.t()) :: Flow.t()
  def flow(%Flow{} = flow) do
    flow
    |> Flow.map(&ensure_loaded/1)
    # |> ...
    |> Flow.emit(:state)
  end

  def flow(input) do
    input |> Flow.from_enumerable() |> flow()
  end
end
```

and now such functions can be composed like:

```elixir
feeds
|> PrepareFeeds.flow()
|> ImportFeeds.flow()
|> Flow.run()
```

**References**

* [Flow documentation][flow-doc]
* [Architecting Flow in Elixir Programs][architecting-flow]

### Going low level with TCP sockets and :gen_tcp - [Orestis Markou][profile-orestis]

{[slides][slides-orestis], [video][video-orestis]}

He did a live demo of a client-server pair with code from this [repo][orestis-elixir_tcp]
using just `:gen_tcp`.

Code to make a simple HTTP request:

```elixir
defmodule Active do
  def hello do
    {:ok, socket} = :gen_tcp.connect('www.google.com', 80, [:binary, active: true])
    :ok = :gen_tcp.send(socket, "GET / HTTP/1.0 \r\n\r\n")
    recv()
  end

  def recv do
    receive do
      {:tcp, socket, msg} ->
        IO.puts msg
        recv()
      {:tcp_closed, socket} -> IO.puts "=== Closed ==="
      {:tcp_error, socket, reason} -> IO.puts "=== Error #{inspect reason} ==="
    end
  end

end

Active.hello()
```

In this case the `active: true` option converts packets to erlang
messages (see: [doc][doc-gen_tcp]).

An interesting highlight is that sockets are mutable and can change
on-the-fly (for example between `:binary` and `:active` modes). This is
demonstrated in [this][orestis-memcached] example which is intended to
implement a small fragment of the memcached protocol. It establishes a
connection in `packet: :line` mode which reads from the socket until a
newline is encountered, parses the bytesize of the next message, changes
the socket mode to `packet: 0` (raw mode) and finally reads from the
socket using the parsed bytesize.

### SSH Server/Client in Erlang

{[slides][slides-milad], [video][video-milad]}

Milad started his presentation with a brief history and feature overview
of SSH. Erlang has had a builtin SSH library since 2005 and it's quite
easy to start an SSH server from your Elixir code.

Example:

```elixir
defmodule SshTalk.Server do
  @sys_dir String.to_charlist("#{Path.expand(".")}/sys_dir")

  def basic_server do
    :ssh.daemon(
      2222,
      system_dir: @sys_dir,
      user_passwords: [{'foo', 'bar'}]
    )
  end
end
```

You can then start your server using:

```shell
iex -S mix
```

and connect to it using any SSH client using:

```shell
ssh foo@localhost -p 2222
```

Neat, isn't it? It gets even cooler as you can have your server provide
an Elixir shell using:

```elixir
def server_with_elixir_cli do
  :ssh.daemon(
    2222,
    system_dir: @sys_dir,
    user_dir: @usr_dir,
    auth_methods: 'publickey',
    shell: &shell/2
  )
end

def shell(username, peer) do
  IEx.start([])
end
```

Milad has also used the `:ssh` module to build [GixirServer][gixir] which is a Git server
working over SSH.

### SPAs Without the SPA - [Ian Duggan][profile-duggan]

The following quote catch my attention at the start of this presentation:

> Has Rails ruined a generation of programmers?

* Keep it simple
* Be suspicious of frameworks
* Take only what you need

Ian is the creator of a framework to build SPAs using Elixir. The
framework is called [Presto][presto].

Some of the design goals were:

* The feel and Reactivity of React
* The simplicity of Elm's model/update/view
* Completely in Elixir (minimal JavaScript)

Code samples:

```elixir
# Updating a component
@impl Presto.Page
def update(message, model) do
  case message do
    %{"event" => "click", "id" => "inc"} -> model + 1
    %{"event" => "click", "id" => "dec"} -> model - 1
  end
end

# Rendering
def render(model) do
  div do
    "Counter is: #{inspect(model)}"

    button(id: "inc", class: "presto-click") do
      "More"
    end

    button(id: "dec", class: "presto-click") do
      "Less"
    end
  end
end
```

HTML markup is generated in Elixir-space using [taggart][taggart].

## Conference - Day 2

### Keynote - Building a Task Queue System with GenStage, Ecto, and PostgreSQL - [Evadne Wu][Profile-Evadne]

{[slides][slides-evadne], [video][video-evadne]}

This presentation was an eye-candy, well researched and delivered beautifully.

She begins by exploring some basic scheduling concepts, like for example
task deadlines:

|Type | If Missed       | Applicable? |
|-----|-----------------|-------------|
|Soft | People Unhappy  | Yes         |
|Firm | Results Useless | Yes         |
|Hard | Very Bad Things | No          |

> Don't treat your RDBMS as a dumb data store

* People will try to integrate your databases directly, regardless of
  design intent
* Try to encode essential constraints directly into the database

Using PostgreSQL for background jobs can be as simple as:

**Function**

```sql
CREATE FUNCTION jobs.enqueue_process_charges() RETURNS trigger AS $$
  BEGIN
  INSERT INTO jobs.process_charges (id)
  VALUES (OLD.id);
  RETURN OLD;
  END;
$$ LANGUAGE plpgsql;
```

**Trigger**

```sql
CREATE TRIGGER enqueue_process_charges
  AFTER UPDATE ON purchases
FOR EACH ROW
  WHEN NEW.status = 'processing'
EXECUTE PROCEDURE
  jobs.enqueue_process_charges();
```

**Notification**

```sql
CREATE FUNCTION new_job_notify() RETURNS trigger AS $$
 BEGIN
 PERFORM pg_notify('new_job', row_to_json(NEW)::text);
 RETURN NEW;
 END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify
  AFTER INSERT ON jobs
FOR EACH ROW
  WHEN NEW.status = 'pending'
EXECUTE PROCEDURE
  new_job_notify();
```

**Listening for Notifications**

```elixir
config = Repo.config |> Keyword.merge(pool_size: 1)
channel = "new_jobs"

{:ok, pid} = Postgrex.Notifications.start_link(config)
{:ok, ref} = Postgrex.Notifications.listen(pid, channel)

receive do
  {:notification, connection_pid, ref, channel, payload} -> # ?
end
```

**Caveats**

* PostgreSQL uses a single global queue for all async notifications
* All listening backends get all notifications and filter out the ones
  they don't want (performance degrages as listeners are added)
* There's a maximum payload size

### Using Elixir to Build a High-Availability Fleet Management Solution for Autonomous Vehicles - [Serge Boucher][profile-boucher]

Serge begins with a description of the product of [Easy
Mile][easy-mile], a company specialising in autonomous vehicle
technology.

**Highlights**

Their stack is:

* Custom Protocol — Protobuf over TCP/IP / MQTT
* Elixir
* Phoenix
* ES6/React/Redux/Brunch/Flow/Jest/Storybooks
* Kubernetes
* AWS

10 things Serge wish he knew before starting the project:

1. GenServers aren't classes
2. Put all Business Logic in Pure Functions
3. ExUnit is for Unit Testing
4. You Don't Need "Medium" Tests
5. Monolith is not a Bad Word ([relative-tweet][zorbash-monolith-tweet])
6. Heroku isn't the Real World
7. There Are Missing Libraries
8. The Community is Great!
9. Elixir is Fast Enough
10. remote_console is awesome!
11. Compilation Time Rises Quickly
12. Erlang Programmers are Awesome
13. High Availability is Builtin

About "Monolith is not a bad word", they started with a microservices
based architecture which included 3 Elixir services. Their fleet manager
application used distributed Erlang PubSub and at some point someone
asked "Why do we have those 3 different things separated?". In the end
they merged it to a monolith.

### Coupling Data and Behaviour - [Guilherme de Maio][profile-maio]

{[slides][slides-maio], [video][video-maio]}

> Finally, another downside to object-oriented  
> programming is the tight coupling between function  
> and data. In fact, the Java programming language forces  
> you to build programs entirely from class hierarchies,  
> restricting all functionality to containing methods in a  
> highly restrictive “Kingdom of Nouns” (Yegge 2006).  
>
>  -- Fogus/Houses | The joy of Clojure

</br>

> The problem I have with Erlang is that the language is  
> somehow too simple, making it very hard to eliminate  
> boilerplate and structural duplication. Conversely, the  
> resulting code gets a bit messy, being harder to write,  
> analyze, and modify. After coding in Erlang for some  
> time, I thought that functional programming is inferior  
> to OO, when it comes to efficient code organization.  
>
>  -- Sasa Juric | Why Elixir

Elixir protocols can be of help.


A custom implementation of protocols using function dispatching could look like:

```elixir
defmodule Protocolz do
 def dispatch(function_name, data) do
   struct_module = data.!_struct!_
   :erlang.apply(struct_module, function_name, [data])
 end
end
```

But dispatching is not so efficient, that's why elixir does protocol
consolidation at compile-time.

**Protocol Use-Cases**

[poison][poison]

```elixir
defmodule Person do
  @derive [Poison.Encoder]
  defstruct [:name, :age]
end

defimpl Poison.Encoder, for: Person do
  def encode(%{name: name, age: age}, opts) do
    Poison.Encoder.BitString.encode("!#name} (!#age})", opts)
  end
end
```

[elasticsearch-elixir][es-elixir]

```elixir
defimpl Elasticsearch.Document, for: MyApp.Post do
  def id(post), do: post.id
  def type(_post), do: "post"
  def parent(_post), do: false
  def encode(post) do
    %{
      title: post.title,
      author: post.author
    }
  end
end
```

### Property-Based Testing is a Mindset - [Andrea Leopardi][profile-leopardi]

{[slides][slides-leopardi], [video][video-leopardi]}

Most common way of testing is by writing unit-tests. Example-based
testing which can also be considered table-based.

```elixir
test "sorting" do
  assert sort([]) == []
  assert sort([1, 2, 3]) == [1, 2, 3]
  assert sort([2, 1, 3]) == [1, 2, 3]
end
```

|input      | Output    |
|-----------|-----------|
| []        | []        |
| [1, 2, 3] | [1, 2, 3] |
| [2, 1, 3] | [1, 2, 3] |

Unit-tests are easy to write, good for regressions and non-corner cases,
but it's hard to express properties.

Andrea is working on [stream_data][stream_data], which is a property-based framework which generates valid inputs and tests for the properties of the output.

```elixir
check all list <- list_of(int()) do
  sorted = sort(list)
  assert is_list(sorted)
  assert same_elements?(list, sorted)
  assert ordered?(sorted)
end
```

The framework exposes generators to produce values to test their output.
The framework tries to prove you wrong.

```elixir
iex> Enum.take(integer(), 4)
[1, 0, -3, 1]
```

Generators are infinite streams growing in complexity as they produce
values.

Property-based testing can be stateful. Andrea mentioned Redis and
LevelDB and provided examples.
There's a GSOC project for `stream_data` to work in tandem with
`dialyzer`. There's ongoing research on automatically inferring
generators from typespec types.

There was a very interesting question about the performance degradation
of property-based testing and the answer was "It's terrible, but you can
keep some data locally to make it faster".

### Closing Keynote - [Chris McCord][profile-mccord]

**Highlights**

* In Phoenix@1.4 channels will be more flexible
* The big feature is HTTP/2 (via cowboy ~> 2.0). You can already opt-in
  by changing the version of cowboy in your mix.exs
* There's no JS API for HTTP/2
* Faster project recompilation
* Moving to WebPack. 3 years ago it was a sane choice as it was easier
  to configure and had better docs

**H2 Push**

```elixir
defmodule AppWeb.PageController do
  use AppWeb, :controller

  plug :push, "/js/app.js"
  plug :push, "/images/logo.png"

  def index(conn, _params) do
    render(conn, "index.html")
  end
end
```

```html
<img src="<%= static_push(@conn, "/img/logo.png") %>" />

<script src="<%= static_push(@conn, "/js/app.js)") %>">
</script>
```

You can push from the template!

**Explicit Router Functions**

In Phoenix version >= 2.0 you'll have to explicitly alias route helpers:

```elixir
conn
|> put_flash(:info, "Job updated successfully")
|> redirect(to: job_path(conn, :show, job))

# Becomes
alias AppWeb.Router.Router

conn
|> put_flash(:info, "Job updated successfully")
|> redirect(to: Routes.job_path(conn, :show, job))
```

**New Presence JS API**

```javascript
let channel = socket.channel("room:lobby")
let presence = new Presence(channel)

presence.onSync(() => {
  renderUsers(presence.list())
})

presence.onJoin(...)
presence.onLeave(...)

channel.join()
```

He concluded by making a remark about trusting the database. Elixir
developers tend to get overexcited with the capabilities of the Erlang
platform and replace parts of their applications which
traditionally belonged to the database with GenServers and Tasks.

> The database is your friend

It offers:

* Transactions
* Consistency
* Backups
* Replication

To replace the database we need better tooling.

## Outro

I hope you enjoyed this post. It was meant to be published only a couple of
days after the conf, but someone forgot to push the draft to git,
changed computer and then had to write it from scratch 😑. Please
contact me or [submit a PR][blog-repo] for corrections.

</br>

<div class="polaroid">
  <img src="/images/posts/elixirconfeu2018/quiqup_team_cropped.jpg" class="img-medium" alt="quiqup">
  <p>Team Quiqup {R.Soares, L.Varela and the author} with José</p>
</div>

</br>

## Upcoming Elixir Conferences

* [CodeElixir - LDN][code-elixir-conf]
* [ElixirConf.US][ElixirConf.US]

<style>
.main-header {
  background-size: 32% auto;
}

.highlight {
  line-height: 20px;
}
</style>

[ElixirConf.EU-2018]: http://www.elixirconf.eu
[ElixirConf.EU-2017]: {{< relref "post/elixirconfeu-2017.md" >}}
[ElixirConf.US]: https://elixirconf.com/
[zapiecek]: http://www.zapiecek.eu/main.html
[pierogi]: https://en.wikipedia.org/wiki/Pierogi
[Profile-Jose-Valim]: https://twitter.com/josevalim
[kloeckner.i]: https://www.kloeckner-i.com/
[valim-slides]: http://s3.amazonaws.com/erlang-conferences-production/media/files/000/000/900/original/Jose_Valin_-_Introducing_HDD_-_Hughes_Driven_Development.pdf?1524667837
[valim-video]: https://youtu.be/x2ckfhqB9nA
[stream_data]: https://github.com/whatyouhide/stream_data
[hughes]: https://en.wikipedia.org/wiki/John_Hughes_(computer_scientist)
[QuickCheck]: http://www.cse.chalmers.se/~rjmh/QuickCheck/
[wadler-pretty-printing]: https://homepages.inf.ed.ac.uk/wadler/papers/prettier/prettier.pdf
[strictly-pretty-linding]: http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.34.2200
[Profile-bacsi]: https://twitter.com/icanscale
[bacsi-slides]: http://s3.amazonaws.com/erlang-conferences-production/media/files/000/000/873/original/Laszlo_Bacsi_-_Robust_Data_Processing_Pipeline_with_Elixir_and_Flow.pdf?1524057351
[bacsi-video]: https://youtu.be/3XL-31nqcX4
[elixir-flow]: https://github.com/elixir-lang/flow
[flow-doc]: https://hexdocs.pm/flow/Flow.html
[architecting-flow]: http://trivelop.de/2018/03/26/flow-elixir-using-plug-like-token/
[profile-orestis]: https://twitter.com/orestis
[slides-orestis]: http://s3.amazonaws.com/erlang-conferences-production/media/files/000/000/877/original/Orestis_Markou_-_Going_low_level_with_TCP_sockets_and_gen_tcp.pdf?1524057595
[video-orestis]: https://youtu.be/-FiQhkV7JYk
[orestis-elixir_tcp]: https://github.com/orestis/elixir_tcp
[doc-gen_tcp]: http://erlang.org/doc/man/gen_tcp.html
[orestis-memcached]: https://github.com/orestis/elixir_tcp/blob/master/lib/protocols.exs
[profile-milad]: https://twitter.com/slashmili
[slides-milad]: http://s3.amazonaws.com/erlang-conferences-production/media/files/000/000/876/original/Milad_Rastian_-_SSH_server_client_in_Erlang.pdf?1524057571
[video-milad]: https://www.youtube.com/watch?v=66sNfqOrSJw&feature=youtu.be
[gixir]: https://github.com/slashmili/gixir-server
[lazienki]: https://en.wikipedia.org/wiki/%C5%81azienki_Park
[profile-duggan]: https://twitter.com/ijcd
[presto]: https://github.com/ijcd/presto
[taggart]: https://github.com/ijcd/taggart
[Profile-Evadne]: https://twitter.com/evadne
[slides-evadne]: http://s3.amazonaws.com/erlang-conferences-production/media/files/000/000/904/original/Evadne_Wu_-_Building_a_Task_Queue_with_GenStage__Ecto_and_PostgreSQL.pdf?1524733730
[video-evadne]: https://youtu.be/tytHbbjeHMM
[profile-boucher]: https://twitter.com/easy_mile
[slides-boucher]: http://s3.amazonaws.com/erlang-conferences-production/media/files/000/000/878/original/Serge_Boucher_-_Using_Elixir_to_Build_a_High-Availability_Fleet_Management_Solution_for_Autonomous_Vehicles.pdf?1524057633
[video-boucher]: https://youtu.be/O2gQc4Kh4-Y
[easy-mile]: http://www.easymile.com/
[zorbash-monolith-tweet]: https://twitter.com/_zorbash/status/1005922060751790083
[profile-maio]: https://twitter.com/nirev
[slides-maio]: http://s3.amazonaws.com/erlang-conferences-production/media/files/000/000/871/original/Guilherme_de_Maio_-_Coupling_Data_and_Behaviour.pdf?1524057286
[video-maio]: https://youtu.be/fnfcYKq373w
[poison]: https://github.com/devinus/poison
[es-elixir]: https://github.com/infinitered/elasticsearch-elixir
[profile-leopardi]: https://twitter.com/whatyouhide
[slides-leopardi]: http://s3.amazonaws.com/erlang-conferences-production/media/files/000/000/903/original/Andrea_Leopardi_-_Property-based_Testing_Is_a_Mindset.pdf?1524733709
[video-leopardi]: https://youtu.be/p84DMv8TQuo
[code-elixir-conf]: https://codesync.global/conferences/code-elixir-2018/
[profile-mccord]: https://twitter.com/chris_mccord
[blog-repo]: https://github.com/Zorbash/zorbash.github.com

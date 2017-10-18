+++
author = "Dimitris Zorbas"
date = "2017-11-12"
draft = false
title = "Phoenix WebSockets Under a Microscope 🔬"
image = "images/posts/phoenix_under_a_microscope/phoenix.png"
tags = ["debugging", "phoenix", "elixir", "erlang", "websockets"]
comments = true
share = true
+++

This is a code-reading and exploration post about the WebSockets side of [Phoenix][phoenix].
It builds upon the tracing techniques showcased in the [previous post][previous-post] to observe
some of the internals of Phoenix.
It also features some debugging tricks I commonly use to debug WebSocket
related issues. The title and nature of this post are inspired by the
marvellous book [Ruby Under a Microscope][ruby-under-a-microscope] written by [Pat Shaughenessy][pat-shaughenessy].

## WebSockets

> The WebSocket Protocol enables two-way communication between a client
> running untrusted code in a controlled environment to a remote host
> that has opted-in to communications from that code
>
> The goal of
> this technology is to provide a mechanism for browser-based
> applications that need two-way communication with servers that does
> not rely on opening multiple HTTP connections (e.g., using
> `XMLHttpRequest` or `<iframe>`s and long polling)

Conceptually, WebSocket is really just a layer on top of TCP that does the following:

* Adds a web origin-based security model for browsers

* Adds an addressing and protocol naming mechanism to support
  multiple services on one port and multiple host names on one IP
  address

* Layers a framing mechanism on top of TCP to get back to the IP
  packet mechanism that TCP is built on, but without length limits

* Includes an additional closing handshake in-band that is designed
  to work in the presence of proxies and other intermediaries

(source: [RFC 6455][rfc6455])

One of the most radical elements of Phoenix is the ease and productivity
it brings when developing WebSocket applications.

We'll start off by creating a simple application to dive in some
aspects of Phoenix and understand its inner workings.

### The Number Generator Application

Leveraging the excellent scaffolding tasks of Phoenix, we can quickly build a sample application, 
to start the exploration.

The sample application assigns a random Integer to each connected client
and streams numbers down the socket on a preconfigured interval.

```shell
mix archive.install https://github.com/phoenixframework/archives/raw/master/phoenix_new.ez
mix phoenix.new numbers --no-brunch --no-ecto
```

The `--no-brunch` option is employed to skip generating [Brunch][brunch]
related scaffolding, as none of the examples below require JavaScript and
`--no-ecto` to skip database related configuration and modules.

> Phoenix@v1.2.5 is used for all the examples of this post.

By design, a Phoenix channel is an abstraction on sending and receiving
messages about topics. `Phoenix.Transports.WebSocket` is the default
transport mechanism, there are others available and you can even
write your own. You may read the documentation about channels
[here][phoenix-channels].

Let's code our first channel by creating a `web/channels/integers_channels.ex`.


```elixir
defmodule Numbers.IntegersChannel do
  use Numbers.Web, :channel

  def join("numbers:" <> type, _params, socket) when type in ~s(positive negative) do
    with type <- type |> String.to_existing_atom,
         socket <- socket
                   |> assign(:number, number(type))
                   |> assign(:joined_at, NaiveDateTime.utc_now) do
      send self(), {:update, type}

      {:ok, socket}
    end
  end

  def handle_info({:update, type}, socket), do: socket |> push_update(type)

  defp push_update(socket, type) do
    Process.send_after(self(), {:update, type}, 1000)

    push socket, "update", %{number: number(type)}

    {:noreply, socket}
  end

  defp number(:positive), do: :erlang.unique_integer([:positive])
  defp number(:negative), do: - number(:positive)
end
```

Then update the `web/channels/user_socket.ex` file to route to the
channel we just defined:

```elixir
defmodule Numbers.UserSocket do
  use Phoenix.Socket

  ## Channels
  channel "numbers:*", Numbers.IntegersChannel

  ## Transports
  transport :websocket, Phoenix.Transports.WebSocket

  def connect(_params, socket) do
    {:ok, socket}
  end

  def id(_socket), do: nil
end
```

Two topics are defined, `numbers:positive` streaming positive numbers
and `numbers:negative` for negative ones.

You may notice that we're assigning a `:joined_at` attribute to each
client. This is just a convention which can come handy to calculate for how
long a client has been connected. For real-time join/leave tracking,
 [Phoenix.Presence][presence] should be preferred.

We can now start the application using:

```shell
iex -S mix phoenix.server
```

## Connecting to WebSockets from the terminal

Now that we have the server up and running, we can initiate some
connections using [wsta][wsta], a cli tool written in Rust ⚙️, which
follows the Unix philosophy letting you pipe streams to and from to
other scripts or files.

### Installation

Debian ❤️

```shell
echo 'deb http://download.opensuse.org/repositories/home:/esphen/Debian_8.0/ /' > /etc/apt/sources.list.d/wsta.list
apt-get update
apt-get install wsta
```

Mac OS X

```shell
brew tap esphen/wsta https://github.com/esphen/wsta.git
brew install wsta
```

With [wsta][wsta] installed, we can connect to the positive numbers topic using:

```shell
wsta 'ws://localhost:4000/socket/websocket' \
'{"topic":"numbers:positive","event":"phx_join","payload":{},"ref":"1"}'
```

The output will look like:

```shell
Connected to ws://localhost:4000/socket/websocket
{"topic":"numbers:positive","ref":"1","payload":{"status":"ok","response":{}},"event":"phx_reply"}
{"topic":"numbers:positive","ref":null,"payload":{"number":62402},"event":"update"}
{"topic":"numbers:positive","ref":null,"payload":{"number":62434},"event":"update"}
{"topic":"numbers:positive","ref":null,"payload":{"number":62466},"event":"update"}
```

and for the negative ones:

```shell
wsta 'ws://localhost:4000/socket/websocket' \
'{"topic":"numbers:negative","event":"phx_join","payload":{},"ref":"1"}'
```

The output will look like:

```shell
Connected to ws://localhost:4000/socket/websocket
{"topic":"numbers:negative","ref":"1","payload":{"status":"ok","response":{}},"event":"phx_reply"}
{"topic":"numbers:negative","ref":null,"payload":{"number":-61890},"event":"update"}
{"topic":"numbers:negative","ref":null,"payload":{"number":-61922},"event":"update"}
{"topic":"numbers:negative","ref":null,"payload":{"number":-61954},"event":"update"}
```


You'll notice that [wsta][wsta] will print `Disconnected!` and stop streaming numbers after around 1 minute.
This is due to a default [Phoenix.Transports.WebSocket][transports-websocket]
`:timeout` configuration which specifies:

> The timeout for keeping websocket connections open after it last received data, defaults to 60_000ms

To make it easier to interact with WebSockets in development you may set
it to `:infinity`.

## Differences between `push/3`, `broadcast_from/3` and `broadcast/3`

As you may read in the [Phoenix.Channel documentation][phoenix-channel]
there are 3 functions `push/3`, `broadcast_from3/` and `broadcast/3`
which can be used to send data to connected client(s) but have some
not so subtle differences.

* [push/3][channel-push-3] Broadcast the event to the current subscriber
* [broadcast_from/3][channel-broadcast_from-3] Broadcasts the event to
  all but the current subscribers of a given topic
* [broadcast/3][channel-broadcast-3] Broadcasts an event to all the
  subscribers of a given topic

You don't want to use `broadcast/3` if you're only interested to send
updates to a single client, use `push/3` instead 😇.

## Phoenix WebSocket Wiring

The supervision tree of the application is the following:

<a href="/images/posts/phoenix_under_a_microscope/observer.png" target="_blank">
  <img src="/images/posts/phoenix_under_a_microscope/observer.png" class="img-medium" alt="observer">
</a>

I've changed the number of [ranch][ranch] HTTP acceptor processes to
just 5 to reduce clutter, using the following `config/config.exs`:

```elixir
config :numbers, Numbers.Endpoint,
  url: [host: "localhost"],
  http: [acceptors: 5], # 👈
  secret_key_base: "something-secret",
  render_errors: [view: Numbers.ErrorView, accepts: ~w(html json)],
  pubsub: [name: Numbers.PubSub,
           adapter: Phoenix.PubSub.PG2]
```

With a connected WebSocket client, the above supervision tree will look like:

<a href="/images/posts/phoenix_under_a_microscope/observer_connection.png" target="_blank">
  <img src="/images/posts/phoenix_under_a_microscope/observer_connection.png" class="img-large" alt="observer-connection">
</a>

In the above image,`0.643.0` is a GenServer which holds Socket assigns for a client, it is created by `0.641.0` which
loops in [cowboy_websocket:handler_loop/4][cowboy_websocket-handler_loop] and
monitored by `Numbers.PubSub.Local0`.

The `cowboy_websocket` handler in turn is spawned by `0.340.0`, a [ranch_conns_sup][ranch_conns_sup]
which is supervised by `0.339.0` a [ranch_listener_sup][ranch_listener_sup].

> What about all those wild-west themed applications and modules?  
> Where do they come from?  
> How do our socket pushes manage to reach the client?

The following passages unravel some of the most important function calls
which take place for a WebSocket connection to be established and a
message to be pushed from the server to the client.

If you find it hard to catch on the whys and the hows of all
those function calls, don't fret, skip to the [Phoenix and Cowboy][phoenix-and-cowboy] section.

### Cowboy 🤠

This is the default web server for Phoenix. It depends on [ranch][ranch]
to handle TCP connections and [cowlib][cowlib] for HTTP protocol parsing and utility functions.

The HTTP [parsing code][cowlib-http] of cowlib is especially interesting as a
demonstration of what can be achieved using pattern-matching.

🎉  &nbsp; Cowboy 2.0 was recently released with support for HTTP/2 and lots of
other exciting changes (see [announcement][cowboy-announcement] and this [talk][cowboy-talk]).
Phoenix support is on the way (see [here][cowboy-2-pr]).

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">HTTP/2 support is being finalized thanks to <a href="https://twitter.com/TheGazler?ref_src=twsrc%5Etfw">@TheGazler</a>&#39;s work in Plug &amp; Phoenix, and of course <a href="https://twitter.com/lhoguin?ref_src=twsrc%5Etfw">@lhoguin</a>&#39;s continued fantastic work on Cowboy</p>&mdash; Phoenix Framework (@elixirphoenix) <a href="https://twitter.com/elixirphoenix/status/927938416670597120?ref_src=twsrc%5Etfw">November 7, 2017</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

Further below there are code references, which show how Phoenix uses
Cowboy to respond to HTTP/HTTPS requests.

### Phoenix.PubSub

[phoenix_pubsub][phoenix_pubsub] is an application dependency of Phoenix
handling distributed PubSub messaging and [Presence][presence].

In order to understand how essential it is and how things are tied to
together, we'll trace the framework's data flows.

In our example, a client connects to the channel `"numbers:42"`, then from
the server a message `{"number": 42}` is broadcasted to all connected
clients.

Take a deep breath and let's probe 🔎  &nbsp; Phoenix to find out what goes on
under the hood, for our message to reach its recipients.

#### Subscribing

When a client joins a channel,
[Phoenix.Socket.Transport.connect/6][phoenix-socket-transport-connect] is
called. It builds a `Phoenix.Socket` with `pubsub_server` set to
the configured name in the `:pubsub` setting of the Endpoint. For
this sample application it defaults to `Numbers.PubSub`.

```elixir
# Signature
connect(endpoint, handler, transport_name, transport, serializer, params)

# Actual arguments
connect(Numbers.Endpoint, Numbers.UserSocket, :websocket, Phoenix.Transports.WebSocket, Phoenix.Transports.WebSocketSerializer, %{}
```

It will call `Numbers.UserSocket.connect/2` with the following arguments:

```elixir
connect(%{}, %Phoenix.Socket{
  assigns: %{},
  channel: nil,
  channel_pid: nil,
  endpoint: Numbers.Endpoint,
  handler: Numbers.UserSocket,
  id: nil,
  joined: false,
  pubsub_server: Numbers.PubSub,
  ref: nil,
  serializer: Phoenix.Transports.WebSocketSerializer,
  topic: nil,
  transport Phoenix.Transports.WebSocket,
  transport_name: websocket,
  transport_pid: <0.421.0>  # This is a :cowboy_websocket process
})
```


Then a `Phoenix.Channel.Server` process is started by `Phoenix.Channel.Server.join/2`.

File: `lib/phoenix/channel/server.ex` ([link][phoenix-channel-server])

```elixir
defmodule Phoenix.Channel.Server do
  use GenServer

  def join(socket, auth_payload) do
    Phoenix.Endpoint.instrument socket, :phoenix_channel_join,
      %{params: auth_payload, socket: socket}, fn ->
      ref = make_ref()

      # 👀 A Phoenix.Channel.Server is started here
      case GenServer.start_link(__MODULE__, {socket, auth_payload, self(), ref}) do
        {:ok, pid} ->
          receive do: ({^ref, reply} -> {:ok, reply, pid})
        :ignore ->
          receive do: ({^ref, reply} -> {:error, reply})
        {:error, reason} ->
          Logger.error fn -> Exception.format_exit(reason) end
          {:error, %{reason: "join crashed"}}
      end
    end
  end

  def init({socket, auth_payload, parent, ref}) do
    socket = %{socket | channel_pid: self()}

    # 👀 socket.channel will be Numbers.IntegersChannel here
    case socket.channel.join(socket.topic, auth_payload, socket) do
      {:ok, socket} ->
        join(socket, %{}, parent, ref)
      {:ok, reply, socket} ->
        join(socket, reply, parent, ref)
      {:error, reply} ->
        send(parent, {ref, reply})
        :ignore
      other ->
        # ✂️  error handling omitted
    end
  end

  defp join(socket, reply, parent, ref) do
    PubSub.subscribe(socket.pubsub_server, socket.topic,
      link: true,
      fastlane: {socket.transport_pid,
                 socket.serializer,
                 socket.channel.__intercepts__()})

    send(parent, {ref, reply})
    {:ok, %{socket | joined: true}}
  end
end
```

`Phoenix.Channel.Server.join/2` is called with arguments:

```elixir
# Signature
join(socket, auth_payload)

# Actual Arguments
join(%Phoenix.Socket{
  assigns: %{},
  channel: Numbers.IntegersChannel,
  channel_pid: nil,
  endpoint: Numbers.Endpoint,
  handler: Numbers.UserSocket,
  id: nil,
  joined: false,
  pubsub_server: Numbers.PubSub,
  ref: nil,
  serializer: Phoenix.Transports.WebSocketSerializer,
  topic: "numbers:42",
  transport: Phoenix.Transports.WebSocket,
  transport_name: websocket,
  transport_pid: <0.438.0>},
  %{})
```

and the `Phoenix.Channel.Server.init/1` callback is invoked with arguments:

```elixir
# Signature
init({socket, auth_payload, parent, ref})

# Actual Arguments
init({
  %Phoenix.Socket{
  assigns: %{},
  channel: Numbers.IntegersChannel,
  channel_pid: nil,
  endpoint: Numbers.Endpoint,
  handler: Numbers.UserSocket,
  id: nil,
  joined: false,
  pubsub_server: Numbers.PubSub,
  ref: nil,
  serializer: Phoenix.Transports.WebSocketSerializer,
  topic: "numbers:42",
  transport:Phoenix.Transports.WebSocket,
  transport_name: :websocket,
  transport_pid: <0.438.0>i
},
%{},
<0.438.0>,
#Ref<0.3148875998.1158676484.67712>})
```

Then `Phoenix.Channel.Server.init/1` will call `Phoenix.Channel.Server.join/4`   
which calls `PubSub.subscribe/3` with arguments:

```elixir
# Signature
subscribe(server, topic, opts)

# Actual Arguments
subscribe(Numbers.PubSub,
          "numbers:42",
          link: true,
          fastlane: {<0.291.0>, Phoenix.Transports.WebSocketSerializer, []})
```

File: `lib/phoenix/pubsub.ex` ([link][phoenix-pubsub-pubsub])

```elixir
defmodule Phoenix.PubSub do
  def subscribe(server, topic, opts)
    when is_atom(server) and is_binary(topic) and is_list(opts) do
    call(server, :subscribe, [self(), topic, opts])
  end

  # 👇 For the subscription call/3 will be called with:
  # server here is Numbers.PubSub
  # kind is :subscribe
  defp call(server, kind, args) do
    [{^kind, module, head}] = :ets.lookup(server, kind)
    # :ets.lookup(Numbers.PubSub, :subscribe)
    apply(module, kind, head ++ args)
  end
end
```

The `Numbers.PubSub` named ETS table will have the following entry for `:subscribe`:

```elixir
{:subscribe, Phoenix.PubSub.Local, [Numbers.PubSub, 1]}
```

So `apply(module, kind, head ++ args)` is in this case is a
`Phoenix.PubSub.Local.subscribe/5` call.

File: `lib/phoenix/pubsub/local.ex` ([link][phoenix-pubsub-local])

```elixir
defmodule Phoenix.PubSub.Local do
  # 👇  Will be called with:
  # subscribe(Numbers.PubSub, 1, <0.332.0>, "numbers:42",
  #   link: true, fastlane: {<0.330.0>,Phoenix.Transports.WebSocketSerializer,[]})
  # Also the default pool_size is 1
  def subscribe(pubsub_server, pool_size, pid, topic, opts \\ [])
      when is_atom(pubsub_server) do
    {local, gc} =
      pid
      |> :erlang.phash2(pool_size)
      |> pools_for_shard(pubsub_server)

    :ok = GenServer.call(local, {:monitor, pid, opts})
    true = :ets.insert(gc, {pid, topic})
    # 🔎 :ets.insert(Numbers.PubSub.GC0, {<0.344.0>, "numbers:42"})
    true = :ets.insert(local, {topic, {pid, opts[:fastlane]}})
    # 🔎 :ets.insert(Numbers.PubSub.Local0,
    #  {"numbers:42", {<0.344.0>, {<0.342.0>, Phoenix.Transports.WebSocketSerializer, []}}})

    :ok
  end
end
```

We ended up with 2 new entries in the `Numbers.PubSub.GC0` and
`Numbers.PubSub.Local0` tables. Hopefully it will become clear further
down this post how they're used.


We're done with the subscription part 😅, moving on to the broadcast..

#### Publishing

When we `broadcast/3` from one of our channels, as in the following example:

```elixir
defmodule Numbers.IntegersChannel do
  use Numbers.Web, :channel

  def join("numbers:" <> type, _params, socket) do
      send self(), {:update, type}

      {:ok, socket}
    end
  end

  def handle_info({:update, "42"}, socket) do
    # 👉  We broadcast to all the connected clients
    broadcast socket, "update", %{number: 42}

    {:noreply, socket}
  end
end
```

[Phoenix.Channel.Server.broadcast/3][phoenix-channel-broadcast] will be called.

File: `lib/phoenix/channel/server` ([link][phoenix-channel-server])
```elixir
defmodule Phoenix.Channel.Server do
  # 👇  Will be called with arguments:
  # broadcast(Numbers.PubSub, "numbers:42", "update", %{number: 42})
  def broadcast(pubsub_server, topic, event, payload)
      when is_binary(topic) and is_binary(event) and is_map(payload) do
    PubSub.broadcast pubsub_server, topic, %Broadcast{
      topic: topic,
      event: event,
      payload: payload
    }
  end
end
```

It calls `PubSub.broadcast/3`.

File: `lib/phoenix/pubsub.ex` ([link][phoenix-pubsub-broadcast])

```elixir
defmodule Phoenix.PubSub do
  def broadcast(server, topic, message) when is_atom(server) or is_tuple(server),
      do: call(server, :broadcast, [:none, topic, message])

  defp call(server, kind, args) do
    [{^kind, module, head}] = :ets.lookup(server, kind)
    apply(module, kind, head ++ args)
  end
end
```

Our sample application will have the following entry for  
`:ets.lookup(Numbers.PubSub, :broadcast)`:

```elixir
{:broadcast, Phoenix.PubSub.PG2Server, [Phoenix.Channel.Server, Numbers.PubSub, 1]}
```

So `apply(module, kind, head ++ args)` in this case is a `Phoenix.PubSub.PG2Server.broadcast/6` call.

File: `lib/phoenix/pubsub/pg2_server.ex` ([link][phoenix-pubsub-pg2server])

```elixir
defmodule Phoenix.PubSub.PG2Server do
  # 👇  Will be called with:
  # broadcast(Phoenix.Channel.Server, Numbers.PubSub, 1, :none, "numbers:42",
  #  %Phoenix.Socket.Broadcast{event: "update", payload: %{number: 42}, topic: "numbers:42"})
  def broadcast(fastlane, server_name, pool_size, from_pid, topic, msg) do
    server_name
    |> get_members() # 👉  Returns the Numbers.PubSub registered process
    |> do_broadcast(fastlane, server_name, pool_size, from_pid, topic, msg)
  end

  defp do_broadcast(pids, fastlane, server_name, pool_size, from_pid, topic, msg)
    when is_list(pids) do
    local_node = Phoenix.PubSub.node_name(server_name)

    Enum.each(pids, fn
      pid when is_pid(pid) and node(pid) == node() ->
        Local.broadcast(fastlane, server_name, pool_size, from_pid, topic, msg)
      {^server_name, node_name} when node_name == local_node ->
        # 🏃  Next Phoenix.PubSub.Local.broadcast/6 is called
        Local.broadcast(fastlane, server_name, pool_size, from_pid, topic, msg)
      pid_or_tuple ->
        send(pid_or_tuple, {:forward_to_local, fastlane, from_pid, topic, msg})
    end)
    :ok
  end

  defp get_members(server_name) do
    # 👇  Will be called with:
    # :pg2.get_members({:phx, Numbers.PubSub})
    :pg2.get_members(pg2_namespace(server_name))
  end
end
```

Next `Phoenix.PubSub.Local.broadcast/6` is called.  
File: `lib/phoenix/pubsub/local.ex` ([link][phoenix-pubsub-local])

```elixir
defmodule Phoenix.PubSub.Local do
  # 👇 Will be called with:
  # broadcast(Phoenix.Channel.Server, Numbers.PubSub, 1, :none, "numbers:42", 
  #  %Phoenix.Socket.Broadcast{event: "update", payload: %{number: 42}, topic: "numbers:42"})
  def broadcast(fastlane, pubsub_server, 1 = _pool_size, from, topic, msg)
      when is_atom(pubsub_server) do
    do_broadcast(fastlane, pubsub_server, _shard = 0, from, topic, msg)
    :ok
  end

  defp do_broadcast(fastlane, pubsub_server, shard, from, topic, msg) do
    pubsub_server
    |> subscribers_with_fastlanes(topic, shard)

    # Returns a List of tuples like:
    # => {#PID<0.359.0>, {#PID<0.357.0>, Phoenix.Transports.WebSocketSerializer, []}}
    # Where the <0.359.0> => a Phoenix.Channel.Server process
    # <0.357.0> a cowboy_websocket process
    # and calls Phoenix.Channel.Server.fastlane/3

    |> fastlane.fastlane(from, msg)
  end
end
```

Next `Phoenix.Channel.Server.fastlane/3` is called.  
File: `lib/phoenix/channel/server.ex` ([link][phoenix-channel-server])

```elixir
defmodule Phoenix.Channel.Server do
  # Will be called with:
  # fastlane([{<0.393.0>, {<0.391.0>, Phoenix.Transports.WebSocketSerializer, []}}], 
  # :none,
  # %Phoenix.Socket.Broadcast{event: "update", payload: %{number: 42}, topic: "numbers:42"})
  def fastlane(subscribers, from, %Broadcast{event: event} = msg) do
    Enum.reduce(subscribers, %{}, fn
      {pid, _fastlanes}, cache when pid == from ->
        cache

      {pid, nil}, cache ->
        send(pid, msg)
        cache

      {pid, {fastlane_pid, serializer, event_intercepts}}, cache ->
        # 🤓 Read about message interception
        # https://github.com/phoenixframework/phoenix/blob/v1.2.5/lib/phoenix/channel.ex#L101
        if event in event_intercepts do
          send(pid, msg)
          cache
        else
          case Map.fetch(cache, serializer) do
            {:ok, encoded_msg} ->
              send(fastlane_pid, encoded_msg)
              cache
            :error ->
              # 🔎  serializer here is Phoenix.Transports.WebSocketSerializer
              encoded_msg = serializer.fastlane!(msg)
              # 🔎  fastlane_pid here is a cowboy_websocket process
              send(fastlane_pid, encoded_msg)
              Map.put(cache, serializer, encoded_msg)
          end
        end
    end)
  end
end
```


Next the message is serialized and sent to a `cowboy_websocket` handler process.  
File: `lib/phoenix/transports/websocket_serializer.ex` ([link][phoenix-transports-websocket-serializer])

```elixir
defmodule Phoenix.Transports.WebSocketSerializer do
  @moduledoc false

  @behaviour Phoenix.Transports.Serializer

  alias Phoenix.Socket.Message
  alias Phoenix.Socket.Broadcast

  @doc """
  Translates a `Phoenix.Socket.Broadcast` into a `Phoenix.Socket.Message`.
  """
  def fastlane!(%Broadcast{} = msg) do
    {:socket_push, :text, Poison.encode_to_iodata!(%Message{
      topic: msg.topic,
      event: msg.event,
      payload: msg.payload
    })}
  end
end
```

The message is handled by `Phoenix.Endpoint.CowboyWebSocket.websocket_info/3`.  
File: `lib/phoenix/endpoint/cowboy_web_socket.ex` ([link][phoenix-endpoint-cowboy-websocket])

```elixir
defmodule Phoenix.Endpoint.CowboyWebSocket do
  # Implementation of the WebSocket transport for Cowboy.
  @moduledoc false

  # 🤓  Read about :cowboy_webocket_handler => https://github.com/ninenines/cowboy/blob/1.1.2/src/cowboy_websocket_handler.erl
  @behaviour :cowboy_websocket_handler
  @connection Plug.Adapters.Cowboy.Conn

  def websocket_info(message, req, {handler, state}) do
    handle_reply req, handler, handler.ws_info(message, state)
  end

  defp handle_reply(req, handler, {:reply, {opcode, payload}, new_state}) do
    {:reply, {opcode, payload}, req, {handler, new_state}}
  end
end
```

`Phoenix.Endpoint.CowboyWebSocket.websocket_info/3` is called with arguments:

```elixir
websocket_info(
# message =
{:socket_push, :text,
 [123,
 [[34,["topic"],34],
  58,
  [34,["numbers:42"],34],
  44,
  [34,["ref"],34],
  58,"null",44,
  [34,["payload"],34],
  58,
  [123,[[34,["number"],34],58,"42"],125],
  44,
  [34,["event"],34],
  58,
  [34,["update"],34]],
 125]},

 # message is the charlist format of
 # {"topic": "numbers:42", "ref": "null", "payload": "{\"number\": \"42\"}", "event": "update"}


# req =
{:http_req, #Port<0.12968>, :ranch_tcp, :keepalive, <0.381.0>, "GET", 'HTTP/1.1',
 {{127,0,0,1},50079},
 "localhost", :undefined, 4000, "/socket/websocket", :undefined,
 <<>>, :undefined, :undefined, [], [], [],
 [websocket_version: 13, websocket_compress: false],
 :waiting, <<>>, undefined, false, :done, [], <<>>, undefined},

# {handler, state} =
{Phoenix.Transports.WebSocket,
%{channels:  %{"numbers:42" => <0.383.0>},
   channels_inverse: %{<0.383.0> => {"numbers:42", "1"}},
   serializer: Phoenix.Transports.WebSocketSerializer,
   socket:
     %Phoenix.Socket{
       assigns: %{},
       channel: nil,
       channel_pid: nil,
       endpoint: Numbers.Endpoint,
       handler: Numbers.UserSocket,
       id: nil,
       joined: false,
       pubsub_server: Numbers.PubSub,
       ref: nil,
       serializer: Phoenix.Transports.WebSocketSerializer,
       topic: nil,
       transport: Phoenix.Transports.WebSocket,
       transport_name: :websocket,
       transport_pid: <0.381.0>}}})
```

Finally `Phoenix.Transports.Websocket.ws_info/2` is called.  
File: `lib/phoenix/transports/websocket.ex` ([link][phoenix-transports-websocket])

```elixir
defmodule Phoenix.Transports.WebSocket do
  @behaviour Phoenix.Socket.Transport

  def ws_info({:socket_push, _, _encoded_payload} = msg, state) do
    format_reply(msg, state)
  end

  defp format_reply({:socket_push, encoding, encoded_payload}, state) do
    {:reply, {encoding, encoded_payload}, state}
  end
end
```

At this point it may still not be evident how the return value of
`Phoenix.Endpoint.CowboyWebSocket.websocket_info/3` manages to send data
down the socket. For this to be demystified, proceed to the next
section.

#### Phoenix and Cowboy

When the `numbers` application is started, its `Numbers.Endpoint`
supervisor is started, supervising the following children:

```elixir
Supervisor.which_children Numbers.Endpoint

#=> [{Phoenix.CodeReloader.Server, #PID<0.354.0>, :worker,
#=>   [Phoenix.CodeReloader.Server]},
#=>
#=> {{:node,
#=>   ["node_modules/brunch/bin/brunch", "watch", "--stdin",
#=>   {:cd, "/Users/zorbash/dev/opensource/blog_examples/numbers"}]},
#=> #PID<0.353.0>, :worker, [Phoenix.Endpoint.Watcher]},
#=>
#=> 👇  We'll focus on this supervisor.
#=> It's responsible for the HTTP part of the application
#=> {Phoenix.Endpoint.Server, #PID<0.344.0>, :supervisor,
#=>   [Phoenix.Endpoint.Server]},
#=>
#=> {Phoenix.PubSub.PG2, #PID<0.337.0>, :supervisor, [Phoenix.PubSub.PG2]},
#=>
#=> {Phoenix.Config, #PID<0.336.0>, :worker, [Phoenix.Config]}]
```

File: `lib/phoenix/endpoint/server.ex` ([link][phoenix-endpoint-server])

```elixir
defmodule Phoenix.Endpoint.Server do
  # The supervisor for the underlying handlers.
  @moduledoc false

  use Supervisor
  require Logger

  def start_link(otp_app, endpoint, opts \\ []) do
    Supervisor.start_link(__MODULE__, {otp_app, endpoint}, opts)
  end

  def init({otp_app, endpoint}) do
    handler  = endpoint.config(:handler) # 👉 returns Phoenix.Endpoint.CowboyHandler
    children =
      for {scheme, port} <- [http: 4000, https: 4040],
          config = endpoint.config(scheme) do
        handler.child_spec(scheme, endpoint, default(config, otp_app, port))
        # 👇  Phoenix.Endpoint.child_spec/3 will return:
        # {{:ranch_listener_sup, Numbers.Endpoint.HTTP},
        #  {Phoenix.Endpoint.CowboyHandler, :start_link,
        #   [:http, Numbers.Endpoint,
        #    {:ranch_listener_sup, :start_link,
        #     [Numbers.Endpoint.HTTP, 5, :ranch_tcp, [max_connections: 16384, port: 4000],
        #      :cowboy_protocol,
        #      [env: [dispatch: [{:_, [],
        #          [{["socket", "websocket"], [], Phoenix.Endpoint.CowboyWebSocket,
        #            {Phoenix.Transports.WebSocket,
        #             {Numbers.Endpoint, Numbers.UserSocket, :websocket}}},
        #           {:_, [], Plug.Adapters.Cowboy.Handler,
        #            {Numbers.Endpoint, []}}]}]]]]}]}, 
        #  :permanent, :infinity, :supervisor, [:ranch_listener_sup]}
      end
    supervise(children, strategy: :one_for_one)
  end
end
```

`Phoenix.Endpoint.CowboyWebSocket.start_link/3` will be called by the
`Phoenix.Endpoint.Server` supervisor:

File: `lib/phoenix/endpoint/cowboy_handler.ex` ([link][phoenix-endpoint-cowboy-handler])

```elixir
defmodule Phoenix.Endpoint.CowboyHandler do
  @behaviour Phoenix.Endpoint.Handler
  require Logger

  @doc """
  Generates a childspec to be used in the supervision tree.
  """
  def child_spec(scheme, endpoint, config) do
    if scheme == :https do
      Application.ensure_all_started(:ssl)
    end

    dispatches =
      for {path, socket} <- endpoint.__sockets__,
          {transport, {module, config}} <- socket.__transports__,
          # Allow handlers to be configured at the transport level
          handler = config[:cowboy] || default_for(module),
          do: {Path.join(path, Atom.to_string(transport)),
               handler,
               {module, {endpoint, socket, transport}}}

    dispatches =
      dispatches ++ [{:_, Plug.Adapters.Cowboy.Handler, {endpoint, []}}]

    # Use put_new to allow custom dispatches
    config = Keyword.put_new(config, :dispatch, [{:_, dispatches}])

    {ref, mfa, type, timeout, kind, modules} =
      Plug.Adapters.Cowboy.child_spec(scheme, endpoint, [], config)

    # Rewrite MFA for proper error reporting
    mfa = {__MODULE__, :start_link, [scheme, endpoint, mfa]}
    {ref, mfa, type, timeout, kind, modules}
  end

  defp default_for(Phoenix.Transports.LongPoll), do: Plug.Adapters.Cowboy.Handler
  defp default_for(_), do: nil

  @doc """
  Callback to start the Cowboy endpoint.
  """
  # 👉  start_link/3 will be called with:
  #   [
  #     :http,
  #     Numbers.Endpoint,
  #     {
  #       :ranch_listener_sup, :start_link, [
  #         Numbers.Endpoint.HTTP, 5, :ranch_tcp, [max_connections: 16384, port: 4000],
  #         :cowboy_protocol, [env: [dispatch: [{:_, [],
  #           [{["socket", "websocket"], [], Phoenix.Endpoint.CowboyWebSocket,
  #             {Phoenix.Transports.WebSocket,
  #               {Numbers.Endpoint, Numbers.UserSocket, :websocket}}},
  #           {:_, [], Plug.Adapters.Cowboy.Handler,
  #             {Numbers.Endpoint, []}}]}]]]
  #       ]
  #     }
  #   ]
  # ✂️  Parts of the env responsible for livereloading have been omitted.
  def start_link(scheme, endpoint, {m, f, [ref | _] = a}) do
    # ref is used by Ranch to identify its listeners, defaulting
    # to plug.HTTP and plug.HTTPS and overridable by users.
    # 👀  apply/3 becomes :ranch_listener_sup.start_link/6
    case apply(m, f, a) do
      {:ok, pid} ->
        Logger.info info(scheme, endpoint, ref)
        {:ok, pid}

      {:error, {:shutdown, {_, _, {{_, {:error, :eaddrinuse}}, _}}}} = error ->
        Logger.error [info(scheme, endpoint, ref), " failed, port already in use"]
        error

      {:error, _} = error ->
        error
    end
  end
end
```

Next `:ranch_listener_sup.start_link/6` is called.

File: `src/ranch_listener_sup.erl` ([link][ranch_listener_sup])

```erlang
-module(ranch_listener_sup).
-behaviour(supervisor).

-export([start_link/6]).
-export([init/1]).

-spec start_link(ranch:ref(), non_neg_integer(), module(), any(), module(), any())
	-> {ok, pid()}.

% 👉  start_link/6 is called as:
% start_link(
% Ref = Numbers.Endpoint.HTTP,
% NbAcceptors = 5,
% Transport = :ranch_tcp,
% TransOpts = [max_connections: 16384, port: 4000],
% Protocol = :cowboy_protocol,
% ProtoOpts = [env:
% [dispatch: [{:_, [],
%   [{["socket", "websocket"], [], Phoenix.Endpoint.CowboyWebSocket,
%      {Phoenix.Transports.WebSocket,
%        {Numbers.Endpoint, Numbers.UserSocket, :websocket}}},
%    {:_, [], Plug.Adapters.Cowboy.Handler,
%      {Numbers.Endpoint, []}}]}]]
% ]
start_link(Ref, NbAcceptors, Transport, TransOpts, Protocol, ProtoOpts) ->
	MaxConns = proplists:get_value(max_connections, TransOpts, 1024),
        % 👀  The options of the new listener are kept in an ETS table
	ranch_server:set_new_listener_opts(Ref, MaxConns, ProtoOpts),
	supervisor:start_link(?MODULE, {
		Ref, NbAcceptors, Transport, TransOpts, Protocol
	}).

init({Ref, NbAcceptors, Transport, TransOpts, Protocol}) ->
	AckTimeout = proplists:get_value(ack_timeout, TransOpts, 5000),
	ConnType = proplists:get_value(connection_type, TransOpts, worker),
	Shutdown = proplists:get_value(shutdown, TransOpts, 5000),
	ChildSpecs = [
		{ranch_conns_sup, {ranch_conns_sup, start_link,
				[Ref, ConnType, Shutdown, Transport, AckTimeout, Protocol]},
			permanent, infinity, supervisor, [ranch_conns_sup]},
		{ranch_acceptors_sup, {ranch_acceptors_sup, start_link,
				[Ref, NbAcceptors, Transport, TransOpts]},
			permanent, infinity, supervisor, [ranch_acceptors_sup]}
	],
	{ok, {{rest_for_one, 10, 10}, ChildSpecs}}.
```

We can fetch (or even modify 🙈) the listener opts:

```elixir
:ets.lookup :ranch_server, {:opts, Numbers.Endpoint.HTTP}
[{{:opts, Numbers.Endpoint.HTTP},
  [env: [dispatch: [{:_, [],
      [{["socket", "websocket"], [], Phoenix.Endpoint.CowboyWebSocket,
        {Phoenix.Transports.WebSocket,
         {Numbers.Endpoint, Numbers.UserSocket, :websocket}}},
       {:_, [], Plug.Adapters.Cowboy.Handler, {Numbers.Endpoint, []}}]}]]]}]
```

The `Phoenix.Endpoint.Server` will supervise the following children:

```elixir
[{{:ranch_listener_sup, Numbers.Endpoint.HTTP}, #PID<0.345.0>, :supervisor,
  [:ranch_listener_sup]}]
  ```

and that child will supervise:

```elixir
[{:ranch_acceptors_sup, #PID<0.350.0>, :supervisor, [:ranch_acceptors_sup]},
 {:ranch_conns_sup, #PID<0.349.0>, :supervisor, [:ranch_conns_sup]}]
```


<a href="/images/posts/phoenix_under_a_microscope/ranch_sups.png" target="_blank">
  <img src="/images/posts/phoenix_under_a_microscope/ranch_sups.png" class="img-medium" alt="observer">
</a>

A `ranch_acceptors_sup` uses `ranch_tcp.listen/1` to start listening.

`ranch_tcp` is a wrapper around [gen_tcp][gen_tcp] and [gen_tcp.listen/2][gen_tcp-listen-2] sets up a socket
to listen on a random port on the local host.

`ranch_acceptors_sup` then starts a pool of acceptor supervised processes.

Each one of them waits (with `:infinity` timeout) to accept a connection
on the listening socket.

If a connection is established, the `ranch_acceptor` will transfer the
control of the socket to the connections supervisor so that it receives
messages from the socket.

When a TCP connection is established `ranch_conns_sup` will start a `cowboy_protocol` process using [:cowboy_protocol.start_link/4][cowboy_protocol-start_link-4]. When the `cowboy_protocol` process is started successfully, `ranch_conns_sup` will transfer the control
of the socket to that process so that it receives messages from the socket.

The `cowboy_protocol` handler is responsible for receiving and parsing messages of the HTTP protocol. It handles requests
by executing all the layers of its middleware stack. By default this
stack contains [`cowboy_router`][cowboy_router].

`cowboy_router.execute/2` will be called as:

```elixir
:cowboy_router.execute({
  :http_req, #Port<0.12695>, :ranch_tcp, :keepalive, <0.371.0>, "GET", 'HTTP/1.1',
  {{127,0,0,1},61936},
  "localhost>, :undefined, 4000, "/socket/websocket", :undefined,
  <<>>, :undefined, :undefined,
  [{"host", "localhost:4000"},
  {"connection", "Upgrade"},
  {"upgrade", "websocket"},
  {"sec-websocket-version", "13"},
  {"sec-websocket-key", "IpbxMsfW2JriERk8clVssw=="},
  {"origin", "http://localhost"}],
  [{"connection", ["upgrade"]}],
  :undefined, [], :waiting, <<>>, :undefined, false, :waiting, [], <<>>, :undefined},

  [{:listener, Numbers.Endpoint.HTTP},
    {:dispatch,
    [{'_',[],
    [{["socket", "websocket"],
    [], Phoenix.Endpoint.CowboyWebSocket,
    {Phoenix.Transports.WebSocket,
    {Numbers.Endpoint, Numbers.UserSocket, :websocket}}},
    {'_', [], Plug.Adapters.Cowboy.Handler,
    {Numbers.Endpoint, []}}]}]}]
)
```

It will dispatch the GET `/socket/websocket` request to [Phoenix.Endpoint.CowboyWebSocket][phoenix-endpoint-cowboy-websocket] which
has the behaviour of `:cowboy_websocket_handler`.

File: `lib/phoenix/endpoint/cowboy_websocket.ex` ([link][phoenix-endpoint-cowboy-websocket])

```elixir
defmodule Phoenix.Endpoint.CowboyWebSocket do
  # Implementation of the WebSocket transport for Cowboy.
  @moduledoc false

  @behaviour :cowboy_websocket_handler
  @connection Plug.Adapters.Cowboy.Conn
  @already_sent {:plug_conn, :sent}

  # 👇 Phoenix.Endpoint.CowboyWebSocket.init/3 will be called with:
  # {transport, :http} = {:tcp, :http},
  #
  # req = {:http_req, #Port<0.12671>, :ranch_tcp, :keepalive, #PID<0.356.0>, "GET",
  #     :"HTTP/1.1", {{127, 0, 0, 1}, 60935}, "localhost", :undefined, 4000,
  #     "/socket/websocket", :undefined, "", :undefined, [],
  #     [{"host", "localhost:4000"}, {"connection", "Upgrade"},
  #     {"upgrade", "websocket"}, {"sec-websocket-version", "13"},
  #     {"sec-websocket-key", "Is5bfu9A9tnZ9AO/V0vrEg=="},
  #     {"origin", "http://localhost"}], [{"connection", ["upgrade"]}], :undefined,
  #     [], :waiting, "", :undefined, false, :waiting, [], "", :undefined},
  #
  # {module, opts} = {Phoenix.Transports.WebSocket, {Numbers.Endpoint, Numbers.UserSocket, :websocket}}
  def init({transport, :http}, req, {module, opts}) when transport in [:tcp, :ssl] do
    conn = @connection.conn(req, transport)
    try do
      # 👀  Phoenix.Transports.WebSocket.init/2 is called here
      case module.init(conn, opts) do
        {:ok, %{adapter: {@connection, req}}, args} ->
          {:upgrade, :protocol, __MODULE__, req, args}
        {:error, %{adapter: {@connection, req}}} ->
          {:shutdown, req, :no_state}
      end
    catch
      kind, reason ->
        # Although we are not performing a call, we are using the call
        # function for now so it is properly handled in error reports.
        mfa = {module, :call, [conn, opts]}
        {:upgrade, :protocol, __MODULE__, req, {:error, mfa, kind, reason, System.stacktrace}}
    after
      receive do
        @already_sent -> :ok
      after
        0 -> :ok
      end
    end
  end

  def upgrade(req, env, __MODULE__, {handler, opts}) do
    args = [req, env, __MODULE__, {handler, opts}]
    resume(:cowboy_websocket, :upgrade, args)
  end

  def resume(module, fun, args) do
      apply(module, fun, args)
    # ✂️  error handling omitted
  end

  ## Websocket callbacks

  # 👇  websocket_init/3 will be called with:
  # _transport = tcp,
  #
  # req = {
  #   :http_req, #Port<0.12964>, :ranch_tcp, :keepalive, <0.373.0>, "GET", 'HTTP/1.1',
  #     {{127,0,0,1},50034},
  #     "localhost", :undefined, 4000, "/socket/websocket",undefined,
  #     <<>>, :undefined, [],
  #     [{"host", "localhost:4000"},
  #      {"connection", "Upgrade"},
  #      {"upgrade", "websocket"},
  #      {"sec-websocket-version", "13"},
  #      {"sec-websocket-key", "kxCvlKM3nApp8UdFrqh9Ug=="},
  #      {"origin", "http://localhost">>}],
  #     [{"upgrade",["websocket"]},
  #      {"connection",["upgrade"]}],
  #     :undefined,
  #     [{:websocket_version,13},{:websocket_compress,false}],
  #     :waiting,<<>>,:undefined,false,:waiting,[],<<>>,:undefined},
  #
  # {handler, args} = {Phoenix.Transports.WebSocket,
  #   {%Phoenix.Socket{assigns => %{},channel => nil,
  #        channel_pid => nil,endpoint => Numbers.Endpoint,
  #        handler => Numbers.UserSocket, id => nil,joined => false,
  #        pubsub_server => Numbers.PubSub,ref => nil,
  #        serializer => Phoenix.Transports.WebSocketSerializer,
  #        topic => nil, transport => Phoenix.Transports.WebSocket,
  #        transport_name => websocket,transport_pid => <0.373.0>},
  #      [{:serializer, Phoenix.Transports.WebSocketSerializer},
  #       {:transport_log,false},
  #       {:timeout, :infinity},
  #       {:acceptors,5}]}})
  def websocket_init(_transport, req, {handler, args}) do
    {:ok, state, timeout} = handler.ws_init(args)
    {:ok, :cowboy_req.compact(req), {handler, state}, timeout}
  end
end
```

Phoenix will respond with:

```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

which is generated from ([link][http-upgrade-response]) and concludes the WebSocket handshake, so that the data transfer starts.
It is now a two-way communication channel where each side can, independently from the other, send data at will.

> After a successful handshake, clients and servers transfer data back
> and forth in conceptual units referred to in this specification as
> "messages". On the wire, a message is composed of one or more frames

With an established WebSocket connection, a client (`phoenix.js`, see [link][phoenix.js-join]) will push a:

```json
{"topic":"numbers:42","event":"phx_join","payload":{},"ref":"1"}
```

The `cowboy_websocket` processs, which has the control of the socket,
receives a message in its mailbox, decodes it (WebSocket Protocol) and
calls `Phoenix.Endpoint.CowboyWebSocket.websocket_handle/3` as follows:

```elixir
Phoenix.Endpoint.CowboyWebSocket.websocket_handle
{opcode, payload} = {:text, "{\"topic\":\"numbers:42\" ,\"event\":\"phx_join\",\"payload\":{},\"ref\":\"1\"}"}

req = {:http_req, #Port<0.12964>, :ranch_tcp, :keepalive, <0.373.0>, "GET",'HTTP/1.1',
  {{127,0,0,1},50034},
  "localhost", :undefined, 4000, "/socket/websocket", :undefined,
  <<>>,:undefined,:undefined,[],[],[],
  [{websocket_version,13},{websocket_compress,false}],
  waiting,<<>>,:undefined,false,done,[],<<>>,:undefined}

{handler, state} = {Phoenix.Transports.WebSocket,
  %{channels: %{}, channels_inverse: %{},
    serializer: Phoenix.Transports.WebSocketSerializer,
    socket: %Phoenix.Socket{assigns: %{},
      channel: nil,
      channel_pid: nil,
      endpoint => Numbers.Endpoint,
      handler => Numbers.UserSocket,
      id => nil,
      joined => false,
      pubsub_server => Numbers.PubSub,
      ref => nil,
      serializer => Phoenix.Transports.WebSocketSerializer,
      topic => nil,
      transport => Phoenix.Transports.WebSocket,
      transport_name => websocket,transport_pid => <0.373.0>}}})
```

Then `Phoenix.Transports.WebSocket.ws_handle/3` is called which parses
the message as JSON and calls `Phoenix.Socket.Transport.dispatch/3`
which will pattern-match on the `event` part of the message so that
`phx_join` will finally call `Phoenix.Channel.Server.join/2`.
What happens next has already been described in the [subscribing][subscribing] section.


## Debugging WebSockets Essentials

Armed with some knowledge about the inner-workings of Phoenix, we can
have some common questions answered. Use the following code snippets
with caution in production environments, as some of the Phoenix
functions used are documented as:

```
This is an expensive and private operation. DO NOT USE IT IN PROD.
```

Getting a list of all the topics which have subscribers:

```elixir
pool_size = Application.get_env(:numbers, Numbers.Endpoint)[:pubsub][:pool_size]
0..(pool_size - 1) |> Enum.flat_map &Phoenix.PubSub.Local.list(Numbers.PubSub, &1)

#=> ["numbers:42"]
```

💡  Keep in mind that the default `pool_size` is 1.

Getting the subscribers for a topic:

```elixir
pool_size = Application.get_env(:numbers, Numbers.Endpoint)[:pubsub][:pool_size]
0..(pool_size - 1) |> Enum.flat_map &Phoenix.PubSub.Local.subscribers(Numbers.PubSub, "numbers:42", &1)

#=> [#PID<0.273.0>]
```

Getting the subscribers for a topic across nodes:

```elixir
# With the assumptions that all the connected nodes are members of the PubSub cluster:
pool_size = Application.get_env(:numbers, Numbers.Endpoint)[:pubsub][:pool_size]
fun = &Phoenix.PubSub.Local.subscribers(Numbers.PubSub, "numbers:42", &1)
:rpc.multicall [node() | Node.list], Enum, :flat_map, [0..(pool_size - 1), fun]

#=> {[[#PID<0.19570.2363>, #PID<0.4457.2620>, #PID<0.18260.2750>, #PID<0.6396.2762>,
#=>   #PID<0.7481.2801>, #PID<0.2731.2866>, #PID<0.13608.2904>,
#=>   #PID<0.20333.2910>],
#=>   [#PID<37723.31494.2599>, #PID<37723.20571.2660>, #PID<37723.26132.2671>,
#=>   #PID<37723.30777.2690>, #PID<37723.23804.2712>, #PID<37723.27526.2731>,
#=>   #PID<37723.7742.2776>]], []}

# If you don't like assumptions you can use this to get the actual nodes (with Phoenix.PubSub.PG2 adapter):
nodes = :pg2.get_members({:phx, Numbers.PubSub}) |> Enum.map(&node/1)
[:"numbers1@autoverse", :"numbers2@autoverse"]
```


Getting the socket state for a subscriber:

```elixir
# Using the pid from the previous example
:recon.get_state '<0.273.0>'

#=> %Phoenix.Socket{assigns: %{}, channel: Numbers.IntegersChannel,
#=>  channel_pid: #PID<0.273.0>, endpoint: Numbers.Endpoint,
#=>  handler: Numbers.UserSocket, id: "users_socket:42",
#=>  joined: true, pubsub_server: Numbers.PubSub, ref: nil,
#=>  serializer: Phoenix.Transports.WebSocketSerializer, topic: "numbers:42",
#=>  transport: Phoenix.Transports.WebSocket, transport_name: :websocket,
#=>  transport_pid: #PID<0.271.0>}

# You may as well use :sys.get_state/2 but always mind to provide a timeout
:sys.get_state pid("0.273.0"), 1000
```

Getting the subscriptions of a client by IP address:

You can use `:inet.i`

> Lists all TCP and UDP sockets, including those that the Erlang runtime
> system uses as well as those you have created

<div class="highlight-small">
{{< highlight elixir >}}
iex(numbers@autoverse)2> :inet.i
Port  Module   Recv   Sent  Owner     Local Address       Foreign Address      State     Type
57824  inet_tcp 1932   242 <0.9779.2801>  10.16.194.182:4000  10.16.74.135:54514  ????   STREAM
580432  inet_tcp 1095  130 <0.9683.2817>  10.16.194.182:4000  10.16.74.135:55660  ????   STREAM
581976  inet_tcp 1653  110 <0.9693.2818>  10.16.194.182:4000  10.16.74.135:59498  ????   STREAM
583824  inet_tcp 474   129 <0.239.0>  10.16.194.182:4000  10.16.10.150:59540  ????   STREAM
584016  inet_tcp 565   218 <0.22683.2819> 10.16.194.182:4000  10.16.74.135:36924  ????   STREAM
{{< / highlight >}}
</div>

Let's say that we're interested for the subscriptions of `10.16.74.150`.
A heuristic would be to get the processes spawned by the owner process of the socket:

```elixir
owner = pid "0.239.0"
links = Process.info(owner, [:links])[:links]
pids = for pid <- links, pid > owner, do: pid

#=> [#PID<0.241.0>, #PID<0.246.0>]
```

Alternatively you can use `:recon.tcp` to enumerate the TCP ports and
keep the ones matching the IP as `peername`:

```elixir
search_ip = {10,16,74,150}
:recon.tcp |> Enum.map(&:recon.port_info/1) |> Enum.filter(fn port ->
  case port[:type][:peername] do
    {^search_ip, _} -> true
    _ -> false
  end
end)
|> Enum.map(&(&1[:signals][:connected]))
```

### Recon

> Recon is a library to be dropped into any other Erlang project, to be used to assist DevOps people diagnose problems in production nodes.

I've found [recon][recon] to be an indispensable tool for both regular debugging and critical production issues.

A handful of WebSocket related traces you can attempt with recon are:

```elixir
# Trace the next 100 subscriptions for the Numbers Phoenix app
:recon_trace.calls {:ets, :insert, [{[:"Elixir.Numbers.PubSub.Local0", :_], [], [:"$_"]}]}, 100

#=> 0:28:39.377466 <0.621.0> ets:insert('Elixir.Numbers.PubSub.Local0', {<<"numbers:42">>,
#=>  {<0.621.0>,{<0.619.0>,'Elixir.Phoenix.Transports.WebSocketSerializer',[]}}})
```

```elixir
# Trace the next 50 subscriptions for the Numbers Phoenix app
:recon_trace.calls {:ets, :insert, [{[:"Elixir.Numbers.PubSub.Local0", :_], [], [:"$_"]}]}, 100

#=> 0:28:39.377466 <0.621.0> ets:insert('Elixir.Numbers.PubSub.Local0', {<<"numbers:42">>,
#=>  {<0.621.0>,{<0.619.0>,'Elixir.Phoenix.Transports.WebSocketSerializer',[]}}})
```

```elixir
:recon.get_state '<0.621.0>'
#=> %Phoenix.Socket{assigns: %{}, channel: Numbers.IntegersChannel,
#=>  channel_pid: #PID<0.621.0>, endpoint: Numbers.Endpoint,
#=>  handler: Numbers.UserSocket, id: nil, joined: true,
#=>  pubsub_server: Numbers.PubSub, ref: nil,
#=>  serializer: Phoenix.Transports.WebSocketSerializer, topic: "numbers:42",
#=>  transport: Phoenix.Transports.WebSocket, transport_name: :websocket,
#=>  transport_pid: #PID<0.619.0>}
```

```elixir
# Trace the next 10 calls to pg2.get_members/1 and show the return value
:recon_trace {:pg2, :get_members, [{:_, [], [{:return_trace}]}]}, 10

#=> 1:15:03.621778 <0.706.0> pg2:get_members({phx,'Elixir.Numbers.PubSub'})
#=> 1:15:03.621956 <0.706.0> pg2:get_members/1 --> [<0.279.0>]

# In a distributed Phoenix scenario, we'd get something like:
#=> 1:30:41.842307 <0.257.0> pg2:get_members({phx,'Elixir.Numbers.PubSub'})
#=> 1:30:41.845794 <0.257.0> pg2:get_members/1 --> [<0.279.0>,<16611.342.0>]
```

If you find it hard to build complex match specs by hand 🙀, you can try
[ex2ms][ex2ms] which is a rough equivalent of [:dbg.fun2ms/1][dbg-fun2ms] or [:ets.fun2ms/1][ets-fun2ms].

## Conclusion

The Phoenix codebase is a very interesting one and there's lot to learn
for it. I really hope that sharing my quest to understand and explore
Phoenix will be beneficial for others. If you found a mistake please
blah

<style>
.main-header {
  background-size: 32% auto;
}
.nodes-smalltext {
  font-size: 70%;
  padding: 0;
}

.highlight {
  line-height: 20px;
}

.highlight-small {
  font-size: 1.6rem;
}
</style>

[phoenix]: http://phoenixframework.org/
[observer]: http://erlang.org/doc/apps/observer/observer_ug.html
[observer_cli]: https://github.com/zhongwencool/observer_cli
[recon]: http://ferd.github.io/recon/
[recon-get_state]: http://ferd.github.io/recon/recon.html#get_state-1
[phoenix-channels]: https://hexdocs.pm/phoenix/channels.html#content
[brunch]: http://brunch.io/
[wsta]: https://github.com/esphen/wsta
[transports-websocket]: https://hexdocs.pm/phoenix/Phoenix.Transports.WebSocket.html#module-configuration
[phoenix-channel]: https://hexdocs.pm/phoenix/Phoenix.Channel.html#summary
[ranch]: https://ninenines.eu/docs/en/ranch/1.3/guide/introduction/
[cowboy_websocket-handler_loop]: https://github.com/ninenines/cowboy/blob/1.1.2/src/cowboy_websocket.erl#L211
[ranch_conns_sup]: https://github.com/ninenines/ranch/blob/1.3.2/src/ranch_conns_sup.erl
[ranch_listener_sup]: https://github.com/ninenines/ranch/blob/1.3.2/src/ranch_listener_sup.erl
[presence]: https://hexdocs.pm/phoenix/Phoenix.Presence.html
[channel-push-3]: https://hexdocs.pm/phoenix/1.2.5/Phoenix.Channel.html#push/3
[channel-broadcast_from-3]: https://hexdocs.pm/phoenix/1.2.5/Phoenix.Channel.html#broadcast_from/3
[channel-broadcast-3]: https://hexdocs.pm/phoenix/1.2.5/Phoenix.Channel.html#broadcast/3
[cowboy-announcement]: https://ninenines.eu/articles/cowboy-2.0.0/
[cowboy-talk]: https://ninenines.eu/talks/cowboy-2/#/10
[cowlib]: https://github.com/ninenines/cowlib
[cowlib-http]:https://github.com/ninenines/cowlib/blob/master/src/cow_http.erl#L38
[cowboy-2-pr]: https://github.com/elixir-plug/plug/pull/604
[phoenix_pubsub]: https://github.com/phoenixframework/phoenix_pubsub
[phoenix-channel-server]: https://github.com/phoenixframework/phoenix/blob/v1.2.5/lib/phoenix/channel/server.ex#L22
[phoenix-channel-broadcast]: https://github.com/phoenixframework/phoenix/blob/v1.2.5/lib/phoenix/channel/server.ex#L72
[phoenix-transport-socket]: https://github.com/phoenixframework/phoenix/blob/v1.2.5/lib/phoenix/socket/transport.ex#L147
[phoenix-pubsub-broadcast]: https://github.com/phoenixframework/phoenix_pubsub/blob/master/lib/phoenix/pubsub.ex#L186
[pg2]: http://erlang.org/doc/man/pg2.html
[phoenix-pubsub-pg2server]: https://github.com/phoenixframework/phoenix_pubsub/blob/master/lib/phoenix/pubsub/pg2_server.ex
[phoenix-pubsub-local]: https://github.com/phoenixframework/phoenix_pubsub/blob/master/lib/phoenix/pubsub/local.ex
[phoenix-socket-transport-connect]: https://github.com/phoenixframework/phoenix/blob/v1.2.5/lib/phoenix/socket/transport.ex#L147
[phoenix-channel-server]: https://github.com/phoenixframework/phoenix/blob/v1.2.5/lib/phoenix/channel/server.ex
[phoenix-transports-websocket-serializer]: https://github.com/phoenixframework/phoenix/blob/v1.2.5/lib/phoenix/transports/websocket_serializer.ex
[phoenix-endpoint-cowboy-websocket]: https://github.com/phoenixframework/phoenix/blob/v1.2.5/lib/phoenix/endpoint/cowboy_websocket.ex
[cowboy_websocket_handler]: https://github.com/ninenines/cowboy/blob/1.1.2/src/cowboy_websocket_handler.erl
[phoenix-pubsub-pubsub]: https://github.com/phoenixframework/phoenix_pubsub/blob/v1.0.2/lib/phoenix/pubsub.ex
[phoenix-pubsub-local]: https://github.com/phoenixframework/phoenix_pubsub/blob/master/lib/phoenix/pubsub/local.ex
[phoenix-transports-websocket]: https://github.com/phoenixframework/phoenix/blob/v1.2.5/lib/phoenix/transports/websocket.ex
[phoenix-endpoint-cowboy-handler]: https://github.com/phoenixframework/phoenix/blob/v1.2.5/lib/phoenix/endpoint/cowboy_handler.ex
[phoenix-endpoint-server]: https://github.com/phoenixframework/phoenix/blob/v1.2.5/lib/phoenix/endpoint/server.ex
[rfc6455]: https://tools.ietf.org/html/rfc6455#page-4
[ex2ms]: https://github.com/ericmj/ex2ms
[dbg-fun2ms]: http://erlang.org/doc/man/dbg.html#fun2ms-1
[ets-fun2ms]: http://erlang.org/doc/man/ets.html#fun2ms-1
[ranch_listener_sup]: https://github.com/ninenines/ranch/blob/1.2.0/src/ranch_listener_sup.erl
[previous-post]: {{< relref "post/debugging-elixir-applications.md" >}}
[ruby-under-a-microscope]: http://patshaughnessy.net/ruby-under-a-microscope
[pat-shaughenessy]: https://twitter.com/pat_shaughnessy
[gen_tcp]: http://erlang.org/doc/man/gen_tcp.html
[gen_tcp-listen-2]: http://erlang.org/doc/man/gen_tcp.html#listen-2
[cowboy_protocol-start_link-4]: https://github.com/ninenines/cowboy/blob/1.1.2/src/cowboy_protocol.erl#L64
[cowboy_router]: https://github.com/ninenines/cowboy/blob/1.1.2/src/cowboy_router.erl
[http-upgrade-response]: https://github.com/ninenines/cowboy/blob/1.1.2/src/cowboy_websocket.erl#L173-L175

[recap]: {{< ref "#phoenix-and-cowboy" >}}
[subscribing]: {{< ref "#subscribing" >}}
[phoenix.js-join]: https://github.com/phoenixframework/phoenix/blob/v1.2.5/web/static/js/phoenix.js#L292

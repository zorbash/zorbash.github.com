+++
author = "Dimitris Zorbas"
date = "2017-09-17"
draft = false
title = "Debugging & Tracing Elixir Applications"
image = "images/posts/elixir-horizontal.png"
tags = ["debugging", "phoenix", "elixir", "erlang", "distributed", "cheatsheet"]
comments = true
share = true
+++


This post describes a few useful techniques to debug running [Erlang][erlang] / [Elixir][elixir] applications.
It is meant to be a cheatsheet of things you can do to inspect and alter the state of an application without requiring the
installation of packages.

For any of the code snippets below, `autoverse` refers to my local hostname, which itself refers
to one of my favourite science fiction novels, "[Permutation City][permutation-city]" by [Greg Egan][greg-egan].

## Connecting to a Running Application

Start the mix application:

```shell
iex --sname example --cookie test -S mix
```

### Get a Remote shell

For a regular Elixir application started with a name and a cookie, you can get a remote shell using:

```shell
# Where cookie has to be the exact same as the one for the application you wish to connect to
# The name can be any valid name
iex --sname tracer --cookie test --remsh example@autoverse
```

## Distillery Release Debugging

This section is specific to [Distillery][distillery] releases. You may find my previous guide about
[distillery releases][distillery-releases-post] useful at this point.

For an application named `example` which is released with:

```shell
mix release --env=prod
```

You can start the release with:

```elixir
./_build/prod/rel/example foreground
```

You can connect to the node you just started using:

```elixir
./_build/prod/rel/example remote_console
```

The boot script (in our case `./_build/prod/rel/example`) is created from [boot.eex][distillery-boot-template])
supports a variety of options supplied as env vars. A very useful one
for debugging is `DEBUG_BOOT`. You can set it to `true` to enable verbose
output of the commands being executed by the script.

```elixir
DEBUG_BOOT=true ./_build/prod/rel/example remote_console
```

## Application Debugging

There are plenty of tools to inspect the state of a running application in the Erlang / Elixir ecosystem.
Observer is arguably the most popular ones and is part of OTP.
Unfortunately in some of cases it's not trivial to run it in production in your stack
(imagine Docker (Linux) in production and macOS locally).

### IEx.Helpers

If you arent't already familiar with the `IEx.Helpers` functions, take some time and do it, it's worth it.

Read [IEx.Helpers.break/2][iex-break] on how to set up breakpoints (not for production 💣).

Remember that you can print help info for a module, function or macro using [IEx.Helpers.h/1][iex-helpers-h-1].

```elixir
h Genserver
#=>                                    GenServer
#=>
#=> A behaviour module for implementing the server of a client-server relation.
#=>
#=> A GenServer is a process like any other Elixir process and it can be used to
#=> keep state, execute code asynchronously and so on. The advantage of using a
#=> ..more

# Get type information using IEx.Helpers.i/1
i "Hello!"

#=> Term
#=>   "Hello"
#=> Data type
#=>   BitString
#=> ..more
```

### OTP Behaviour Tracing

You can use functions of the [:sys][erlang-sys-module] module to trace OTP behaviours or your
own [special processes][erlang-special-processes].

I strongly suggest reading Chapter 5 of the amazing
[Designing for Scalability with Erlang/OTP][designing-scalability-book] book for
a detailed exploration of the debugging facilities of OTP behaviours.

You can use [`:sys.get_state/1`][sys_get_state] to get the state of a process:

```elixir
{:ok, pid} = Agent.start fn -> [:erlang.unique_integer] end

:sys.get_state pid
#=> [-576460752303423368]
```

You can replace the state of a running process using [`:sys.replace_state/2`][sys_replace_state]:

```elixir
{:ok, pid} = Agent.start fn -> [:erlang.unique_integer] end

:sys.replace_state pid, fn (state) -> [:erlang.unique_integer([:positive]) | state] end
#=> [154, -576460752303423368]
```

You can log events using [`:sys.log/2`][sys_log]:

```elixir
{:ok, pid} = Agent.start fn -> [4242] end

# Enable logging and raise the limit of events to be logged to 100
:sys.log(pid, {true, 100})

Agent.get(pid, &(&1))

:sys.log pid, :get

#=> {:ok,
#=>  [{{:in,
#=>     {:"$gen_call", {#PID<0.73.0>, #Reference<0.0.8.303>},
#=>      {:get, #Function<6.54118792/1 in :erl_eval.expr/5>}}}, #PID<0.102.0>,
#=>    #Function<0.40920150/3 in :gen_server.decode_msg/8>},
#=>   {{:out, [4242], #PID<0.73.0>, [4242]}, #PID<0.102.0>,
#=>    #Function<6.40920150/3 in :gen_server.reply/5>}]}

:sys.log pid, :print
#=> *DBG* <0.102.0> got call {get,#Fun<erl_eval.6.54118792>} from [4242]
#=> *DBG* <0.102.0> sent foo to [4242], new state foo

:sys.get_status pid

#=> {:status, #PID<0.102.0>, {:module, :gen_server},
#=>  [["$ancestors": [#PID<0.73.0>, #PID<0.48.0>],
#=>    "$initial_call": {:erl_eval, :"-expr/5-fun-3-", 0}], :running, #PID<0.102.0>,
#=>   [log: {10,
#=>     [{{:out, [4242], #PID<0.73.0>, [4242]}, #PID<0.102.0>,
#=>       #Function<6.40920150/3 in :gen_server.reply/5>},
#=>      {{:in,
#=>        {:"$gen_call", {#PID<0.73.0>, #Reference<0.0.8.303>},
#=>         {:get, #Function<6.54118792/1 in :erl_eval.expr/5>}}}, #PID<0.102.0>,
#=>       #Function<0.40920150/3 in :gen_server.decode_msg/8>}]}],
#=>   [header: 'Status for generic server <0.102.0>',
#=>    data: [{'Status', :running}, {'Parent', #PID<0.102.0>},
#=>     {'Logged events',
#=>      {10,
#=>       [{{:out, [4242], #PID<0.73.0>, [4242]}, #PID<0.102.0>,
#=>         #Function<6.40920150/3 in :gen_server.reply/5>},
#=>        {{:in,
#=>          {:"$gen_call", {#PID<0.73.0>, #Reference<0.0.8.303>},
#=>           {:get, #Function<6.54118792/1 in :erl_eval.expr/5>}}}, #PID<0.102.0>,
#=>         #Function<0.40920150/3 in :gen_server.decode_msg/8>}]}}],
#=>    data: [{'State', [4242]}]]]}


# Start tracing a process, with trace info printed in the standard output
:sys.trace pid, true

send pid, :foo
*DBG* <0.73.0> got foo
*DBG* <0.73.0> new state foo
```

You can get statistics for a process using [`:sys.statistics/2`][sys_statistics]

```elixir
{:ok, pid} = Agent.start fn -> [] end

# Enable statistics gathering for the process
:sys.statistics pid, true

send pid, :something

# Fetch statistics for the process
:sys.statistics pid, :get

#=> {:ok,
#=>  [start_time: {{2017, 9, 13}, {0, 46, 42}},
#=>   current_time: {{2017, 9, 13}, {0, 49, 47}}, reductions: 285, messages_in: 1,
#=>   messages_out: 0]}
```

⚠️   Keep in mind that the above sys functions are implemented as synchronous calls.
See [here][otp-send_system_msg] for the implementation.

This means that the process in question may not respond right away.

For that reason, such functions, support passing a timeout, to specify the amount of time to wait for a response, as the last argument.

⛑  Remember to turn debugging off when you're done, using `:sys.no_debug(pid)`.

### Process Tracing

Using [:erlang.trace/2][erlang-trace]:

Be warned that this way of tracing can affect system performance and has
to be exercised with extreme caution. The production-safe way is to use [recon][recon].

```elixir
# Trace messages for an existing process

{:ok, pid} = Agent.start fn -> :some_state end

:erlang.trace pid, true, [:receive]
# Send a message after 3 seconds
Process.send_after pid, :something, 3_000

flush
# No messages yet

# After 3 seconds
flush
# {:trace, #PID<0.85.0>, :receive, :foo}

# Trace messages of processes to be created

:erlang.trace :new, true, [:receive]
```

⛑  Remember to turn tracing off when you're done! 

Turn it off using: `:erlang.trace(tracee, false, trace_flag)`.

#### The [dbg][dbg] module

This module provides many convenient functions for debugging (with mostly cryptic names).

The first step is to start a tracer:

```elixir
:dbg.tracer
```

```elixir
# Specify the Module / Fuction / Arity you wish to trace
:dbg.tp(List, :first, 1, [])


# Start tracing calls from the current process
:dbg.p(self(), :c)

# Or you can start tracing calls from all processes
:dbg.p(:all, :call)

# You can also log the timestamp of the call
:dbg.p(:all, [:call, :timestamp])

# Or you can trace processes which haven't been spawned yet
:dbg.p(:new, [:call, :timestamp])

List.first([1,2,3])
#=> (<0.73.0>) call 'Elixir.List':first([1,2,3])
#=> 1

# Trace all the functions of the module
:dbg.tpl List, :_, []

List.last [1,2,3]
#=> (<0.73.0>) call 'Elixir.List':'__info__'(macros)
#=> (<0.73.0>) call 'Elixir.List':last([1,2,3])
#=> (<0.73.0>) call 'Elixir.List':last([2,3])
#=> (<0.73.0>) call 'Elixir.List':last([3])
#=> (<0.73.0>) call 'Elixir.List':wrap([yellow])

# Get the return values of a traced function
:dbg.tpl :random, :uniform, [{:_, [], [{:return_trace}]}]

:random.uniform
#=> (<0.73.0>) call random:uniform()
#=> (<0.73.0>) returned from random:uniform/0 -> 0.4435846174457203

# You can also trace messages

# Create a process to trace
parent = self()
pid = spawn_link fn ->
  receive do
    :stop -> "Byeee"
  after
    10_000 -> send parent, :hello_from_tracee
  end
end

# Start tracing messages
:dbg.p pid, [:m, :timestamp]

send pid, :hello
#=> (<0.118.0>) << hello (Timestamp: {1505,560745,949919})
#=> (<0.118.0>) <0.140.0> ! hello_from_traceee (Timestamp: {1505,561026,448836})

# When you're done, stop tracing
:dbg.stop_clear
```

If you're curious to understand how your IEx session works, you can try:

```elixir
:dbg.tracer
:dbg.p self(), [:all]

# Evaluate a simple expression
2 = 1 + 1

#=> (<0.73.0>) << {eval,<0.48.0>,<<"2 = 1 + 1\n">>,
#=>    #{'__struct__' => 'Elixir.IEx.State',
#=>      cache => [],
#=>      counter => 11,
#=>      prefix => <<"iex">>}} (Timestamp: {1505,560410,139339})
#=> (<0.73.0>) in {'Elixir.IEx.Evaluator',loop,3} (Timestamp: {1505,560410,139348})
#=> (<0.73.0>) code_server ! {code_call,<0.73.0>,
#=>   {ensure_loaded,'Elixir.List.Chars.List'}} (Timestamp: {1505,
#=>                                                          560410,
#=>                                                          139361})
#=> ..more
```


The 17th chapter of [Erlang Programming][erlang-programming], features lots of pragmatic
examples of `erlang:trace` and `dbg` functions and an overview of match specifications. I highly recommend it.

### Determining the Health of an Application

```elixir
# Get the uptime of the node
:c.uptime

# Get a list of running processes and show the first 400
Process.list |> IO.inspect(limit: 400)
```

If it looks like `length(Process.list)` is growing indefinitely, there might be a process-leak.

A more efficient way to get just the number of running processes is `:erlang.system_info(:process_count)`.

> The time for calculating the length of a list is proportional to the length of the list

See: [Erlang Efficiency Guide][erlang-efficiency-guide]

### Memory

List processes by the heap memory they reserve in descending order:

```elixir
Process.list
|> Enum.map(&{&1, Process.info(&1, [:total_heap_size])})
|> Enum.sort(fn {_, k1}, {_, k2} -> k1[:total_heap_size] > k2[:total_heap_size] end)
```

You can peek at memory stats using [:erlang.memory/0][erlang-memory-0]

```elixir
:erlang.memory
#=> [total: 75799504, processes: 34587896, processes_used: 34572944,
#=>  system: 41211608, atom: 793529, atom_used: 780108, binary: 4931384,
#=>  code: 19859074, ets: 2599216]
```

### ETS

> The main design objectives ETS had was to provide a way to store large amounts of data in Erlang with constant access time (functional data structures usually tend to flirt with logarithmic access time) and to have such storage look as if it were implemented as processes in order to keep their use simple and idiomatic.
-- http://learnyousomeerlang.com/ets

Get the number of ETS tables.

```elixir
length(:ets.all)
```

Get stats for all tables

```elixir
:ets.i

#=> id              name              type  size   mem      owner
#=> ----------------------------------------------------------------------------
#=> 1               code              set   344    25890    code_server
#=> 4098            code_names        set   56     10041    code_server
#=> ac_tab          ac_tab            set   37     2022     application_controller
#=> disk_log_names  disk_log_names    set   1      313      disk_log_server
#=> disk_log_pids   disk_log_pids     set   1      312      disk_log_server
#=> elixir_config   elixir_config     set   10     431      <0.52.0>
```

```elixir
:ets.info(:some_table)

#=> [read_concurrency: false, write_concurrency: false, compressed: false,
#=>  memory: 121, owner: #PID<0.389.0>, heir: :none, name: :timer_tab, size: 1,
#=>  node: :example@autoverse, named_table: true, type: :ordered_set, keypos: 1,
#=>  protection: :protected]
```

💡 The `size` info can be used to get the number of objects in the table
without querying the table.

Order tables by size:

```elixir
:ets.all
|> Enum.map(&{&1, :ets.info(&1, :memory) * :erlang:system_info(wordsize)})
|> Enum.sort(fn {_, s1}, {_, s2} -> s1 > s2 end)
```

## Application Configuration

You can change the configuration of an application without restarting it.

```elixir
# Sample Phoenix application.
# From a remote console, we'll update the :secret_key_base setting on-the-fly.

# We fetch the current config
current_config = Application.get_env :example, Example.Endpoint

# Make some changes
new_config = put_in(current_config[:secret_key_base], "something-different")

# Apply them
Application.put_env :example, Example.Endpoint, new_config
```

## Distributed Applications
You are advised to read [this][distributed-erlang] documentation page about distributed Erlang if you
are not familiar with the terminology used for Erlang distributions.

Start an IEx session with a short name and a cookie:

```shell
iex --sname example --cookie test
```

### Getting Debug Information for all Nodes

[:c.ni/0][c-ni-0]

Displays system information, listing information about all processes across nodes.

```elixir
:c.ni
```

It will have output like the following:

<pre class="nodes-smalltext">
  <code>
    Pid        Initial Call                  Heap     Reds  Msgs  Registered          Current Function          Stack
    <0.0.0>    otp_ring0:start/2             1598     3418     0  init                init:loop/1                   2
    <0.1.0>    erts_code_purger:start/0      6772    49562     0  erts_code_purger    erts_code_purger:loop/0       3
    <0.4.0>    erlang:apply/2               10958  8516146     0  erl_prim_loader     erl_prim_loader:loop/3        5
  </code>
</pre>

To inspect remote processes you should use [:rpc.pinfo/1][rpc-pinfo-1] instead of
[Process.info/1][process-info-1] (or :[erlang.process_info/1][erlang-process-info-1]) since the latter works only for local
processes.

```elixir
init = :rpc.call Process, :whereis, [:init]
Process.info init
#=> ** (ArgumentError) argument error
#=>    :erlang.process_info(#PID<26268.0.0>)

:rpc.pinfo init
#=> [registered_name: :init, current_function: {:init, :loop, 1},
#=>  initial_call: {:otp_ring0, :start, 2}, status: :waiting, message_queue_len: 0,
#=>  messages: [], links: [#PID<26268.6.0>, #PID<26268.7.0>, #PID<26268.4.0>],
#=>  dictionary: [], trap_exit: true, error_handler: :error_handler,
#=>  priority: :normal, group_leader: #PID<26268.0.0>, total_heap_size: 1220,
#=>  heap_size: 610, stack_size: 2, reductions: 3660,
#=>  garbage_collection: [max_heap_size: %{error_logger: true, kill: true, size: 0},
#=>   min_bin_vheap_size: 46422, min_heap_size: 233, fullsweep_after: 65535,
#=>   minor_gcs: 4], suspending: []]
```

Remember that you can get the node for a `pid` using [`node/1`][node-1]:

```elixir
remote_pid = pid "26268.0.0"

node remote_pid
#=> :example_remote_node@somewhere
```

## [EPMD][epmd]

The Erlang Port Mapper Deamon is the most common way to map nodes to
ports to distribute your application (..but [you can do without it][distribution-without-epmd]).

You can query an epmd instance for nodes using:

```shell
epmd -names

# => epmd: up and running on port 4369 with data:
# => name example at port 53669
```

For a distillery release with the option `include_erts: true`, you can query epmd like:

```shell
# Where "8.3.5" should be changed to your version of erts
./_build/prod/rel/erts-8.3.5/bin/epmd -names
```

## Determining Node Connectivity

Having started 2 nodes like:

```shell
iex --sname node1 --cookie test
```

```shell
iex --sname node2 --cookie test
```

You should be able to ping each other using:

```elixir
Node.ping :"node2@autoverse"
#=> pong # It works
#=> pang # Oh snap, it doesn't work

# You can get a list of the registered nodes using:
:net_adm.names
#=> {:ok, [{'node2', 57066}, {'node1', 57075}]}
```

## Starting a slave node

From within the IEx session:

```elixir
# :slave.start :autoverse, :example_slave, '-setcookie test'
:slave.start :autoverse, :example_slave, '-setcookie test -loader inet'
```

The slave node will be `:example_slave@autoverse`, and will be included in the list of `:visible` nodes.

```elixir
Node.list
#=> [:example_slave@autoverse]
```

By default a node loads code from the file system, but can also load
code from the network.

The `-loader` option determines the loader to be used and is documented as follows:


```
-loader Loader
Specifies the name of the loader used by erl_prim_loader.
Loader can be efile (use the local file system) or inet (load using the boot_server on another Erlang node).

If flag -loader is omitted, it defaults to efile.
```

We can start a node using:

```shell
iex --sname example --cookie test -S mix
```

Start the `erl_boot_loader` application from within that node:

```elixir
:erl_boot_server.start {127,0,0,1}
```

Then start a slave node using the code server we just created:

```elixir
{:ok, slave} = :slave.start 'autoverse', :slave, '-loader inet -hosts 127.0.0.1 -setcookie 1234 -id slave'
```

For further reading about code loading on remote nodes, I highly recommend reading [this blogpost][remote-code-loading],
and the documentation of the modules which handle remote code loading [erl_boot_server][erl_boot_server] and
[erl_prim_loader][erl_prim_loader].

### Distributing a Module

When you define a module in an IEx session the 3rd element of the
returned tuple of `defmodule` is the object code for that module.
You can use [code.load_binary/1][code-load_binary-1] to load it in another node:

```elixir
{_, _, object_code, _} = defmodule Something do
  def say, do: "Hello from Something"
end

:rpc.call slave, :code, :load_binary, [Something, 'somefile', object_code]
:rpc.call slave, Something, :say, []
#=> "Hello from Something"
```

At any point you can use [:c.m/0][c-m-0] to list all the loaded modules for a node and their source file.

```elixir
:rpc.call slave, :c, :m, []
#=> Module                File
#=> Elixir.Agent            /home/zorbash/.asdf/installs/elixir/1.4.5/bin/../lib/elixir/ebin/Elixir.Agent.beam
#=> Elixir.Agent.Server     /home/zorbash/.asdf/installs/elixir/1.4.5/bin/../lib/elixir/ebin/Elixir.Agent.Server.beam
#=> Elixir.Code             /home/zorbash/.asdf/installs/elixir/1.4.5/bin/../lib/elixir/ebin/Elixir.Code.beam
#=> Elixir.GenServer        /home/zorbash/.asdf/installs/elixir/1.4.5/bin/../lib/elixir/ebin/Elixir.GenServer.beam
#=> Elixir.Inspect.Algebra  /home/zorbash/.asdf/installs/elixir/1.4.5/bin/../lib/elixir/ebin/Elixir.Inspect.Algebra.beam
#=> Elixir.Inspect.Atom     /home/zorbash/.asdf/installs/elixir/1.4.5/bin/../lib/elixir/ebin/Elixir.Inspect.Atom.beam
#=> Elixir.Inspect.Opts     /home/zorbash/.asdf/installs/elixir/1.4.5/bin/../lib/elixir/ebin/Elixir.Inspect.Opts.beam
#=> Elixir.Kernel           /home/zorbash/.asdf/installs/elixir/1.4.5/bin/../lib/elixir/ebin/Elixir.Kernel.beam
#=> Elixir.Keyword          /home/zorbash/.asdf/installs/elixir/1.4.5/bin/../lib/elixir/ebin/Elixir.Keyword.beam
#=> Elixir.Process          /home/zorbash/.asdf/installs/elixir/1.4.5/bin/../lib/elixir/ebin/Elixir.Process.beam
```

### Libraries & Tools

The Erlang ecosystem has plenty of tools which can be used for debugging / tracing / profiling, some notable references are:

* [recon][recon]
* [wobserver][wobserver]
* [XProf][xprof] (watch: [Elixir.LDN presentation][xprof-video])
* [erlyberly][erlyberly]
* [exrun][exrun]

A future blog post might cover some of them, as well as [LTTng][lttng] / [DTrace][dtrace] probes.

Finally, I advise you to watch [this ElixirConf 2017 talk by Gabi Zuniga][elixirconf-tracing].

Happy tracing!

[permutation-city]: https://en.wikipedia.org/wiki/Permutation_City
[erlang]: https://erlang.org/
[elixir]: https://elixir-lang.org/
[remote-code-loading]: https://medium.com/@stavro/intro-slave-nodes-and-remote-code-loading-d1168bff7b20
[erl_boot_server]: http://erlang.org/doc/man/erl_boot_server.html
[erl_prim_loader]: http://erlang.org/doc/man/erl_prim_loader.html
[rpc-pinfo-1]: http://erlang.org/doc/man/rpc.html#pinfo-1
[process-info-1]: https://hexdocs.pm/elixir/Process.html#info/1
[erlang-process-info-1]: http://erlang.org/doc/man/erlang.html#process_info-1
[code-load_binary-1]: http://erlang.org/doc/man/code.html#load_binary-3
[distillery]: https://github.com/bitwalker/distillery
[distillery-releases-post]: {{< relref "post/docker-multi-stage-elixir-distillery-releases.md" >}}
[distillery-boot-template]: https://github.com/bitwalker/distillery/blob/1.5.1/priv/templates/boot_loader.eex
[epmd]: http://erlang.org/doc/man/epmd.html
[distribution-without-epmd]: https://www.erlang-solutions.com/blog/erlang-and-elixir-distribution-without-epmd.html
[c-ni-0]: http://erlang.org/doc/man/c.html#ni-0
[c-m-0]: http://erlang.org/doc/man/c.html#m-0
[erlang-memory-0]: http://erlang.org/doc/man/erlang.html#memory-0
[designing-scalability-book]: http://shop.oreilly.com/product/0636920024149.do
[erlang-programming]: http://shop.oreilly.com/product/9780596518189.do
[erlang-sys-module]: http://erlang.org/doc/man/sys.html
[otp-send_system_msg]: https://github.com/erlang/otp/blob/OTP-20.0/lib/stdlib/src/sys.erl#L300
[sys_get_state]: http://erlang.org/doc/man/sys.html#get_state-1
[sys_replace_state]: http://erlang.org/doc/man/sys.html#replace_state-2
[sys_statistics]: http://erlang.org/doc/man/sys.html#statistics-2
[sys_log]: http://erlang.org/doc/man/sys.html#log-2
[wobserver]: https://github.com/shinyscorpion/wobserver
[recon]: http://ferd.github.io/recon/
[erlyberly]: https://github.com/andytill/erlyberly
[xprof]: https://github.com/Appliscale/xprof
[exrun]: https://github.com/liveforeverx/exrun
[xprof-video]: https://www.youtube.com/watch?v=AAXtjPiXbWE
[erlang-efficiency-guide]: http://erlang.org/doc/efficiency_guide/users_guide.html
[erlang-special-processes]: http://erlang.org/doc/design_principles/spec_proc.html
[iex-break]: https://hexdocs.pm/iex/IEx.html#break!/2
[erlang-trace]: http://erlang.org/doc/man/erlang.html#trace-3
[erlang-dbg]: http://erlang.org/doc/man/dbg.html
[distributed-erlang]: http://erlang.org/doc/reference_manual/distributed.html#id88715
[elixirconf-tracing]: https://www.youtube.com/watch?v=NBmNDI9OFJk
[dbg]: http://erlang.org/doc/man/dbg.html
[greg-egan]: https://en.wikipedia.org/wiki/Greg_Egan
[lttng]: http://erlang.org/doc/apps/runtime_tools/LTTng.html
[dtrace]:http://erlang.org/doc/apps/runtime_tools/DTRACE.html
[iex-helpers-h-1]: https://hexdocs.pm/iex/IEx.Helpers.html#h/1
[node-1]: https://hexdocs.pm/elixir/Kernel.html#node/1

<style>
.main-header {
  background-size: 32% auto;
}
.nodes-smalltext {
  font-size: 70%;
  padding: 0;
}
</style>

+++
author = "Dimitris Zorbas"
date = "2020-03-01"
draft = false
title = "Writing a Command-Line Application in Elixir"
image = "/images/posts/building_command_line_applications_with_elixir/terminal.jpeg"
tags = ["elixir", "command-line", "terminal", "tefter"]
comments = true
share = true
+++

I've always been fascinated by well-made applications for the terminal. Who doesn't
install `htop` on a new machine, am I right?

My plan was to build something that I'd use daily and other people would potentially
find useful. Therefore I decided to build a cli app for [Tefter][tefter].

It's built on [Elixir][elixir] and [Ratatouille][rata] and it's open-source. 

<img src="/images/posts/building_command_line_applications_with_elixir/cli_demo.png" class="img-medium">

Check out [the source][source] or [download][download] and try it or
install via brew.

```shell
brew tap tefter/homebrew-cli
brew install tefter
```

# Why Elixir

Elixir is getting popular for web and distributed applications, but these
days devs tend to write cli apps in Rust / Go / C. We use Elixir at
[Tefter][tefter] (see [previous post][elixir-slack]), so there was a case for code
reuse and at some point I stumbled upon [Ratatouille][rata].
It's an [Elm][elm] inspired framework, which leverages [termbox][termbox],
a C library for text-based user interfaces. Being charmed by the beautiful
API of [Ratatouille][rata] and eager to overcome potential hurdles, once again I chose Elixir.

**Pros**

* High-level language
* Fault-tolerance
* Optimal offline storage ([ETS][ets] / [DETS][dets] / [Mnesia][mnesia])
* Some portability with [Releases][releases]
* A decent framework ([Ratatouille][rata])
* Fantastic Concurrency (see: [commands][commands])
* Code-reloading for quick debugging
* It's so much fun :-)

**Cons**

* Releases bundle the VM and could be smaller
* Releases are not truly portable (a release built on a Linux machine won't work on a Mac, etc)
* No trivial way to fork-exec

# Demo Time!

Take a glimpse of how the app behaves:

<video controls>
  <source src="/images/posts/building_command_line_applications_with_elixir/blog_demo.mp4" type="video/mp4">
  Sorry, your browser doesn't support embedded videos.
</video>

# About Tefter

<br/>

<img src="/images/posts/building_command_line_applications_with_elixir/tefter_logo.png" class="img-medium">

<br/>

Before going into more detail about the specifics of the [cli][source], let's talk about Tefter first.
It's a tool aiming to optimise your web surfing routine, a combination of personal search-engine,
a social bookmarking tool and a place to archive stuff to read later and write notes. One would interact
with Tefter through the [Web app][tefter], the [browser extension][browser-extension], the [mobile][mobile-app] and
the [desktop apps][desktop-app] or [Slack][slack-app]!

# The App

At the moment of writing, it features three main tabs for `Search`, `Aliases` and `Bookmarks`.
Some of the advantages of the cli app to the rest of the available are:

* You don't have to leave your terminal and keyboard
* vim-style keybindings with mouse support 😎
* Works offline

**Shortcuts**

Key|Action
----|------|
<kbd>Ctrl</kbd>+<kbd>s</kbd>|Jump to Search tab
<kbd>Ctrl</kbd>+<kbd>a</kbd>|Jump to Aliases tab
<kbd>Ctrl</kbd>+<kbd>b</kbd>|Jump to Bookmarks tab
<kbd>Ctrl</kbd>+<kbd>h</kbd>|Jump to Help tab
<kbd>Tab</kbd>|Jump to the next tab
<kbd>Home</kbd>|Jump to the first tab
<kbd>↑</kbd>|Move up
<kbd>Ctrl</kbd>+<kbd>k</kbd>|Move up
<kbd>↓</kbd>|Move down
<kbd>Ctrl</kbd>+<kbd>j</kbd>|Move down
<kbd>Ctrl</kbd>+<kbd>d</kbd>|Scroll down
<kbd>Ctrl</kbd>+<kbd>u</kbd>|Scroll up
<kbd>Enter</kbd>| Open browser window with item under cursor
<kbd>Esc</kbd>|Cancel command / Quit modal
<kbd>F5</kbd>|Force refresh resources|
<kbd>Ctrl</kbd>+<kbd>q</kbd>|Quit
<kbd>/</kbd>|Enter filtering mode
<kbd>:</kbd>|Enter command mode

## Authentication

The authentication is implemented to be as seamless as possible. It
won't ask the user to type their username and password.

The first time the application is started, it looks for an authentication
token in a `~/.tefter` file. This file holds a plain JSON config. If not
found it'll start a tiny web server listening on a random port. It'll
then open a browser window to a special Tefter endpoint which redirects
to the address of the local web server with the authentication token
encoded in the query params. The app then proceeds to create the
`~/.tefter` file.

See it in action:

<video controls>
  <source src="/images/posts/building_command_line_applications_with_elixir/auth.webm" type="video/webm">
  Sorry, your browser doesn't support embedded videos.
</video>

## Search

This work in a similar manner to the auto-complete of the Web app. The
user types and results appear in the panel below. Results can be
bookmarks, lists, domains, tags or aliases.

<img src="/images/posts/building_command_line_applications_with_elixir/search.png" class="img-medium">

## App Architecture

Let's have a look at how this works. At the moment, the app is structured as follows:

```
lib/tefter_cli
├── app
│   └── state.ex
├── app.ex
├── application.ex
├── auth_server.ex
├── authentication.ex
├── bookmarks.ex
├── cache.ex
├── command.ex
├── config.ex
├── system.ex
└── views
    ├── aliases
    │   ├── actions.ex
    │   └── state.ex
    ├── aliases.ex
    ├── authentication.ex
    ├── bookmarks
    │   ├── actions.ex
    │   └── state.ex
    ├── bookmarks.ex
    ├── components
    │   ├── bottom_bar.ex
    │   ├── cursor.ex
    │   ├── info_panel.ex
    │   ├── pagination.ex
    │   └── top_bar.ex
    ├── help.ex
    ├── helpers
    │   └── text.ex
    ├── lists.ex
    ├── search
    │   └── state.ex
    └── search.ex
```

In the `views/` directory there is a module per tab, so we have
`search.ex`, `aliases.ex`, `bookmarks.ex` and `help.ex`. Each view has a
state management module, eg `views/bookmarks/state.ex` and where
applicable a module for actions. The actions handle side-effects such as
the interaction with the server and the cache.

The main entrypoint for the application is `app.ex`. It's rather brief
so it fits in the snippet below:

```elixir
defmodule TefterCli.App do
  @behaviour Ratatouille.App

  alias Ratatouille.Runtime.{Subscription}
  alias TefterCli.App.State
  alias TefterCli.Views.{Search, Bookmarks, Lists, Aliases, Authentication, Help}

  @tabs [:search, :aliases, :bookmarks, :help]

  @impl true
  def init(_), do: State.init()

  @impl true
  def update(state, msg), do: State.update(state, msg)

  @impl true
  def render(%{token: nil} = state), do: Authentication.render(state)
  def render(%{tab: :search} = state), do: Search.render(state)
  def render(%{tab: :bookmarks} = state), do: Bookmarks.render(state)
  def render(%{tab: :aliases} = state), do: Aliases.render(state)
  def render(%{tab: :lists} = state), do: Lists.render(state)
  def render(%{tab: :help} = state), do: Help.render(state)

  @doc "Returns the available application tabs"
  def tabs, do: @tabs

  @impl true
  def subscribe(%{token: nil}), do: Subscription.interval(500, :check_token)
  def subscribe(_), do: Subscription.interval(100_000, :check_token)
end
```

It's placed under the supervision tree with:

```elixir
{
  Ratatouille.Runtime.Supervisor,
  runtime: [app: TefterCli.App, quit_events: [{:key, Ratatouille.Constants.key(:ctrl_q)}]]
}
```

where we declare the "main" module of the app and that `ctrl + q` quits.

The most important functions of `TefterCli.App` are `update/2` and `render/1`.

The `update/2` receives the `model` - the current state of the app, as
the first argument and a message as the seconds one. The message is
usually a tuple `{:event, event}` where event is a [termbox][termbox] mouse or keyboard event like the following:

```elixir
%ExTermbox.Event{
  ch: 0,
  h: 0,
  key: 27,
  mod: 0,
  type: 1,
  w: 0,
  x: 0,
  y: 0
}
```

The `update/2` should return the updated state, but in some cases you
may have it return `{model(), Command.t()}`.
 More about commands later.
The `render/1` receives the `model` and must return a `%Ratatouille.Element{}`.
Thankfully you don't have to assemble the element structs manually and
there are macros for that. Example:

```elixir
def render(model) do
  view do
    label(content: "Hello, #{model.name}!")
  end
end
```

In `TefterCli` view modules like `TefterCli.Views.Bookmarks` define the `render/1` function and
delegate the `update/2` to their state management modules like `TefterCli.Views.Bookmarks.State`.
At the moment, the model in `TefterCli` is a plain map, but will be refactored to be a struct in the future.

**Anatomy of the view**

<img src="/images/posts/building_command_line_applications_with_elixir/aliases_anatomy.png" class="img-medium">

<br/>

Most views share the [`TopBar`][top_bar] and [`BottomBar`][bottom_bar]. Views with paginated resources have the [`InfoPanel`][info_panel] which displays pagination info the permits typing commands.

### Aliases

**What is an alias?**

Think of an alias as a dynamic shortened link. You can create a `maps`
alias pointing to `https://www.google.com/maps/search/{{*}}?hl=en&source=opensearch` and then with the browser extension installed,
type `go/maps/london` in the address bar to be redirected to
`https://www.google.com/maps/search/london?hl=en&source=opensearch`.

So with `{{*}}` you can set dynamic segments in your shortened links.
Dynamic segments are optional though.

In the command-line app you can:

* View all the aliases you've created
* Create an alias with the `:c <alias> <url>` command
* Delete an alias with the `:d` command
* Search for an alias by typing `/`
* Open a browser window with the link of an alias by pressing `enter`

Example:

<video controls>
  <source src="/images/posts/building_command_line_applications_with_elixir/aliases_demo.webm" type="video/webm">
  Sorry, your browser doesn't support embedded videos.
</video>

### Bookmarks

The bookmarks tab is very similar to aliases. A user is likely to have way more bookmarks than aliases,
since on average a user has ~1000 bookmarks but fewer than 10 aliases.
This calls for a different pagination strategy. In aliases, there's a
sliding `viewport` with an offset controlled by the cursor. This doesn't
work well with bookmarks. I tested it initially with my bookmarks (I
have more that 9K bookmarks) and it was sluggish. The reason is, that on
every keyboard / mouse event, [Ratatouille][rata] tries to re-render everything.
In the case of thousands of bookmarks within a viewport, it renders each
and every bookmark despite most of them being off-screen. The solution
is to only feed a slice of the bookmarks list to the viewport.

On a similar note, [Ratatouille][rata] will re-render everything every
500ms, see [here][rata-interval].

**Adding Bookmarks**

One can add a bookmark by typing `:c <url>`.

<img src="/images/posts/building_command_line_applications_with_elixir/add_bookmark.png" class="img-medium">

**Deleting Bookmarks**

To delete a bookmark, type `:d` and the currently selected bookmark will
be deleted.

**Filtering**

To filter, type `/`. To highlight a result, [`TefterCli.Views.Helpers.Text.highlight/2`][highlight] is used.
Unfortunately, [ExTermbox][ex_termbox] seems to drop diacritical marks from strings which would let me
render highlighted text like this "z̲o̲r̲b̲a̲s̲h̲" (see: [TefterCli.Views.Helpers.Text.underline/1](underline))
and I resorted in surrounding matching text with `[` and `]`.

# Development

Clone the [repo][source], run it with `iex -S mix`, make changes and
you're welcome to submit a pull-request!

Since the app takes over your IEx session, to simplify your debugging,
most events are logged to a file in `log/dev.log` in development.

To drop to the IEx console, you can go to the `search`
tab and hit <kbd>ctrl</kbd> + <kbd>y</kbd>.

To reload the source without restarting the app hit <kbd>f5</kbd>.

# Packaging

There are two simple bash scripts to prepare releases for Linux and MacOS
in `./bin/release_linux` and `./bin/release_macos` respectively.  
They both use `mix release` to prepare a tarball which bundles the Erlang VM.
The Linux script leverages Docker to ensure that a release can be built
even on a non-Linux machine.

We also maintain a formula to install via Homebrew [here][tefter-tap].

```shell
brew tap tefter/homebrew-cli
brew install tefter
```

# The framework - Ratatouille

Ratatouille is impressive. It makes you want to write something in it
and it's well documented and it's also rather simple. One can read its
source in one go.

## Architecture

There's the view, which is better explained quoting the documentation.

> In Ratatouille, a view is simply a tree of elements. Each element in the tree
> holds an attributes map and a list of zero or more child nodes. Visually, it
> looks like something this:

```elixir
%Element{
  tag: :view,
  attributes: %{},
  children: [
    %Element{
      tag: :row,
      attributes: %{},
      children: [
        %Element{tag: :column, attributes: %{size: 4}, children: []},
        %Element{tag: :column, attributes: %{size: 4}, children: []},
        %Element{tag: :column, attributes: %{size: 4}, children: []}
      ]
    }
  ]
}
```

Then there's the runtime, which is basically this:

```elixir
defp loop(state) do
  :ok = Window.update(state.window, state.app.render(state.model))

  receive do
    {:event, %{type: @resize_event} = event} ->
      state
      |> process_update({:resize, event})
      |> loop()

    {:event, event} ->
      if quit_event?(state.quit_events, event) do
        shutdown(state)
      else
        state
        |> process_update({:event, event})
        |> loop()
      end

    {:command_result, message} ->
      state
      |> process_update(message)
      |> loop()
  after
    state.interval ->
      state
      |> process_subscriptions()
      |> loop()
  end
end
```

I'd change [Ratatouille.Runtime][rata-runtime] to be a GenServer for
plenty of reasons, introspection with `:sys` being one of them.

## Caveats

Ratatouille is fantastic, but there are a few things that could be improved:

* Performs unnecessary re-renderings
* Lack of form controls

# What's Next

* Debian and Homebrew packages
* Windows support (mention the desktop app)
* [Lists][lists]
* [Organisations][organisations]
* Create and delete aliases
* Display notes in an overlay
* Edit a bookmark
    Trigger the edit mode with the `:e` command.
    Then open `$EDITOR` with a tempfile containing the JSON representation
    of the bookmark. When the editor is closed update the bookmark
* Import chrome / firefox bookmarks

# Thank you

I want to thank [ndreynolds][ndreynolds] for creating Ratatouille and I hope people will gain something
by reading this post and the source of the app and provide feedback!

<style>
.main-header {
  background-size: 32% auto;
}

.highlight {
  line-height: 20px;
}

h2.post-title.single {
  font-size: 2.4rem;
}

h2 {
  font-size: 2.4rem !important;
}

kbd {
  display: inline-block;
  padding: 3px 5px;
  font: 11px SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace;
  line-height: 10px;
  color: #444d56;
  vertical-align: middle;
  background-color: #fafbfc;
  border: 1px solid #d1d5da;
  border-radius: 3px;
  box-shadow: inset 0 -1px 0 #d1d5da;
}

video {
  width: 95%;
}
</style>

[tefter]: https://tefter.io
[source]: https://github.com/tefter/cli
[elixir]: https://elixir-lang.org/
[rata]: https://github.com/ndreynolds/ratatouille
[commands]: https://hexdocs.pm/ratatouille/Ratatouille.Runtime.Command.html
[elm]: https://elm-lang.org/
[termbox]: https://github.com/nsf/termbox
[slack-app]: https://slack.com/apps/AFBC4A147-tefter
[desktop-app]: https://github.com/tefter/desktop
[browser-extension]: https://chrome.google.com/webstore/detail/tefter/eldofalegbgagpenjjcapjaogpioldoh
[mobile-app]: https://twitter.com/Tefter_io/status/1106145149019742210
[ets]: https://erlang.org/doc/man/ets.html
[dets]: https://erlang.org/doc/man/dets.html
[mnesia]: https://erlang.org/doc/man/mnesia.html
[releases]: https://hexdocs.pm/mix/Mix.Tasks.Release.html
[elixir-slack]: {{< relref "post/slack-bookmarks-collaboration-elixir.md" >}}
[rata-interval]: https://github.com/ndreynolds/ratatouille/blob/master/lib/ratatouille/runtime.ex#L53
[rata-runtime]: https://github.com/ndreynolds/ratatouille/blob/master/lib/ratatouille/runtime.ex
[highlight]: https://github.com/tefter/cli/blob/master/lib/tefter_cli/views/helpers/text.ex#L12
[ex_termbox]: https://github.com/ndreynolds/ex_termbox
[underline]: https://github.com/tefter/cli/blob/master/lib/tefter_cli/views/helpers/text.ex#L16
[ndreynolds]: https://github.com/ndreynolds
[info_panel]: https://github.com/tefter/cli/blob/master/lib/tefter_cli/views/components/info_panel.ex
[top_bar]: https://github.com/tefter/cli/blob/master/lib/tefter_cli/views/components/top_bar.ex
[bottom_bar]: https://github.com/tefter/cli/blob/master/lib/tefter_cli/views/components/bottom_bar.ex
[organisations]: https://guides.tefter.io/features/team_collaboration/
[lists]: https://guides.tefter.io/features/lists/
[download]: https://github.com/tefter/cli/releases
[tefter-tap]: https://github.com/tefter/homebrew-cli

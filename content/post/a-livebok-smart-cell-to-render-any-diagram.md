+++
author = "Dimitris Zorbas"
date = "2022-06-14"
draft = false
title = "A Livebook Smart-Cell to Render Diagrams"
image = "/images/posts/kino_kroki/banner.svg"
tags = ["elixir", "livebook", "tools"]
comments = true
share = true
+++

I wrote my first Livebook smart-cell which renders diagrams from a textual description.

<!--more-->

I recently discovered [Kroki][kroki], an opensource tool which generates
images from the text notation of popular diagramming languages. I then
thought, [Livebook][livebook] makes such an excellent application companion for
runnable documentation. What if we could easily embed architectural (or any kind) of diagrams
without having to go through some complicated pipeline to convert the
diagram definition into an image first?

## Yes, we can!

An old Chinese proverb goes "Up-to-date runnable documentation with diagrams is worth a thousand Confluence pages".
Elixir's standard documentation generator, [ex_doc][ex_doc] makes it
trivial to include Livebook notebooks in your documentation and run them.
It even supports [Mermaid][mermaid] out of the box, you just need to wrap the source
in mermaid backticks.

    ```mermaid
    graph TD;
      A-->B;
      A-->C;
      B-->D;
      C-->D;
    ```

What if your diagrams are not part-fish? No problem, there's [kino_kroki][kino_kroki].

You quickly can give it a go by following the link below:  

[![Livebook badge](/images/livebook.svg)](https://livebook.dev/run?url=https%3A%2F%2Fhexdocs.pm%2Fkino_kroki%2Fexamples.livemd)

_Note: Please mind that you need to be running Livebook > 0.6_

To try it from an existing notebook, throw `kino_kroki` to the mix with:

```elixir
Mix.install([:kino_kroki])
```


Then you'll notice a new type of smart-cell titled `diagram`.

![kino-kroki](/images/posts/kino_kroki/smart.png)

An editor will appear where you can paste and edit the diagram source
and when you evaluate the cell, the diagram will be rendered.

![kino-kroki](/images/posts/kino_kroki/editor.png)

## Prior Art

Smart-cells are a powerful way to extend the functionality of Livebook.
There's a fantastic guide bundled with Livebook, to help you write your
own smart-cell, which you can read [here][smart-cell-guide].

I took inspiration from [github_graphql_smartcell][github_graphql_smartcell] which is somewhat similar to `Kino.Kroki` in the sense that they both include a source editor.


## How it Works

As mentioned in the intro, this smart-cell is powered by [Kroki][kroki].
It's API takes the diagram source as a URL encoded and compressed string
and responds with an image.

The heart of the smart-cell is this tiny module:

```elixir
defmodule Kino.Kroki do
  @moduledoc """
  A simple encoder for the online diagram renderer https://kroki.io/
  """

  @doc """
  Returns a `Kino.Markdown` image to render the diagram.

  ### Examples

      iex> Kino.Kroki.new(Kino.Kroki.Sample.get(:graphviz), :graphviz)
      %Kino.Markdown{
        content: "![svg](https://kroki.io/graphviz/svg/eJx9kM"
      }
  """
  @spec new(graph :: String.t(), type :: Kino.Kroki.Samples.type()) :: Kino.Markdown.t()
  def new(graph, type) do
    graph
    |> :zlib.compress()
    |> Base.url_encode64()
    |> then(&"https://kroki.io/#{type}/svg/#{&1}")
    |> then(&"![svg](#{&1})")
    |> Kino.Markdown.new()
  end
end
```

Compressing and encoding in Elixir and OTP as you can see, is particularly simple, compared to
some other platforms (see [examples][kroki-examples]). With the time left I contributed the [Elixir example](https://github.com/yuzutech/kroki/pull/1352).


### Making it Smart

So far, there's nothing particularly dynamic about `Kino.Kroki`, it's a
regular Elixir module which can return a Markdown image.


To better understand the concept of a smart-cell, consider it a code
template parameterized through UI interactions. At any point you can
convert a smart-cell into a code cell for further modifications.

We'll dissect each part of the module below:

```elixir
defmodule Kino.KrokiSmartcell do
  use Kino.JS
  use Kino.JS.Live
  use Kino.SmartCell, name: "Diagram"

  # omitted
end
```

We're defining a module for the smart-cell, which adds `Kino.JS` making
the module assert-aware allowing us to inject JavaScript for our cell
through the `assert "main.js"` macro as well as CSS through `asset "main.css"`.

We also use [`Kino.JS.Live`][docs-kinojslive] since we want the cell to be dynamic,
listening to the `update_type` event then setting a diagram sample
according to the selected type.

* With the `init/2` callback, that receives the argument and the "server"
context, we initialise the type, setting it to "graphviz" and we also
fetch and assign a sample textual definition of a [GraphViz][graphviz] diagram. More
details about the module returning samples will be available further below.

```elixir
@default_type "graphviz"

@impl true
def init(_attrs, ctx) do
  ctx =
    ctx
    |> assign(type: @default_type)
    |> assign(diagram: Kino.Kroki.Samples.get(@default_type))

  {:ok, ctx}
end
```

With the `handle_connect/1`, which is invoked whenever a new client connects,
we set up the initial state of the new client.

```elixir
@impl true
def handle_connect(ctx) do
  {:ok, %{type: ctx.assigns.type, diagram: ctx.assigns.diagram}, ctx}
end
```

* The `handle_event/3` callback is responsible for handling any messages
  sent by the client. We fetch a sample diagram source for the selected
  type, update the context and broadcast an event which will be handled
  by JavaScript side of this cell and update the editor element.

```elixir
@impl true
def handle_event("update_type", type, ctx) do
  ctx = assign(ctx, type: type)

  diagram = Kino.Kroki.Samples.get(type)

  ctx = update(ctx, :diagram, fn _ -> diagram end)
  broadcast_event(ctx, "update_type", %{type: ctx.assigns.type, diagram: diagram})

  {:noreply, ctx}
end
```

With the `to_attrs/1` callback we compute the arguments for `to_source/1`. We set the `type`
and `diagram` source.

```elixir
@impl true
def to_attrs(ctx) do
  %{"type" => ctx.assigns.type, "diagram" => ctx.assigns.diagram}
end
```

We implement `to_source/1` which returns the Elixir code for our cell.
This is what will replace our smart-cell if we convert it to a "dumb" cell.
We return the AST of the Elixir source which by calling `Kino.Kroki.new/2` renders a markdown image
generated by the [Kroki][kroki] server.
`Kino.SmartCell.quoted_to_string/1` converts the AST to a readable, formatted code string.

```elixir
@impl true
def to_source(attrs) do
  quote do
    Kino.Kroki.new(unquote(attrs["diagram"]), unquote(attrs["type"]))
  end
  |> Kino.SmartCell.quoted_to_string()
end
```

The JavaScript source of Kino.Kroki is:

```elixir
  asset "main.js" do
    """
    export function init(ctx, payload) {
      ctx.importCSS("main.css");
      ctx.importCSS("https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap");

      root.innerHTML = `
        <div class="app">
          <form>
            <div class="container">
              <div class="row header">
                <div class="inline-field">
                  <label class="inline-input-label label">Diagram type</label>
                  <select class="input" name="type"/>
                    <option value="blockdiag">BlockDiag</option>
                    <!-- rest of the options omitted -->
                  </select>
                </div>

                <div class="logo">
                  <span>Powered by: </span>
                  <a href="https://kroki.io">
                    <img alt="kroki" src="https://kroki.io/assets/logo.svg"/>
                  </a>
                </div>
              </div>

              <div class="row">
                <div class="field grow">
                  <label class="input-label">Diagram Source</label>
                  <textarea
                    id="diagram-source"
                    name="diagram"
                    class="input textarea code"
                    placeholder=""
                    rows="25">#{Kino.Kroki.Samples.get(@default_type)}</textarea>
                </div>
              </div>
            </container>
          </form>
        </div>
      `;

      const typeEl = ctx.root.querySelector(`[name="type"]`);
      const diagramEl = ctx.root.querySelector(`#diagram-source`);

      typeEl.addEventListener("change", (event) => {
        ctx.pushEvent("update_type", event.target.value);
      });

      ctx.handleEvent("update_type", (event) => {
        typeEl.value = event.type;
        diagramEl.value = event.diagram;
      });

      ctx.handleSync(() => {
        // Synchronously invokes change listeners
        document.activeElement &&
          document.activeElement.dispatchEvent(new Event("change"));
      });
    }
    """
  end
```

We use the `asset/2` macro to define the necessary JS code inline, but
there's also the option to set a path to load assets with:

```elixir
use Kino.JS, assets_path: "lib/assets/kino_kroki"
```

We need to export an `init` function for our JavaScript module. The
first parameter `ctx` is the client-side context which provides a
variety of useful functions such as `importCSS` which we use to load CSS
from a URL.

We initialise the root element of the smart-cell with `root.innerHTML`
and set up event handlers. With `ctx.pushEvent` we push a client-side
change to the cell server and with `ctx.handleEvent` we apply changes
from the server.

```javascript
typeEl.addEventListener("change", (event) => {
  ctx.pushEvent("update_type", event.target.value);
});

ctx.handleEvent("update_type", (event) => {
  typeEl.value = event.type;
  diagramEl.value = event.diagram;
});

ctx.handleSync(() => {
  // Synchronously invokes change listeners
  document.activeElement &&
    document.activeElement.dispatchEvent(new Event("change"));
});
```

The complete source of `Kino.Kroki` can be found [here](https://github.com/zorbash/kino_kroki/blob/master/lib/kino_kroki_smartcell.ex).

## Finishing Touches

We need to make sure Livebook knows about this new smart-cell to list it
as one of the available options.

In the `mix.exs` of `Kino.Kroki` there is:

```elixir
def application do
  [
    mod: {Kino.Kroki.Application, []}
  ]
end
```

and in the application module:

```elixir
defmodule Kino.Kroki.Application do
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    # 👇 This tells Kino we implemented a smart-cell
    Kino.SmartCell.register(Kino.KrokiSmartcell)

    Supervisor.start_link([], strategy: :one_for_one, name: KinoDB.Supervisor)
  end
end
```

## Diagram Samples

`Kino.Kroki` is the last module of the smart-cell. It reads and parses a text file
containing samples for the diagram types Kroki can generate images from.
Let's take it apart to see if there are any useful patterns in there (hint: there are).


The text file containing the samples has the following format:

```javascript
<--- sample:blockdiag --->
blockdiag {
  Kroki -> generates -> "Block diagrams";
  Kroki -> is -> "very easy!";

  Kroki [color = "greenyellow"];
  "Block diagrams" [color = "pink"];
  "very easy!" [color = "orange"];
}
<--- sample:wavedrom --->
{ signal: [
  { name: "clk",         wave: "p.....|..." },
  { name: "Data",        wave: "x.345x|=.x", data: ["head", "body", "tail", "data"] },
  { name: "Request",     wave: "0.1..0|1.0" },
  {},
  { name: "Acknowledge", wave: "1.....|01." }
]}
```

We start by assigning the location of the file to a module attribute:

```elixir
defmodule Kino.Kroki.Samples do
  @samples_file :code.priv_dir(:kino_kroki)
                |> Path.join("samples.txt")
```

Then with:

```elixir
@external_resource @samples_file
```

We instruct the compiler to recompile `Kiko.Kroki.Samples` each time there's a change to the samples file.

We then parse the file into a map where the keys are diagram types and the values are samples.

```elixir
@samples_separator ~r/<--- sample:(?<type>.+) --->\n/m
@samples @samples_file
         |> File.read!()
         |> String.split(@samples_separator,
           include_captures: true,
           trim: true
         )
         |> Enum.chunk_every(2)
         |> Enum.map(fn
           [separator, diagram] ->
             {String.to_atom(Regex.named_captures(@samples_separator, separator)["type"]),
              String.trim(diagram)}
         end)
         |> Map.new()
```

We also define a `type` type, which is a union of all the supported diagram types.

```elixir
@type type :: unquote(Enum.reduce(Map.keys(@samples), &{:|, [], [&1, &2]}))
```

This is rendered nicely in the [docs][typedocs] and helps the user of this library
provide a valid argument when used programmatically.

## Outro

There's a lot of ground to cover with the recent extensibility
improvements the amazing developers, community and sponsors a bringing
to Livebook. I recommend checking out the docs for:

* [Kino.JS][docs-kinojs]
* [Kino.JS.Live][docs-kinojslive]
* [Kino.SmartCell][docs-smartcell]

If you are seeking inspiration for your next notebook or smart-cell,
check out [notes.club](https://notes.club/) which is an Elixir app to
help you discover notebooks contributed by the community.

* Coming soom to a notebook near you "an [`open_api_spex`][open_api_spex] smart-cell", stay tuned!

**Spotted a Mistake?**

Please contact me on [twitter][me-twitter], or in the comments, or [submit a PR][blog-repo] for corrections.

[graphviz]: https://graphviz.org/
[me-twitter]: https://twitter.com/_zorbash
[blog-repo]: https://github.com/zorbash/zorbash.github.com
[kroki]: https://kroki.io
[livebook]: https://livebook.dev
[ex_doc]: https://github.com/elixir-lang/ex_doc/
[kino_kroki]: https://github.com/zorbash/kino_kroki
[mermaid]: https://mermaid-js.github.io/
[smart-cell-guide]: https://github.com/livebook-dev/livebook/blob/main/lib/livebook/notebook/learn/kino/smart_cells.livemd
[github_graphql_smartcell]: https://github.com/sdball/github_graphql_smartcell
[kroki-examples]: https://docs.kroki.io/kroki/setup/encode-diagram/
[typedocs]: https://hexdocs.pm/kino_kroki/Kino.Kroki.Samples.html#t:type/0
[docs-kinojs]: https://hexdocs.pm/kino/Kino.JS.html
[docs-kinojslive]: https://hexdocs.pm/kino/Kino.JS.Live.html
[docs-smartcell]: https://hexdocs.pm/kino/Kino.SmartCell.html
[open_api_spex]: https://github.com/open-api-spex/open_api_spex

+++
author = "Dimitris Zorbas"
date = "2021-12-26"
draft = false
title = "Livebook Animations"
image = "/images/posts/livebook_animations/cover.png"
tags = ["elixir", "livebook", "livebook", "animations"]
comments = true
share = true
+++


An exciting new feature landed in [Livebook][livebook-repo] (through [Kino][kino]) which gives
the ability to animate any output.

<!--more-->


In the process of experimenting with [Brain][brain-post] and its camera, I needed to
quickly sketch out some code and output video in a Livebook notebook.

I thought the following would do the trick:

```elixir
Kino.Image.new(Picam.next_frame, :jpeg)
|> Kino.render
```

but it creates a new output cell every time `Kino.render/1` is called.

So I posted this issue ([kino#48][kino-issue]) and implemented a new
widget `Kino.ImageDynamic` which can be updated with
`Kino.ImageDynamic.push/2`.

Then I also implemented a `Kino.clear/0`
function to dynamically clear any output cell, so that its contents can
be replaced by calling render again.

Thankfully the fruits of this conversation on the issue gave us a more
robust API for animation.

### Kino.animate/3

This PR [kino#49][kino-pr] and version [0.3.1][kino-changelog] of Kino
bring `Kino.Frame` and the `Kino.animate/3` function.

Watch a showcase of the feature below:

<video controls>
  <source src="/images/posts/livebook_animations/pr_demo.mp4"
          type="video/mp4">
</video>

### `Kino.Frame`

With `Kino.Frame.new/0` you can start a new
widget which can be updated with `Kino.Frame.render/2`.

```elixir
widget = Kino.Frame.new() |> tap(&Kino.render/1)

Kino.Frame.render(widget, 1)
Kino.Frame.render(widget, 2)
Kino.Frame.render(widget, 3)
Kino.Frame.render(widget, 4)
```

<img src="/images/posts/livebook_animations/animate_cells.png" class="img-medium brain-poster" alt="animate cells" />

You'll notice that with the code above we only get a single output
cell which gets updated four times.

With `Kino.animate/3` the above can be expressed more concisely:

```ruby
Kino.animate(50, 1, fn
  i when i in 1..4 -> {:cont, i, i + 1}
  _ -> :halt
end)
```

### Life

Let's put this new API to the test by implementing [Life][life].
To try this on your Livebook instance by importing [this notebook][life-notebook].

The implemenation is based on this [gist][sasa-life].

```elixir
defmodule Life.Grid do
  defstruct data: nil

  def new(data) when is_list(data) do
    %Life.Grid{data: list_to_data(data)}
  end

  def size(%Life.Grid{data: data}), do: tuple_size(data)

  def cell_status(grid, x, y) do
    grid.data
    |> elem(y)
    |> elem(x)
  end

  def next(grid) do
    %Life.Grid{grid | data: new_data(size(grid), &next_cell_status(grid, &1, &2))}
  end

  defp new_data(size, fun) do
    for y <- 0..(size - 1) do
      for x <- 0..(size - 1) do
        fun.(x, y)
      end
    end
    |> list_to_data
  end

  defp list_to_data(data) do
    data
    |> Enum.map(&List.to_tuple/1)
    |> List.to_tuple()
  end

  def next_cell_status(grid, x, y) do
    case {cell_status(grid, x, y), alive_neighbours(grid, x, y)} do
      {1, 2} -> 1
      {1, 3} -> 1
      {0, 3} -> 1
      {_, _} -> 0
    end
  end

  defp alive_neighbours(grid, cell_x, cell_y) do
    for x <- (cell_x - 1)..(cell_x + 1),
        y <- (cell_y - 1)..(cell_y + 1),
        x in 0..(size(grid) - 1) and
          y in 0..(size(grid) - 1) and
          (x != cell_x or y != cell_y) and
          cell_status(grid, x, y) == 1 do
      1
    end
    |> Enum.sum()
  end
end
```

Then we need a function which returns an SVG string to visualise the
grid.

```elixir
defmodule Life.Svg do
  @cell_size 10

  def render(grid) do
    size = Life.Grid.size(grid)

    cells =
      for y <- 0..(size - 1), x <- 0..(size - 1), into: "" do
        status = Life.Grid.cell_status(grid, x, y)
        fill = if status == 0, do: "#EEE", else: "purple"

        "<rect x=\"#{x * @cell_size}\" y=\"#{y * @cell_size}\" width=\"10\" height=\"10\" fill=\"#{fill}\" />\n"
      end

    """
    <svg viewBox="0 0 #{@cell_size * size} #{@cell_size * size}" xmlns="http://www.w3.org/2000/svg">
      #{cells}
    </svg>
    """
    |> Kino.Image.new(:svg)
  end
end
```

Now we'll add a function to generating random starting configurations.


```elixir
randomize = fn size ->
  for _ <- 1..size, do: Enum.map 1..size, fn _ -> Enum.random([0,1]) end
end
```

Next, we'll add a button to generate a few configurations and preview
them.

```elixir
button = Kino.Control.button("randomize")
Kino.Control.subscribe(button, :randomize)

button
```

When a button is pressed it sends events as messages. We handle them by
rendering an SVG.

```elixir
widget = Kino.Frame.new() |> Kino.render()
loop = fn f ->
  receive do
    {:randomize, _} ->
      # Preview the configuration when the button is pressed
      Kino.Frame.render(widget, Life.Svg.render(Life.Grid.new(randomize.(22))))
      f.(f)
    _ -> :ok
  end
end

loop.(loop)
```

Buttons are a new addition to Kino and Livebook released in version 0.4.0.
You can find their docs [here][button-docs].

Having made sure that we can correctly render a grid, we can finally animate it.

```elixir
Kino.animate(100, Life.Grid.new(randomize.(25)), fn grid ->
  {:cont, Life.Svg.render(grid), Life.Grid.next(grid)}
end)
```

<video controls>
  <source src="/images/posts/livebook_animations/life.mp4"
          type="video/mp4">
</video>

Thanks for reading this post, hope you'll find it useful and make
your notebooks pop with captivating animations.

[livebook-repo]: https://github.com/livebook-dev/livebook
[livebook-dev]: https://livebook.dev/
[brain-post]: {{< relref "post/elixir-nerves-pomodoro-timer.md" >}}
[kino-issue]: https://github.com/livebook-dev/kino/issues/48
[kino-pr]: https://github.com/livebook-dev/kino/pull/49
[kino-changelog]: https://github.com/livebook-dev/kino/blob/main/CHANGELOG.md#v031-2021-11-10
[life]: https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life
[life-notebook]: https://gist.github.com/zorbash/9ad9ad70335427a655a170c718427370
[sasa-life]: https://gist.github.com/sasa1977/6877c52c3c35c2c03c82
[button-docs]: https://hexdocs.pm/kino/Kino.Control.html#content
[kino]: https://hexdocs.pm/kino

<style>
.main-header {
  background-size: 32% auto;
}

.highlight {
  line-height: 20px;
}

.post img.img-small {
  height: 125px;
}

.post img.brain-poster {
  height: 250px;
}

.post img.scenic-preview {
  height: 300px;
}

video {
  max-width: 800px;
}

@media only screen and (max-width: 900px) {
  video {
    width: 90%;
  }
}
</style>

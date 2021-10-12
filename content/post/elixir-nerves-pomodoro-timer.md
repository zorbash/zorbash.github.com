+++
author = "Dimitris Zorbas"
date = "2021-10-12"
draft = false
title = "Building an Unusual Pomodoro Timer on Elixir and Nerves"
image = "/images/posts/highlights_notes/cover.png"
tags = ["elixir", "nerves", "embedded", "livebook", "raspberry-pi", "e-ink"]
comments = true
share = true
+++


In my previous post about ["Organising Book Highlights and Notes"][highlights-notes],
I wrote "Some day I may build a gadget for my desk to display a daily quote".
A few days later, it's on my desk and it couldn't have been a better
pretext to give [Livebook][livebook-repo] on [Nerves][nerves] a try.

<!--more-->

## Finished Product _..ish_

Well.. it still needs a proper case, I'm working on it.
<figure>
  <img src="/images/posts/elixir_nerves_pomodoro/brain.webp" class="img-medium" alt="actual image of Brain" />

  <figcaption>
  It's alive! 🧟
  </figcaption>
</figure>

## Goal

The scope of this weekend-project was to build some sort of smart desktop
ornament which periodically displays a random quote from my Kindle
highlights and [notes][notes] on an E Ink screen.
The quote is fetched via [bookworm 🪱📚][bookworm-repo].
The display should refresh every 25 minutes and flash, marking the end of a time
block.

As the title hints, this is an _unusual_ pomodoro timer. It deviates
from the standard [pomodoro technique][pomodoro], but it suits me.

### Name

A project needs a name, the obvious choice for something built on [Nerves][nerves] is
no other than **Brain** 🧠!

And here's a sample quote Brain would display:

>  The function of the **brain** and nervous system is to protect us from
> being overwhelmed and confused by this mass of largely useless and irrelevant
> knowledge, by shutting out most of what we should otherwise perceive or
> remember at any moment, and leaving only that very small and special selection
> which is likely to be practically useful.
>
>   Aldous Huxley, _The Doors of Perception_

The combination this name and Elixir's fault tolerancereminds me [this][brain-film] excellent horror film:

<img src="/images/posts/elixir_nerves_pomodoro/brain_poster.webp" class="img-medium brain-poster" alt="brain poster" />


### Optional Features

**Display the week number**

Keeping daily (non-work) tasks is too stressful for me. I prefer to plan
my weeks instead and set the goals for example for week `40 / 52`.

**Display the temperature outside**

I tend to hit the gym after work, so this is mostly to inform me whether to wear shorts.
_(plot twist: I'll wear shorts anyway)_.


## Why E Ink?

The slow refresh rate of E Ink devices is ideal for something I'll keep
right in from of me. It's not even backlit and it doesn't distract me at
all. I was sceptical of having yet another "screen" to look at. I've
even ditched my multi-monitor setup for a single monitor with the
laptop's monitor solely for messaging apps like Slack.
Oh and the energy ⚡️ consumption is minimal, [Pisugar][pisugar] could power it for a couple of days (untested
assumption).

## What you'll need

* Raspberry Pi 2 model B (that's what I had lying around)
* An SD card
* A WiFi USB dongle (Raspberry Pi 2 doesn't have on-board WiFi)
* [Pimoroni Inky wHat][inky-what] E Ink Display

You might notice there's a camera on my device, it's not required for
the features discussed in this post. A future next one will be about it
though, stay tuned!

## Instructions

Follow the instructions below to build one yourself.

### 1. Burn the Nerves Livebook Firmware

#### Install prerequisites for packaging firmware images

**MacOS**

```bash
brew update
brew install fwup squashfs coreutils xz pkg-config
```

**Linux (Debian)**

```bash
sudo apt install build-essential automake autoconf git squashfs-tools ssh-askpass pkg-config curl
```

Then install [nerves_bootstrap][nerves_bootstrap] with:

```bash
mix archive.install hex nerves_bootstrap
```

_You can find more detailed information about getting started with Nerves
[here][nerves-getting-started]._

#### Burn the Image

Follow the instructions on the [nerves_livebook][nerves_livebook] repo
to burn the firmware using `fwup` or run the code below in your shell:

```bash
wget https://github.com/livebook-dev/nerves_livebook/releases/download/v0.2.26/nerves_livebook_rpi2.fw

# Mind to replace with your SSID and passphrase
sudo NERVES_WIFI_SSID='access_point' NERVES_WIFI_PASSPHRASE='passphrase' fwup nerves_livebook_rpi2.fw
```

### 2. Mount the E Ink Screen Hat on the Pi

<img src="/images/posts/elixir_nerves_pomodoro/inky_set.webp" class="img-medium" alt="mounted screen" />

At this point you can already power on your Pi.

Point your browser to http://nerves.local ..and _voila_!

<figure>
  <img src="/images/posts/elixir_nerves_pomodoro/livebook_auth.png" alt="livebook auth" />
  <figcaption>
  The password is "nerves".
  </figcaption>
</figure>

🙌 You have an easily accessible instance of Livebook running on a tiny computer.
It runs in embedded mode by default which means that code evaluated in
your notebooks runs in the context of the Livebook node.

This is ideal, as it allows us to redefine [Scene][scene] modules from within a
notebook and trigger a screen refresh without uploading firmware changes and rebooting the Pi.
More about that further below.

### 3. Clone the Brain Repo

Hang tight, _we're halfway there_, run:

```bash
git clone git@github.com:zorbash/brain.git
```

### 4. Add Some Notes

You can use [bookwork][bookworm-repo] to download your Kindle highlights in a
format Brain understands or simply copy mine from https://github.com/zorbash/notes/blob/main/books.json
and place them in `priv/notes/`.


### 5. Deploy! 🚀

Then run:

```bash
export MIX_TARGET=rpi2

mix deps.get
mix firmware
mix firmare.gen.script
./upload.sh livebook@nerves.local
```

When it asks for a password, type in `nerves`.

That's it, a few moments later the screen should flash and your Brain
will have come to life.

## Making Changes

Brain is open-source and it's easy to tweak it according to your needs.
The UI is built using [Scenic][scenic] which makes it trivial to
preview changes locally without re-uploading firmware.

Start Scenic to preview your changes:

```bash
MIX_ENV=dev MIX_TARGET=host iex -S mix scenic.run
```

You should see a window like this:

<img src="/images/posts/elixir_nerves_pomodoro/scenic_preview.png" class="scenic-preview" alt="scenic preview" />



## Debugging

How to check connectivity
Things you can do with the toolshed

## The Fun Parts

**Elixir**

It's never not a joy working with Elixir.

**Nerves**

**Scenic**

**Livebook**

With this I always have a Livebook instance running and I can quickly
evaluate some code.

**The phoenix live dashboard**

## Caveats

The Pimoroni e-ink screen afaik does not support partial refresh, it'd
be cool to partially refresh the header (week, temperature, time) every
minute.

Scenic's text wrapping could be better (link to issue). I'd prefer it to
support the equivalent of `break-word` in css.

## Future Enhancements

* Get it to show notes per bookshelf, for example it could be configured
  to show only notes from the `computer science bookshelf` between 10
  and 11 AM and from `philosophy` between 6 and 7 PM.

## Further Reading

Nah, stop reading. Start organising!

---

[knowledge-mapping]: {{< relref "post/knowledge-mapping.md" >}}
[read.amazon]: https://read.amazon.co.uk/
[goodreads]: https://goodreads.com
[do-your-thing]: https://www.youtube.com/watch?v=p7Bq_MvkUtU
[bookworm-repo]: https://github.com/zorbash/bookworm
[notes]: https://github.com/zorbash/notes
[nimble_parsec]: https://github.com/dashbitco/nimble_parsec
[playlists]: https://open.spotify.com/playlist/3S11TYg16tPejXRn8bxGwg
[notion-share]: https://zorbash.notion.site/6bfc231028bd4b71b3a8f4854e31c083?v=5a57cd6e61fd4e7fb2dcaebf335e1da6
[pomodoro]: https://en.wikipedia.org/wiki/Pomodoro_Technique
[highlights-notes]: {{< relref "post/highlights-notes.md" >}}
[livebook-repo]: https://github.com/livebook-dev/livebook
[nerves]: https://www.nerves-project.org/
[pisugar]: https://www.amazon.co.uk/Pisugar2-Portable-Lithium-Raspberry-Accessories/dp/B08D678XPR
[inky-what]: https://shop.pimoroni.com/products/inky-what?variant=13590497624147
[brain-film]: https://en.wikipedia.org/wiki/The_Brain_That_Wouldn%27t_Die
[scenic]: https://github.com/boydm/scenic
[scenic-text-issue]: https://github.com/boydm/scenic/issues/118https://github.com/boydm/scenic/issues/118
[nerves_bootstrap]: https://github.com/nerves-project/nerves_bootstrap
[nerves-getting-started]: https://hexdocs.pm/nerves/installation.html
[scene]: https://hexdocs.pm/scenic/scene_lifecycle.html#the-root-scene

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
</style>

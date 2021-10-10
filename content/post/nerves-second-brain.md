+++
author = "Dimitris Zorbas"
date = "2021-10-10"
draft = false
title = "Building a Second Brain on Elixir and Nerves"
image = "/images/posts/highlights_notes/cover.png"
tags = ["open-source", "elixir", "nerves", "embedded", "livebook"]
comments = true
share = true
+++


My previous post about ["Organising Book Highlights and Notes"][highlights-notes]
where I said "Some day I may build a gadget for my desk to display a daily quote" set the
perfect pretext for me to give [Livebook][livebook] on [Nerves][nerves] a try.

<!--more-->

## Finished Product ..ish

Well.. it still needs a proper case but I'm working on it.

## Goal

The scope of this weekend project was to build some sort of desktop
ornament which periodically displays a random quote from my Kindle
highlights and [notes][notes]. The quote is fetched via [bookworm][bookworm-repo].

### Optional Features

**Refresh every 25 minutes**

The slow refresh rate of e-ink devices is ideal for something I'll keep
right in from of me. It's not even backlit and it doesn't distract me at
all. I was sceptical of having yet another "screen" to look at. I've
even ditched my multi-monitor setup for a single monitor with the
laptop's monitor solely for messaging apps like Slack.

But why precisely 25 minutes? So that it can be used as a makeshift
pomodoro timer. When the screen flashes, 25 minutes have passed, time
for a 5 minute break followed by the next 25 minutes of focus.

**Display the week number**

Our time on this planet is limited and I tend to measure it in weeks.
Keeping daily (non-work) tasks is too stressful for me. I prefer to plan
my weeks instead and set the goals for example for week `40 / 52`.

**Display the temparature outside**

I tend to hit the gym after work, so this is mostly to inform me whether to wear shorts.
_(plot twist: I'll wear shorts anw)_.

## What you'll need

* Raspberry Pi 2 model B (that's what I had lying around)
* A wifi usb dongle
* Pimoroni Inky What e-ink
* A lot of duct tape

You might notice there's a camera on my device, it's not required for
the features discussed in this post. The next one will be about it
though, stay tuned!

## Instructions

1. Burn the nerves livebook firmware (make sure to set the SSID variables)
2. Connect the e-ink screen hat to the pi.
3. Deploy! (mix firmware && mix firmware.gen.script && upload)

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

The Pimoroni e-ink device takes a long time for a full refresh and
afaik does not support partial refresh.

## Future Enhancements

* Get it to show notes per bookshelf, for example it could be configured
  to show only notes from the `computer science bookshelf` between 10
  and 11 AM and from `philosophy` between 6 and 7 PM.

## Further Reading

Nah, stop reading. Start organising!

---

Cover image credits: [@giamboscaro][giamboscaro]

[giamboscaro]: https://unsplash.com/@giamboscaro
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
</style>

+++
author = "Dimitris Zorbas"
date = "2021-10-02"
draft = false
title = "Organising Book Highlights and Notes"
image = "/images/posts/highlights_notes/cover.jpg"
tags = ["open-source", "ruby", "reading", "learning"]
comments = true
share = true
+++


I've used a variety of tools to organise my reading and notes. Given I spend a significant amount of my time studying,
depending on 3rd parties gives me anxiety. Any of the tools I use, even the open-source offline-first ones,
can become unmaintained, ridden with security vulnerabilities, slow or they may change in way which makes
me reluctant to use them.

To some extent, this post is a sequel to ["knowledge mapping"][knowledge-mapping].

<!--more-->

## Why care about my notes and Highlights?

A friend asked this question. She said, are you going to use this
mid-conversation to correct someone? Do you want to be the "Well, Ackchyually.." guy?

<div class="polaroid">
  <img src="/images/posts/highlights_notes/actually.png" class="img-small" alt="actually">
</div>

<br/>

Most definitely **not**. I've noticed the rate of information
I consume keeps increasing disproportionately to the rate I digest it
into knowledge. I repeat it's about building knowledge not
memorising.

This project in particular, is about using tech for
"good", [doing your thing][do-your-thing], or _escaping from servitude to
the capitalistic delusion of perpetual exponential growth (too far eh?  😅)_.

Initially I became reasonably frustrated of not being able to revisit my Kindle highlights.
Half of the books I read, I do so on my Kindle device, I highlight sentences, then said
highlights appear on [goodreads.com][goodreads] and [read.amazon.co.uk][read.amazon].

I felt locked-in using Goodreads (owned by Amazon) and [read.amazon].
What if my highlights become unavailable due to some licensing issue?

Having all my highlights in one place, open up some interesting possibilities. Similar
to how I fancy creating [playlists][playlists], I might for example, some day curate my favourite
quotes by an author. Some day I may build a gadget for my desk to display a daily quote 
(raspberrypi + e-ink).

## So.. I built a thing

I started off with a simple script which downloads all my Kindle highlights.
It formats and builds a readable, pretty-printed JSON file which I sync
in Git.

Then I enhanced it so that I can write my own notes and highlights from
non-Kindle physical books.

Then I made it create and incrementally import highlights
into a Notion database. Why? I was too lazy to write a frontend and I'm
starting to like Notion.
What's great about this database is that it can be embedded as a view in
any page.

<figure>
  <img src="/images/posts/highlights_notes/notion_database.webp" class="img-medium" alt="notion database">
  <figcaption>
  Quick search from any page
  </figcaption>
</figure>

The Notion database can then be shared. He's [mine][notion-share].

## Demo Time

The script can be found [here][bookworm-repo] and accepts the following commands:

### `sync_local`

```shell
./notes sync_local
```

It downloads Kindle highlights and imports local notes into a `books.json` file.

<video controls width="600">
  <source src="/images/posts/highlights_notes/sync_local.webm"
          type="video/webm">
</video>


The location of the flat-file "database" can be configured through a
`DB_FILEPATH` env var, which can also be set in a `.env` file.

The "database" file is intended to be version-controlled with Git.

**Local Notes**

Highlights and notes can also be imported into the "database" `books.json` file.
Such notes are written as YAML, yes YAML. I contemplated
creating my own tiny markup language for this (ideally using
[nimble_parsec][nimble_parsec]), this non-feature ended up in the "backlog".

The location of the notes file can be configure through the `NOTES_FILEPATH` env var, which can also be set in a `.env` file.


```yaml
-
  # The asin key may also hold an ISBN
  asin: 0-679-76288-4
  title: High Output Management
  author: Andy Grove
  highlights:
    -
      location: 17
      text: >
        A genuinely effective indicator will cover the output of the work unit and not simply
        the activity involved.
```

### search

```shell
./notes search <keyword>
```

Prints any highlights which match the given keyword.

Example:

```shell
./notes search work

Found 179 results for "work"

╔════════════════════════════════════════════════════════════════════╗
║  Book:   High Output Management                                    ║
║  Author: Andy Grove                                                ║
╚════════════════════════════════════════════════════════════════════╝

 A genuinely effective indicator will cover the output of the work unit
and not simply the activity involved.
```

### random

```shell
./notes random
```

Returns a random highlight.

Example:

```shell
╔════════════════════════════════════════════════════════════════════╗
║  Book:   The Genealogy of Morals                                   ║
║  Author: Friedrich Nietzsche                                       ║
╚════════════════════════════════════════════════════════════════════╝

 All sick and diseased people strive instinctively after a herd-organisation,
out of a desire to shake off their sense of oppressive discomfort and weakness;
the ascetic priest divines this instinct and promotes it;
```

### update_notion

```shell
./notes update_notion
```

Syncs the local "database" file into a Notion database.

<video controls width="600">
  <source src="/images/posts/highlights_notes/update_notion.webm"
          type="video/webm">
</video>

It supports the `--since <date>` flag to only sync the database entries
which have been updated since the given date (ISO-8601 formatted). This
option is particularly useful since the Notion API is rate-limited and
for more than 1000 highlights syncing can take significant time (more
than 10 minutes).

## Recap

### Features

- Offline-first - The "database" is a single JSON file
- Version control - The JSON database file is prettified making it easy to review and commit changes to git
- Both notes and the JSON database are readable and searchable using a text editor
or tools like `jq`
- Fast search - Both the CLI search and Notion's search are fast

### Non-Features

- Removing highlights from the local database - I never delete highlights
- Full-text search - Simple regex case-insensitive does the trick for now


## Contributing

Feel free to fork either the [bookworm script][bookworm-repo] or my [notes][notes].
As stated at the top of this post, this is a fun project for me, so
expect no support. However, I'd be glad to discuss ideas on this domain.


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

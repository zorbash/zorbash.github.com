+++
author = "Dimitris Zorbas"
date = "2020-08-23"
title = "Knowledge Mapping"
image = "/images/posts/knowledge_map/banner_cropped.jpg"
tags = ["learning", "education", "visualization", "javascript", "ruby"]
comments = true
share = true
+++

_What do **I** know? What do **we** know?_

_How do we know what we know and what is there that we should know?_

<!--more-->

Video games like Age of Empires, Civilisation and others have the concept of technology trees.

<img src="/images/posts/knowledge_map/aoe.jpg" class="img-medium">

I study a lot, where should I spend my time? What should I read next? Is my knowledge broad enough?
I’ve used Goodreads quite extensively, it’s great to discover new books to read, mark your progress,
make friends and such.

Nowadays there’s so much information readily available, but not that many tools to help you
organise and allocate your “research points”.

## Learning Together

The recent COVID-19 pandemic surfaced the shortcomings of humanity to work together
to solve fundamental healthcare issues.
Some “experts” rushed to call it a black swan, despite it clearly not being one ([read more][nyorker-taleb]).

Thousands of Americans are victims of the opioid crisis and countless ones
are shoveling their money in the wild-west of unregulated fintech companies
with mottos like “anyone can be a trader” or in cryptocurrencies 🙃.

The media promote optimising for the short-term, making us think we’re the last generation to walk the planet.
Our countries are involved in wars, we fund wars with our taxes, yet the disasters
that war brings always seem so remote.

How do we respond? We **educate** ourselves, we **talk**, we **act**. A university degree or a code
bootcamp might help you land a job, but securing your freedom of thought is a never-ending struggle.

## Learning to Learn

Be more systematic, build your knowledge map and start exploring branch
by branch.
You don’t need a degree as a reward, nor any imaginary internet points.
The real reward is that you’ll be able to better understand the natural world and society.
Think of [#BlackLivesMatter][blm] how much do you know about it? Do you want to be the person who forms
an opinion based on a couple of tweets or headlines?
Create a list of books, films, articles to go through and keep track of your progress.

> Reading, has this incredible effect that it minimises your chances of becoming a racist,
> an anti-vaxxer, a climate-change denier or a flat earther. Quite a reward ain’t it?

## Universities

Universities play the role of gatekeepers of knowledge and the perpetuation of class segregation.
Your studies have a certain duration and you get a degree. While such a concept is valuable to maintain
the status quo and keep the economy going it doesn't really seem to be about knowledge.
Learning is a continuous process and universities should not extinguish your passion for knowledge in exchange for a degree.
For me, receiving my degree wasn't something to celebrate. It was rather a warrant to stay away from the
supposed mecca of learning.

<img src="/images/posts/knowledge_map/university.jpg" class="img-medium">

Fortunately in the digital age there are plenty of choices when it comes to expanding your knowledge.
[Khanacademy][khanacademy], [Coursera][coursera], [Udacity][udacity] to name a few.
Most of them seem heavily leaning towards STEM studies though. Where do we learn about the world?

First things first, by “the world” I mean outside the tech bubble.

> Yes, I can fix your computer, but how do I fix racism, how do I get to know my body, improve my health,
> manage my personal finances and understand democracy and political science, so to meaningfully
> participate in the commons?

## There's Hope

The open-source community is a fantastic example of people working asynchronously together and
having colossal impact in our lives.

A laughably simple algo to keep learning could be:

1. Map your knowledge in a graph format
2. Keep notes / annotate your readings publicly
3. Pick another branch from the tree
4. Go to step 2

Remember, there's nothing embarrassing in admitting you don't know
something, it's empowering and the first step to master any subject.

What about the cover image of this post?
Well, I couldn't help it and wrote some code to support it.

# Visualising Knowledge Maps

Khanacademy used to have a [knowledge map][ka-map] feature which I found
inspiring. Browsing a universe of infinite topics, continuing education ftw.

<img src="/images/posts/knowledge_map/ka_map.jpg" class="img-medium">

### Building my Knowledge Map

So, I decided to build my own map and needed to bootstrap it somehow. I
quickly extracted, cleaned and analysed the tags of my Tefter bookmarks.
For the uninitiated, [Tefter](https://tefter.io) is a social bookmarking app I use heavily and I also develop 🤠.

<img src="/images/posts/knowledge_map/banner.jpg" class="img-medium">

On the graph, tags are nodes and edges connect topics when they appear as tags on the same bookmark.

Is this a real knowledge map? No, it's the minimum viable hack, a
compass to aid me steer towards building the real one.

Feel free to have a look and remix the code of the visualisation on [Glitch][glitch].

To make progress I'll attempt to bring order to that
chaotic graph by grouping some topics together. I'm also starting this
book ["Consilence: The Unity of Knowledge"][consilence] which might help me with that.

I'll also try to evaluate some apps and methodologies below:

* https://beepb00p.xyz/promnesia.html
* https://foambubble.github.io/foam/
* https://roamresearch.com/
* https://www.buildingasecondbrain.com/
* https://zettelkasten.de/posts/overview/

You've reached the end of this post. Please post your thoughts,
feedback and ideas in the comments.

[nyorker-taleb]: https://www.newyorker.com/news/daily-comment/the-pandemic-isnt-a-black-swan-but-a-portent-of-a-more-fragile-global-system
[blm]: https://twitter.com/hashtag/BlackLivesMatter
[khanacademy]: https://www.khanacademy.org/
[coursera]: https://www.coursera.org/
[udacity]: https://www.udacity.com/
[ka-map]: https://khanacademy.fandom.com/wiki/Knowledge_Map
[consilence]: https://en.wikipedia.org/wiki/Consilience_(book)
[glitch]: https://glitch.com/~helpful-kind-beechnut

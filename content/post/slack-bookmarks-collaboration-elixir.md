+++
author = "Dimitris Zorbas"
date = "2019-10-23"
draft = false
title = "A Slack bookmarking application in Elixir with Opus"
image = "/images/posts/slack_bookmarks_collaboration_elixir/cover.jpg"
tags = ["elixir", "slack", "bookmarking"]
comments = true
share = true
+++

This post describes how we used Elixir and Opus in one of our services at
[Tefter][tefter], which implements bookmarking collaboration in Slack.

## My relationship with Slack

I remember, when Slack started getting viral and it was set as the main
chat app  at work, I was very reluctant to use it. I was quite happy with IRC and
always in favour of open protocols. Since it supported an IRC / XMPP
gateway, tweaking my [irssi][irssi] config and later [finch][finch] was
trivial and my overall experience was good.
Later I developed my first Slack apps to experiment, accomplish
trivial tasks and participate in company hackathons.

## Tefter

Recently at [Tefter][tefter], we released a new [organisations][tefter-organizations] feature. This
feature, gives users the ability to collaborate within a Slack workspace.

<img src="/images/posts/slack_bookmarks_collaboration_elixir/create_org.png"
  class="img-medium"
  alt="tefter create organization"/>

Essential commands of the Slack app:

**Create a bookmark**

```shell
/tefter <url>
```

**Create an alias**

```shell
/tefter alias <alias> <url>
```

**Search**

```shell
/tefter search <query>

# Alternatively
/tefter s <query>
```

This is what a search looks like:

<img src="/images/posts/slack_bookmarks_collaboration_elixir/slack_tefter_search.png"
  class="img-medium"
  alt="tefter search slack with organizations"/>

**Retrieve a link by alias**

```shell
/tefter <alias>
```

Aliases are especially useful for recurring questions concerning a link. For example
"What is the API documentation page for service x?". There you can
create a "docs" alias and point people to the link by calling `/tefter docs`.

## Microlith

The microservice dealing with that side of our system is named Microlith. That is to contradict
its tendency to become a monolith 🙈. It is written in Elixir and it
leverages a library for railway-oriented programming called [Opus][opus].
Surprisingly I've never blogged about this tiny library of mine before, but a
[few][blog-few] [others][blog-others] have.
It incorporates some software design principles I keep close to my heart.

The main principles of Opus are:

* Each Opus pipeline module has a single entry point and returns tagged tuples `{:ok, value}` | `{:error, error}`
* A pipeline is a composition of stateless stages
* A stage returning `{:error, _}` halts the pipeline
* A stage may be skipped based on a condition function (`:if` and `:unless` options)
* Exceptions are converted to `{:error, error}` tuples by default
* An exception may be left to raise using the `:raise` option
* Each stage of the pipeline is instrumented. Metrics are captured automatically (but can be disabled).
* Errors are meaningful and predictable

In this post, I'll show you some code examples from Microlith where Opus is used.

The great thing about Opus is that a use-case can be described as a
series of stages. Similar to your grandma's beef stew recipe.

### Creating a bookmark with Opus

So the "recipe" to create a bookmark from Slack is:

* check that the payload has the correct format
* check that the payload contains a URL to bookmark
* normalise the URL
* retrieve the Tefter account by its Slack identifier
* check that the account can create a bookmark
* create the bookmark
* respond to the user

Our next move will be to translate this to pseudo-code in Opus terms.

```elixir
check :valid_payload?
check :payload_contains_url?
step :normalize_url
step :fetch_user
check :can_create_bookmark?
step :create_bookmark
step :respond
```

A quick rundown of the available stages of Opus.

* `step`: This stage processes the input value and with a success value the next stage is called with that value.
With an error value the pipeline is halted and an `{:error, any}` is returned.

* `check`: This stage is intended for validations. It calls the stage function and unless it returns true, it halts the pipeline.
* `tee`: This stage is intended for side effects, such as a notification or a call to an external system where the return value is not meaningful. It never halts the pipeline.
* `link`: This stage is to link with another Opus.Pipeline module. It calls `call/1` for the provided module. If the module is not an `Opus.Pipeline` it is ignored.
* `skip`: The skip macro can be used for linked pipelines. A linked pipeline may act as a true bypass, based on a condition,
expressed as either `:if` or `:unless`. When skipped, none of the stages are executed and it returns the input,
to be used by any next stages of the caller pipeline.

Now we can define our Opus.Pipeline module.

```elixir
defmodule Microlith.Commands.CreateBookmark do
  @moduledoc "Pipeline which handles the bookmark command to create a bookmark"

  use Opus.Pipeline

  alias Microlith.Pipelines.FetchUser

  check :valid_payload?, error_message: :invalid_payload
  check :contains_url?, error_message: "Command called without a URL"
  step :trim_url, with: &%{&1 | url: String.trim(&1[:url])}
  step :fetch_user
  check :can_create_bookmark?
  step :create_bookmark
  step :respond
end
```

The module we just defined, can be used as follows:

```elixir
payload = %{
  input: "https://zorbash.com",
  slack_user_id: "a Slack user identifier",
  team_id: "a Slack team identifier",
  team_domain: "whitehouse",
  response_url: "https://hooks.api.slack.com/deadbeef"
}

case Microlith.Commands.CreateBookmark.call(payload) do
  {:ok, response} ->
    json(response)
  {:error, error} ->
    Logger.warn(inspect(error))
    send_resp(conn, 422, "The request could not be accepted")
end
```

## Concurrency

Like any decent cooking recipe, the implementation is left to the chef.
You may want to crack 6 eggs with one hand while stirring some sauce
with the other, but the end-result should be the same. Thankfully the Elixir toolset
is very well equipped with facilities to make operations in a pipeline
concurrent. In most cases all we have to do is to start [Task][elixir-task]s and pass them down
to next stages. When a stage requires the result of a Task.
`Task.await/1` can be used.

## Visualising Pipelines

I kept my favourite part for last.

With Opus you can visualise your
pipelines using `Opus.Graph` using [`Opus.Graph.generate/1`][doc-graph-generate].

So at some point in the development of Microlith, it looked like this:


<img src="/images/posts/slack_bookmarks_collaboration_elixir/graph.png"
  class="img-medium"
  alt="opus visualisation of tefter"/>

Protip: You should prefer the SVG output, where you can hover on stages and
pipelines to read their documentation.

## Closing Thoughts

I hope that this post gives an idea of the features of Opus and I promise to cover the next of them in a following post.
If you're using Opus, I'd be glad to hear your feedback.

Do you represent an open-source community and you're interested to try
out Tefter Organizations? Let me know and we'll add you to an unlimited
plan without any cost.

<style>
.main-header {
  background-size: 32% auto;
}

.highlight {
  line-height: 20px;
}
</style>

[irssi]: https://packages.debian.org/stable/irssi
[finch]: https://packages.debian.org/stable/finch
[tefter-organizations]: https://tefter.io/faq#organizations
[tefter]: https://tefter.io
[opus]: https://github.com/zorbash/opus
[elixir-task]: https://elixir-lang.org/getting-started/mix-otp/distributed-tasks.html#asyncawait
[blog-few]: https://medium.com/quiqup-engineering/how-to-create-beautiful-pipelines-on-elixir-with-opus-f0b688de8994
[blog-others]: https://www.pagerduty.com/eng/elixir-webhook-service/
[doc-graph-generate]: https://hexdocs.pm/opus_graph/Opus.Graph.html

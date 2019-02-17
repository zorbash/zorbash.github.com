+++
author = "Dimitris Zorbas"
date = "2019-02-17"
draft = false
title = "The 10-minute Rails Pub/Sub"
image = "images/posts/the_10_minute_rails_pubsub/cables.jpg"
tags = ["open-source", "rails", "ruby", "architecture"]
comments = true
share = true
+++


This time we'll experiment with a quick way to architecture a Rails
application to use Pub/Sub instead of model callbacks.

## What's wrong with callbacks

Rails active record models easily become bloated, that's where most of
the business logic tends to live after all. One of the most common sources of
technical debt in Rails apps is [callbacks][rails-callbacks]. Models become [god-objects][god-object]
with dependencies to other models, mailers and even 3rd party services.

When it comes to refactoring this coupling, I usually recommend
extracting all callbacks to stateless functions which can be composed to
form pipelines. One can use [dry-transaction][dry-transaction] for that.
My love for such composable architectures led me to create [Opus][opus] for Elixir.

I'm also quite proud that callbacks got deprecated in [Ecto][ecto-model-callbacks] 🎉.

## About Pub/Sub

The focus of this post is [Pub/Sub][pubsub]. The models will publish
events concerning database updates. A database record gets created /
updated / destroyed and then a subscriber does something, or chooses to
ignore that event.

## Enter ActiveSupport::Notifications

We'll lay the foundations for this ten minute implementation on top of
[ActiveSupport::Notifications][active_support-notifications]. Originally
introduced as an instrumentation API for Rails, but there's nothing
preventing us from using it for custom events.

<img src="/images/posts/the_10_minute_rails_pubsub/they_should.jpg" class="img-medium">

Some facts about [ActiveSupport::Notifications][active_support-notifications].

* It's basically a thread-safe queue
* Events are synchronous
* Events are process-local
* It's simple to use 😎

Transactions?

Caveats?

### Alternatives

* [dry-events][dry-events]
* [wisper][wisper]

## The Code

NOTE

What about other types of instance-mutating events like
`before_validation` or `after_initialize`?

Don't get me started with `after_initialize`, it's known to bring so
much trouble (hint: n + 1 queries), its use should be banned.

## Conclusion

[ecto-model-callbacks]: https://hexdocs.pm/ecto/1.1.0/Ecto.Model.Callbacks.html
[rails-callbacks]: https://guides.rubyonrails.org/active_record_callbacks.html
[god-object]: https://en.wikipedia.org/wiki/God_object
[opus]: https://github.com/zorbash/opus
[dry-transaction]: https://dry-rb.org/gems/dry-transaction/
[pubsub]: https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern
[active_support-notifications]: https://api.rubyonrails.org/classes/ActiveSupport/Notifications.html
[dry-events]: https://dry-rb.org/gems/dry-events/
[wisper]: https://github.com/krisleech/wisper

<style>
.main-header {
  background-size: 32% auto;
}

.highlight {
  line-height: 20px;
}
</style>

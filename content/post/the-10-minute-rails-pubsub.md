+++
author = "Dimitris Zorbas"
date = "2019-02-17"
draft = false
title = "The 10-minute Rails Pub/Sub"
image = "images/posts/the_10_minute_rails_pubsub/cables.jpg"
tags = ["open-source", "rails", "ruby", "architecture", "pub-sub"]
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

The solution which is the focus of this post is [Pub/Sub][pubsub]. The models will publish
events concerning database updates. A database record gets created /
updated / destroyed and then a subscriber does something, or ignores the event.

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

## The Code

In this experiment, we'll cover the following scenario:

```cucumber
When a User "zorbash" is created
And "zorbash" had been invited by "gandalf"
Then the field signups_count for "gandalf" should increase by 1
```

First we'll create a model concern which we can include to our `User`
model to publish events each time a record is created.

```ruby
# frozen_string_literal: true

module Publishable
  extend ActiveSupport::Concern

  included do
    after_create_commit :publish_create
    after_update_commit :publish_update
    after_destroy_commit :publish_destroy
  end

  class_methods do
    def subscribe(event = :any)
      event_name = event == :any ? /#{table_name}/ : "#{table_name}.#{event}"

      ActiveSupport::Notifications.subscribe(event_name) do |_event_name, **payload|
        yield payload
      end

      self
    end
  end

  private

  def publish_create
    publish(:create)
  end

  def publish_update
    publish(:update)
  end

  def publish_destroy
    publish(:destroy)
  end

  def publish(event)
    event_name = "#{self.class.table_name}.#{event}"

    ActiveSupport::Notifications.publish(event_name, event: event, model: self)
  end
end
```

Then we must include it in our model.

```ruby
# frozen_string_literal: true

class User < ApplicationRecord
  include Publishable # 👈 Added here

  devise :invitable

  # other omitted code
end
```

Let's implement a subscriber.

```ruby
module UserSubscriber
  extend self

  def subscribe
    User.subscribe(:create) do |event|
      event[:model].increment!(:signups_count)
    end
  end
end
```

Finally, we have to initialize the subscription.

```ruby
# File: config/initializers/subscriptions.rb
Rails.application.config.after_initialize do
  UserSubscriber.subscribe
end
```

### Caveats

The more listeners you add, the slower it becomes for an event to be
handled in sequence across all listeners. This is similar to how an
object would call all callback handler methods one after the other.

See: [active_support/notifications/fanout.rb][fanout.rb]

```ruby
def publish(name, *args)
  listeners_for(name).each { |s| s.publish(name, *args) }
end
```

They're also not suitable for callbacks used to mutate a record like
`before_validation` or `after_initialize`.

Furthermore there are no guarantees that an event will be processed
successfully. Where things can go wrong, will go wrong. Prefer a
solution with robust recovery semantics.

## Next Steps

For enhanced flexibility, we can push events to Redis or RabbitMQ or Kafka. How
to pick one according to your needs is beyond the scope of this post.
However you can consider yourself lucky, since there are tons of resources out
there and mature libraries to build your event-driven system on top of.

### Alternatives

Notable Pub/Sub gems:

* [dry-events][dry-events]
* [wisper][wisper]

For other handy libraries and posts, subscribe to my Tefter [Ruby & Rails][tefter-ruby] list.

[ecto-model-callbacks]: https://hexdocs.pm/ecto/1.1.0/Ecto.Model.Callbacks.html
[rails-callbacks]: https://guides.rubyonrails.org/active_record_callbacks.html
[god-object]: https://en.wikipedia.org/wiki/God_object
[opus]: https://github.com/zorbash/opus
[dry-transaction]: https://dry-rb.org/gems/dry-transaction/
[pubsub]: https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern
[active_support-notifications]: https://api.rubyonrails.org/classes/ActiveSupport/Notifications.html
[dry-events]: https://dry-rb.org/gems/dry-events/
[wisper]: https://github.com/krisleech/wisper
[fanout.rb]: https://github.com/rails/rails/blob/v5.2.2/activesupport/lib/active_support/notifications/fanout.rb#L51
[tefter-ruby]: https://www.tefter.io/zorbash/lists/ruby-rails

<style>
.main-header {
  background-size: 32% auto;
}

.highlight {
  line-height: 20px;
}
</style>

+++
author = "Dimitris Zorbas"
date = "2021-01-16"
draft = false
title = "sidekiq-dry"
image = "/images/posts/sidekiq_dry/loading_bay.jpg"
tags = ["open-source", "dry-rb", "rails", "ruby", "sidekiq"]
comments = true
share = true
+++


I published a new gem, `sidekiq-dry` aiming to tackle a variety of
common frustrations when it comes to [Sidekiq][sidekiq] jobs and their arguments.

<!--more-->

## Rationale

Sidekiq is among the most popular background job solutions. It's my
first choice for Ruby apps. The [dry-rb][dry-rb] family of gems is also
indispensable in non-trivial applications. What if we combined the two..

<img src="/images/posts/sidekiq_dry/scientists.jpg" class="img-medium">

With `sidekiq-dry` you may pass instances of `Dry::Struct` as arguments
to your Sidekiq jobs. But why?

### Prevent Type Ambiguity

Numerous times I've had to debug jobs which where failing due to being
enqueued with invalid arguments.

Example:

```ruby
class SendInvitationEmailJob
  include Sidekiq::Worker

  def perform(user_id, invitee_email)
    # code
  end
end
```

```ruby
SendInvitationEmailJob.perform_async(user.id, params[:invitee_email])
```

The problem with the above code is that if the `user_id` is not an
Integer id or the `invitee_email` is not a valid email String then
there's absolutely no chance that the enqueued job will complete
successfully. Of course `Dry::Struct` is not to be used for validations,
there's `dry-validate` for that, or `ActiveModel` / `ActiveRecord`
validations if you prefer. Giving more structure to your
background job arguments improves the system's robustness. Your objects
in transport through `Redis`, as long as the job is enqueued, they are
guaranteed to have the expected structure when the job is performed.

The above example would be refactored to:

```ruby
class SendInvitationEmailJob
  include Sidekiq::Worker

  def perform(params)
    # code
  end
end
```

```ruby
class SendInvitationEmailJob::Params < Dry::Struct
  attribute :user_id, Types::Strict::Integer
  attribute :invitee_email, Types::Strict::String.constrained(format: /\A[\w+\-.]+@[a-z\d\-]+(\.[a-z]+)*\.[a-z]+\z/i)
end
```

```ruby
job_params = SendInvitationEmailJob::Params.new(user_id: user.id, invitee_email: params[:invitee_email])

SendInvitationEmailJob.perform_async(job_params)
```

At this point you might ask, _what if we passed in a Hash, instead of a `Dry::Struct`?_
Well, Hash arguments are deserialised with String keys which can lead to surprises.

### Eliminate Positional Arguments

When your background job takes two or more positional arguments, it's
better to refactor it to take a single struct object with a
comprehensible name.

In the Rails world it's common to enqueue jobs with a record's `id`.
There's nothing wrong with this pattern. However, in some cases, developers may define a
model blindly following the convention.

### Documentation

By using `Dry::Struct` arguments you'll be able to express constraints
straight in your code. Instead of documenting the types of each job argument,
which can easily become outdated, you can refer to the types of the attributes of the struct.

```ruby
class Post < Dry::Struct
  attribute :title,  Types::Strict::String
  attribute :tags,   Types::Array.of(Types::Coercible::String).optional
  attribute :status, Types::String.enum('draft', 'published', 'archived')
  attribute :body,   Types::String.constrained(min_size: 10, max_size: 10_000)
end
```

Arguably, in the example above, both types and constraints improve readability.

### Versioning
Adding this gem does not break any existing jobs in your app.
It only works on jobs enqueued with `Dry::Struct` objects.

Adding a new attribute to a parameter struct won't break already enqueued jobs.

It's trivial to version your structs using either a `version` attribute:

```ruby
class Coupons::ApplyCouponJob::Params < Dry::Struct
  attribute :user_id,     Types::Strict::Integer
  attribute :coupon_code, Types::Strict::String
  attribute :version,     Types::Strict::String.default('1')
end
```

or versioned classes:

```ruby
class Coupons::ApplyCouponJob::Params::V1 < Dry::Struct
  attribute :user_id,     Types::Strict::Integer
  attribute :coupon_code, Types::Strict::String
end
```

## Caveats

Job processing libraries compatible with Sidekiq, for example
[exq][exq], won't deserialise your Dry::Struct arguments. This is most likely an acceptable tradeoff.

## The Gem

The gem is hosted on rubygems ([link][gem]). It provides two Sidekiq
middlewares which serialise and deserialise instances of `Dry::Struct`
arguments in your jobs.

### Installation

Add the gem in your Gemfile:

```ruby
gem 'sidekiq-dry'
```

Configure `Sidekiq` to use the middlewares of the gem:

```ruby
# File: config/initializers/sidekiq.rb

Sidekiq.configure_client do |config|
  config.client_middleware do |chain|
    chain.prepend Sidekiq::Dry::Client::SerializationMiddleware
  end
end

Sidekiq.configure_server do |config|
  config.client_middleware do |chain|
    chain.prepend Sidekiq::Dry::Client::SerializationMiddleware
  end
  config.server_middleware do |chain|
    chain.add Sidekiq::Dry::Server::DeserializationMiddleware
  end
end
```

## Rubocop

Finally, you may set up a custom Rubocop rule like the following to
nudge developers use Dry::Struct arguments.

```ruby
module RuboCop
  module Cops
    module Jobs
      class Arguments < RuboCop::Cop::Cop
        MAX_JOB_ARGUMENTS = 3
        MSG = 'Replace %<args_count>d arguments with a single Dry::Struct'.freeze

        def on_args(node)
          return unless perform_method?(node.parent)

          args_count = node.children.size

          return if args_count <= MAX_JOB_ARGUMENTS

          add_offense(node.parent, message: MSG % { args_count: args_count })
        end

        private

        def_node_matcher :perform_method?, <<~PATTERN
          (def :perform (args ...) ...)
        PATTERN
      end
    end
  end
end
```

## Further Reading

* [dry-rb][dry-rb]
* [dry-types][dry-types]

For other handy libraries and posts, subscribe to my Tefter [Ruby & Rails][tefter-ruby] list.

[sidekiq]: https://hexdocs.pm/ecto/1.1.0/Ecto.Model.Callbacks.html
[gem]: https://rubygems.org/gems/sidekiq-dry
[dry-rb]: https://dry-rb.org/
[exq]: https://github.com/akira/exq
[tefter-ruby]: https://www.tefter.io/zorbash/lists/ruby-rails
[dry-types]: https://dry-rb.org/gems/dry-types/1.2/

<style>
.main-header {
  background-size: 32% auto;
}

.highlight {
  line-height: 20px;
}
</style>

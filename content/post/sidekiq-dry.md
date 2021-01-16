+++
author = "Dimitris Zorbas"
date = "2021-01-16"
draft = true
title = "sidekiq-dry"
image = "/images/posts/sidekiq_dry/loading_bay.jpg"
tags = ["open-source", "dry-rb", "rails", "ruby", "sidekiq"]
comments = true
share = true
+++


I published a new gem, `sidekiq-dry` aiming to tackle a variety of
common frustrations when it comes to [Sidekiq][sidekiq] jobs and their arguments.

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
in transport through Redis, as long as the job is enqueued, they are
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

Which arguments are optional?

### Documentation

### Versioning

## The Gem

The gem is hosted on rubygems ([link][gem]). It provides two Sidekiq
middlewares which serialise and deserialise instances of `Dry::Struct`
arguments in your jobs.

### Installation

* Update your Gemfile
* Initialise both middlewares



For other handy libraries and posts, subscribe to my Tefter [Ruby & Rails][tefter-ruby] list.

[sidekiq]: https://hexdocs.pm/ecto/1.1.0/Ecto.Model.Callbacks.html
[gem]: https://rubygems.org/gems/sidekiq-dry
[dry-rb]: https://dry-rb.org/

<style>
.main-header {
  background-size: 32% auto;
}

.highlight {
  line-height: 20px;
}
</style>

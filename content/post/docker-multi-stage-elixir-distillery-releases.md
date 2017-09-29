+++
author = "Dimitris Zorbas"
date = "2017-06-17"
draft = false
title = "Distillery releases with Docker multi-stage builds"
image = "images/posts/dockerdistillery/docker-logo.png"
tags = ["open-source", "deployment", "docker", "elixir", "distillery"]
comments = true
share = true
+++

This post describes the procedure to create lightweight [Docker][docker] images, using multi-stage builds, to deploy
[Elixir][elixir] applications packaged using [Distillery][distillery].

It is assumed that you're familiar with Docker and Elixir.

## Multi-stage builds

Since Docker version [17.05][docker-17.05-changelog] you can have multi-stage builds. With such
builds you can have a single Dockerfile contain multiple `FROM`
instructions, separating multiple stages of a build, where artifacts from
one stage can be used in the next and all resulting in a single image.

### Example Use Case

You have a static site, like [this blog][blog-source], which is build using [Hugo][hugo], and
you want deploy it.

Your build dependencies are:

* hugo
* nodejs (because you also have some fancy JavaScript)
* libsass (because you find vanilla css to be boring)

Your runtime dependencies are:

* nginx (to serve the static html pages and assets)

Before `multi-stage` builds you'd either have a Dockerfile handling both building and serving the files,
or 2 different ones commonly named `Dockerfile.build` and `Dockerfile` and run
the build command twice like:

```shell
docker build -f Dockerfile.build .
```

and

```shell
docker build -f Dockerfile .
```

This process is now simplified with a Dockerfile like the following:

```Dockerfile
FROM node:latest as builder

RUN apt-get -qq update
RUN apt-get -qq install hugo libsass

# Compile assets
RUN npm run build

WORKDIR /app

# Generate static html pages
RUN hugo

FROM debian:jessie-slim

RUN apt-get -qq update
RUN apt-get -qq install nginx
EXPOSE 80

# Notice this instruction
# The generated files under public from the previous build step
# are copied to the path which is served by nginx
COPY --from=builder /app/public /var/www/html

# Start nginx to serve files
CMD ["nginx", "-g", "daemon off"]
```

To be able to use this new feature you have to make sure you have a
version >= 17.05 installed:

* [Download][docker-edge-mac] Docker CE Edge (Mac)
* Read how to [install Docker CE on a Linux Server][docker-edge-linux]

A mininal Dockerfile which contains all the necessary steps to install Docker CE version 17.05 is the following:

```Dockerfile
FROM debian:jessie-slim
MAINTAINER you@areawesome.com

RUN apt-get -qq update

RUN apt-get -qq install software-properties-common python-software-properties \ 
                        apt-transport-https ca-certificates curl gnupg2

# Add docker repository, for docker-ce edge (supports multi-stage builds)
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -
RUN apt-key fingerprint 0EBFCD88
RUN add-apt-repository \
  "deb [arch=amd64] https://download.docker.com/linux/debian \
  $(lsb_release -cs) \
  edge"

RUN apt-get -qq update

# Install the minimum required version of docker for multi-stage builds
RUN apt-get install -qq docker-ce=17.05.0~ce-0~debian-jessie

CMD ["/bin/sh"]
```

> You may find the Dockerfile above handy, if you run a CI allowing you to
> supply your own Docker images, like [GitLab CI][gitlab-ci].

### Benefits

* Packages required to build your release (eg. [nodejs][nodejs]), increase the size of your image
but aren't required during runtime.

* You can install packages for debugging / tracing only to the final
container.

* The final container can be based off a `slim` image.

* Dockerfiles are easier to maintain since it's clearer which package
dependencies are required for the build phase and which are runtime
ones.

## Tutorial

For the example below, for the sake of simplicity, a [Phoenix][phoenix] application without assets
or database models is used. The application is named `goo` and you can
generate it using the `phoenix.new` task below:

```shell
mix phoenix.new goo --no-brunch --no-ecto
```

### About Distillery

Distillery is a deployment tool for Elixir applications, which reduces
your Mix application to a single package, containing all dependencies and
(optionally) the Erlang / Elixir runtime.

### Configuring Distillery

You're suggested to take a moment to have a look at the [distillery documentation][distillery-phoenix] 
about deploying phoenix applications.

### Adding the dependency

The first thing we do, is to declare the `distillery` package dependency
in `mix.exs`.

```elixir
defmodule Goo.Mixfile do
  use Mix.Project

  def project do
    [app: :goo,
     version: "0.0.1",
     elixir: "~> 1.2",
     elixirc_paths: elixirc_paths(Mix.env),
     compilers: [:phoenix, :gettext] ++ Mix.compilers,
     build_embedded: Mix.env == :prod,
     start_permanent: Mix.env == :prod,
     deps: deps()]
  end

  def application do
    [mod: {Goo, []},
     applications: [:phoenix, :phoenix_pubsub, :phoenix_html, :gettext, :cowboy, :logger]]
  end

  defp elixirc_paths(:test), do: ["lib", "web", "test/support"]
  defp elixirc_paths(_),     do: ["lib", "web"]

  defp deps do
    [{:phoenix, "~> 1.2.4"},
     {:phoenix_pubsub, "~> 1.0"},
     {:phoenix_html, "~> 2.6"},
     {:phoenix_live_reload, "~> 1.0", only: :dev},
     {:gettext, "~> 0.11"},
     {:cowboy, "~> 1.0"},
     # Distillery is added here
     {:distillery, "~> 1.4.0"}]
  end
end

```

### Adding Distillery Config

You can generate the default distillery configuration using:

```shell
mix release.init
```

The generated `rel/config.exs` will be like:

```elixir
Path.join(["rel", "plugins", "*.exs"])
|> Path.wildcard()
|> Enum.map(&Code.eval_file(&1))

use Mix.Releases.Config,
    # This sets the default release built by `mix release`
    default_release: :default,
    # This sets the default environment used by `mix release`
    default_environment: Mix.env()

# For a full list of config options for both releases
# and environments, visit https://hexdocs.pm/distillery/configuration.html

environment :dev do
  set dev_mode: true
  set include_erts: false
  set cookie: :"kool-thing"
end

environment :prod do
  set include_erts: true
  set include_src: false
  set cookie: :"song-for-karen"
end

release :goo do
  set version: current_version(:goo)
  set applications: [
    :runtime_tools
  ]
end
```

### Dockerfile

```Dockerfile
FROM elixir:1.3.4-slim as builder

RUN apt-get -qq update
RUN apt-get -qq install git build-essential

RUN mix local.hex --force && \
    mix local.rebar --force && \
    mix hex.info

WORKDIR /app
ENV MIX_ENV prod
ADD . .
RUN mix deps.get
RUN mix release --env=$MIX_ENV

FROM debian:jessie-slim

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get -qq update
RUN apt-get -qq install -y locales

# Set LOCALE to UTF8
RUN echo "en_US.UTF-8 UTF-8" > /etc/locale.gen && \
    locale-gen en_US.UTF-8 && \
    dpkg-reconfigure locales && \
    /usr/sbin/update-locale LANG=en_US.UTF-8
ENV LC_ALL en_US.UTF-8

RUN apt-get -qq install libssl1.0.0 libssl-dev
WORKDIR /app
COPY --from=builder /app/_build/prod/rel/goo .

CMD ["./bin/goo", "foreground"]
```

### Build It

```bash
docker build -t goo:latest .
```

### Run It

```bash
docker run -it goo:latest -name goo
```

### Connect to the running node

```bash
docker exec -it goo /app/bin/goo remote_console
```

### Why Debian Slim

You may have noticed that the base images for the final release image
are based on [Debian][debian].

Debian is the distribution used for most official language base images:

* [Ruby][ruby-dockerfile]
* [Python][python-dockerfile]
* [NodeJS][nodejs-dockerfile]
* [Java][java-dockerfile]
* [Erlang][erlang-dockerfile]

Debian Slim applies some sane defaults to [apt][apt] for Docker, like:

* Keeping gzipped indexes
* Not caching `deb` files under `/var/cache/apt/archives`

  Which means that you don't have to include the instruction below to
  reduce size:

```Dockerfile
RUN rm -rf /var/lib/apt/lists/* && apt-get clean
```

The final image for the above multi-stage Dockerfile is just 213MB, which is slim enough.
If you're in desperate need to further reduce image sizes, you can use
[Alpine Linux][alpine], but then you're giving up the maturity and stability of:

[glibc][glibc] / [GNU coreutils][gnu-coreutils] / [Systemd][systemd]

for..

[musl][musl] / [busybox][busybox] / [OpenRC][openrc]

## Further Steps

* Adding distillery plugins to compile assets
* Running migrations on deployment

Feel free to suggests edits and make comments on the [reddit post][reddit-post].

[elixir]: http://elixir-lang.org/
[docker]: https://www.docker.com/
[distillery]: https://github.com/bitwalker/distillery
[docker-edge-mac]: https://download.docker.com/mac/edge/Docker.dmg
[docker-edge-linux]: https://docs.docker.com/engine/installation/linux/debian/#install-using-the-repository
[multi-stage-doc]: https://docs.docker.com/engine/userguide/eng-image/multistage-build/
[hugo]: https://gohugo.io/
[phoenix]: https://github.com/phoenixframework/phoenix
[nodejs]: https://nodejs.org/en/
[distillery-phoenix]: https://hexdocs.pm/distillery/use-with-phoenix.html
[apt]: https://wiki.debian.org/Apt
[debian]: https://debian.org
[ruby-dockerfile]: https://github.com/docker-library/ruby/blob/c5693b25aa865489fee130e572a3f11bccebd21b/2.1/Dockerfile
[nodejs-dockerfile]: https://github.com/nodejs/docker-node/blob/12ba2e5432cd50037b6c0cf53464b5063b028227/8.1/Dockerfile#L1
[python-dockerfile]: https://github.com/docker-library/python/blob/1ca4a57b20a2f66328e5ef72df866f701c0cd306/2.7/Dockerfile
[java-dockerfile]: https://github.com/docker-library/openjdk/blob/415b0cc42d91ef5d70597d8a24d942967728242b/8-jre/Dockerfile#L7
[erlang-dockerfile]: https://github.com/c0b/docker-erlang-otp/blob/60279df11f4f11abfdce15599d24ad73c1aefbe1/20/Dockerfile#L1
[glibc]: https://en.wikipedia.org/wiki/GNU_C_Library
[gnu-coreutils]: https://en.wikipedia.org/wiki/GNU_Core_Utilities
[systemd]: https://www.freedesktop.org/wiki/Software/systemd/
[musl]: https://www.musl-libc.org/
[busybox]: https://busybox.net/about.html
[openrc]: https://wiki.gentoo.org/wiki/Project:OpenRC
[docker-17.05-changelog]: https://github.com/moby/moby/blob/master/CHANGELOG.md#17050-ce-2017-05-04
[blog-source]: https://github.com/Zorbash/zorbash.github.com
[gitlab-ci]: https://about.gitlab.com/features/gitlab-ci-cd/
[alpine]: https://alpinelinux.org/about/
[reddit-post]: https://www.reddit.com/r/elixir/comments/6ia7se/distillery_releases_with_docker_multistage_builds/

<style>
.main-header {
  background-size: 32% auto;
}
</style>

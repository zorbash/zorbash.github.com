+++
author = "Dimitris Zorbas"
date = "2017-04-22"
draft = false
title = "Deploying Kitto with resin.io"
image = "images/posts/resin/resin_header.png"
tags = ["open-source", "deployment", "IoT", "kitto", "elixir", "raspberry"]
comments = true
share = true
+++


This is a guide to deploy a [Kitto][kitto] dashboard application on a Raspberry Pi
using [resin.io][resin].

After you follow the steps below, you are expected to have a dashboard
running on a raspberry connected to a TV which displays the
dashboard full-screen using firefox.

</br>

<div class="polaroid">
  <img src="/images/posts/resin/tv.jpg" class="img-medium" alt="conveyor">
  <p>Expected end result</p>
</div>

</br>


![kitto-logo](/images/posts/resin/kitto.png)

[Kitto][kitto] is an open-source framework for dashboards, written in [Elixir][elixir].
It is focused on requiring minimal maintenance and system resources.
It can be developed using the widespread grid layout of
[Dashing][dashing] and features jobs like the following:

```elixir
use Kitto.Job.DSL

job :random, every: :second do
  broadcast! :random, %{value: :rand.uniform * 100 |> Float.round}
end
```

![resin-logo](/images/posts/resin/resin_small_logo_cropped.png)

[resin.io][resin] is [Heroku][heroku] for IoT devices.

You flash their OS for you device (preferably using [Etcher][etcher]),
create a Dockerfile for your application and finally run perform the
actual deployment using:

```elixir
git push resin master
```

![resin-workflow](/images/posts/resin/resin_workflow.jpg)

#### Under the Hood

Your device will run the resin OS which is based on the [Yocto Project][yocto].
The OS runs Docker, where a container for your application will live
together will the resin agent, which will take care of application and system updates.

![resin-docker-stack](/images/posts/resin/resin-stack-small.png)

</br>

<div class="polaroid">
  <img src="/images/posts/resin/linux_russian_doll.jpg" class="img-medium" alt="conveyor">
  <p>Linux all the way down :-)</p>
</div>

</br>

## Getting Started

### What you'll need

* 1 × [Raspberry Pi][raspberry-pi]
* 1 × External monitor / TV
* 1 × HDMI cable

#### Install Elixir

You can follow the official instructions at http://elixir-lang.org/install.html
or you can use the official [Kitto Docker image][kitto-docker-image] for local development.

#### Get the Installer

Run the following command:

```
mix archive.install https://github.com/kittoframework/archives/raw/master/kitto_new-0.6.0.ez
```

> Note: Replace 0.6.0 with the latest version found at: https://hex.pm/packages/kitto

#### Generate a Dashboard

You can now use the installer to generate a dashboard using:

```elixir
mix kitto.new dashboard
```

This will create a directory structure containing a sample dashboard.  

The core conventions of Kitto are:

You define `dashboards` in templates located under `./dashboards`.
Each dashboard is available at a its own path. For example
`./dashboards/jobs.html.eex` will be served from `http://localhost:4000/dashboards/jobs`

You define `jobs` in Elixir files located under `./jobs`. Jobs are responsible for fetching and processing data, commonly from external sources.

Finally you define `widgets` (or use any of the [already available ones][kitto-available-widgets]) using [React][react] components.

#### Start your Dashboard Locally

Assuming you have nodejs installed on your system you'll only need to run:

Install dependencies:

```elixir
mix deps.get && npm install
```

Start it:

```elixir
mix kitto.server
```

Assuming you haven't changed the default configuration you should be
able to try your dashboard locally at: http://localhost:4000

### Extending and Customising your Dashboard

You might enjoy reading the following blog posts for developing
dashboards with Kitto:

* [Writing Kitto widgets][blogpost-kitto-widgets]
* [Writing Kitto jobs][blogpost-kitto-jobs]

Extended documentation for Kitto can be found in the [wiki][kitto-wiki] and
its [hexdocs][hexdocs-kitto].

## Deployment

### Create a Resin Account

Head to https://resin.io/ click "Sign Up" and create an account.

![resin-signup](/images/posts/resin/resin_signup.png)

### Create a Resin Application

Click on the "APPLICATIONS" link on the top-left corner and fill in the required info as seen below:

![resin-new-app](/images/posts/resin/resin_new_app.png)

Follow the instructions found here to download the Resin OS for your
device.

![resin-instructions](/images/posts/resin/resin_instructions.png)

> It's important to provide correct information concerning your Wifi
> SSID / Passphrase for the device to be connect automatically to your
> network.

![resin-download-os](/images/posts/resin/resin_download_os.png)


### Boot your Device

Having inserted the sd card with the Resin OS in your Raspberry, connect
it to the TV using the HDMI cable and plug it to power.

</br>

<div class="polaroid">
  <img src="/images/posts/resin/rpi.jpg" class="img-medium" alt="conveyor">
  <p>It's alive!</p>
</div>

</br>

### Create a Resin Dockerfile

When you generate a dashboard via the installer a Dockerfile is created
for you, but you need a different one for resin.

At a glance the differences are that it's based on `zorbash/kitto-kiosk`,
instead of `zorbash/kitto` and has a different entrypoint.

[kitto-kiosk][kitto-kiosk-image] ([source][kitto-kiosk-source]) comes
with the [iceweasel][iceweasel] browser installed, modified to start in kiosk mode
(full-screen, disabled menus and toolbars). It also has all common npm
dependencies pre-installed in `/dashboard/node_modules` to speed up `npm install`.

Copy the following to a file named `entrypoint.sh`

```elixir
#!/bin/bash

elixir --detached --sname kitto@localhost -S mix kitto.server
/bin/kiosk
```

and use the following Dockerfile:

```dockerfile
FROM zorbash/kitto-kiosk:latest

ENV MIX_ENV prod

RUN install -d /dashboard

WORKDIR /dashboard

ADD ./mix.exs ./
ADD ./mix.lock ./

RUN mix deps.get
ADD . /dashboard
ADD ./package.json ./

RUN npm install --silent
RUN npm run build

RUN mix compile

ADD ./entrypoint.sh /bin/entrypoint.sh

CMD ["/bin/entrypoint.sh"]
```

Make sure you use the following `config/prod.exs` for your dashboard app:

```elixir
use Mix.Config

config :kitto, reload_code?: false, watch_assets?: false, serve_assets?: true, ip: {0,0,0,0}
```

### Deploy

Time to make the actual deployment happen!  
Find the git remote for your application at the top right corner of your
resin application page.

You have to initialize a git repository for your dashboard locally
first.  

Inside your the root directory of your dashboard run:

```elixir
git init
```

Copy the command in the image above and finally push.

```elixir
git push resin master
```

> You can also try `git push master:master-arm` to use the native arm
> builders of resin (see: https://forums.resin.io/t/native-arm-builders-beta/171)

![resin-terminal](/images/posts/resin/resin_terminal.png)

After that, resin will pull the image to your device and start a
container off it. In a few minutes you should see the dashboard
running on your TV screen.

## Notable Resin Features

### Changing ENV vars

When you change an env variable in resin the app is automatically restarted and
your changes are reflected immediately.

For example you can change the `DASHBOARD_URL` variable to point to
another dashboard.
Try http://localhost:4000/jobs which is a dashboard which comes with Kitto and displays
internal information about jobs and system resources.

### Public URLs

Resin allows exposing port 80 of your application in a public url of the
format `<RESIN_DEVICE_UUID>.resindevice.io`. Read more about it [here][resin-public-url].

To have the Kitto server start at port 80 you'll have to change your `config/prod.exs` like below:
```elixir
use Mix.Config

config :kitto, port: 80
```

### Resin CLI

Resin comes with a cli application to help you manage your devices and apps.
Have a look: https://docs.resin.io/tools/cli/

## Future Work

* Prevent [iceweasel][iceweasel] checks for updates or use chromium
* Configure screen resolution (`xrandr`) via env variables

[kitto]: https://github.com/kittoframework/kitto/
[resin]: https://resin.io
[elixir]: http://elixir-lang.org/
[resin-how-it-works]: https://resin.io/how-it-works/
[heroku]: https://heroku.com
[etcher]: https://etcher.io/
[blogpost-kitto-widgets]: https://davejlong.com/2016/11/22/writing-widgets-for-kitto/
[blogpost-kitto-jobs]: https://davejlong.com/2016/11/17/writing-jobs-for-kitto/
[kitto-wiki]: https://github.com/kittoframework/kitto/wiki
[hexdocs-kitto]: https://hexdocs.pm/kitto/readme.html
[kitto-gitter]: https://gitter.im/kittoframework/Lobby
[yocto]: https://www.yoctoproject.org/
[kitto-docker-image]: https://hub.docker.com/r/zorbash/kitto/
[kitto-available-widgets]: https://github.com/kittoframework/kitto/wiki/Available-Widgets
[react]: https://facebook.github.io/react/
[raspberry-pi]: https://www.raspberrypi.org/products/raspberry-pi-2-model-b/
[kitto-kiosk-image]: https://hub.docker.com/r/zorbash/kitto-kiosk/
[kitto-kiosk-source]: https://github.com/kittoframework/docker-images/tree/master/kitto-kiosk
[dashing]: https://github.com/Shopify/dashing
[resin-native-arm-builders]: https://forums.resin.io/t/native-arm-builders-beta/171
[resin-public-url]: https://docs.resin.io/introduction/#/pages/management/devices.md#enable-public-device-url
[iceweasel]: https://wiki.debian.org/Iceweasel

<style>
.main-header {
  background-size: 34% auto;
}
</style>

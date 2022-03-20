+++
author = "Dimitris Zorbas"
date = "2022-03-19"
draft = false
title = "A Guide to Secure Elixir Package Updates"
image = "/images/posts/elixir_package_updates/banner.avif"
tags = ["phoenix", "elixir", "hex"]
canonicalUrl = "https://blog.appsignal.com/2022/03/15/a-guide-to-secure-elixir-package-updates.html"
comments = true
share = true
+++

Keeping your dependencies up-to-date is essential to ensure that your applications stay healthy, secure, and performant. Thankfully, the BEAM ecosystem has its own package manager, Hex, which is fast, mature, and simple to use.

This article explores the available tools and commands to manage Hex dependencies and some tips to make the process more enjoyable.

<!--more-->

Let's dive in!

## List Updatable Dependencies in Your Elixir App

You can use the commands below to understand the relationships between dependencies before you attempt to update any of them.

List all your application's dependencies with:

```shell
mix deps --all
```

```shell
* bunt 0.2.0 (Hex package) (mix)
  locked at 0.2.0 (bunt) 7af5c7e0
  ok
* castore 0.1.15 (Hex package) (mix)
  locked at 0.1.15 (castore) c69379b9
  ok
* connection 1.1.0 (Hex package) (mix)
  locked at 1.1.0 (connection) 722c1eb0
  ok
* cowboy 2.9.0 (Hex package) (rebar3)
  locked at 2.9.0 (cowboy) 2c729f93
  ok
* cowboy_telemetry 0.4.0 (Hex package) (rebar3)
  locked at 0.4.0 (cowboy_telemetry) 7d98bac1
  ok
```


Or you can choose to print them in a tree format with:

```shell
mix deps.tree
```

This produces output like the following:

```shell
short
├── credo ~> 1.6 (Hex package)
│   ├── bunt ~> 0.2.0 (Hex package)
│   ├── file_system ~> 0.2.8 (Hex package)
│   └── jason ~> 1.0 (Hex package)
├── ecto_psql_extras ~> 0.6 (Hex package)
│   ├── ecto_sql ~> 3.4 (Hex package)
│   ├── postgrex >= 0.15.7 (Hex package)
│   └── table_rex ~> 3.1.1 (Hex package)
```

To produce an image output, run:


```shell
mix deps.tree --format dot && dot -Tpng deps_tree.dot -o deps_tree.png
```

Note: This option requires **Graphviz**. [Read these Graphviz instructions][graphviz-instructions] to install it on your system.

Then open the created `deps_tree.png` file with a viewer of your choice. Being able to quickly visualize dependencies can help you decide whether a package is worth keeping in your mix.lock. A package could be pulling too many sub-dependencies or might not even be used in your app. Remember, the fewer dependencies, the easier it is to keep things up-to-date.

When you remove a dependency from mix.exs, it will remain in mix.lock. To remove unused dependencies, run:

```shell
mix deps.clean --unlock --unused
```

## Check for Outdated Dependencies with Hex

After making sense of your dependencies tree and performing any necessary cleanups, check for outdated packages with:


```shell
mix hex.outdated --all
```

The output will resemble:


```shell
Dependency              Current  Latest  Status
bunt                    0.2.0    0.2.0   Up-to-date
cowlib                  2.11.0   2.11.0  Up-to-date
credo                   1.6.1    1.6.3   Update possible
db_connection           2.4.1    2.4.1   Up-to-date
decimal                 2.0.0    2.0.0   Up-to-date
earmark_parser          1.4.19   1.4.20  Update possible
postgrex                0.15.13  0.16.2  Update not possible

To view the diffs in each available update, visit:
https://hex.pm/l/AsY7q
```

Note: The `--all` flag shows all outdated packages, including the children of packages defined in mix.exs.

Notice the link in the output above. Hex prepares a nice page for us to inspect the diffs:

![hexdiff](/images/posts/elixir_package_updates/hexdiff.avif)

**Pro-Tip**

Use the `--within-requirements` flag in your CI to notify you of available updates.

```shell
mix hex.outdated --within-requirements 1>/dev/null || echo 'Updates available!'
```

The output of Elixir's package management tasks tends to be concise, well-documented and precisely guides you towards actions.

## Inspecting Changes with Hex

To see changes between two package versions in the terminal, run:

```shell
# This will display the diff for the package opus
mix hex.package diff opus 0.7.0 0.8.1
```

```shell
diff --git a/var/folders/nc/t881hgn/T/opus-0.7.0-9F0FC44B/mix.exs b/var/folders/nc/t881/T/opus-0.8.1-2BEF6AED/mix.exs
index 0aba420..0c1ad3e 100644
--- a/var/folders/nc/t881/T/opus-0.7.0-9F0FC44B/mix.exs
+++ b/var/folders/nc/t881/T/opus-0.8.1-2BEF6AED/mix.exs
@@ -4,7 +4,7 @@ defmodule Opus.Mixfile do
   def project do
     [
       app: :opus,
-      version: "0.7.0",
+      version: "0.8.1",
       elixir: "~> 1.6",
       elixirc_paths: elixirc_paths(Mix.env()),
       build_embedded: Mix.env() == :prod,
@@ -39,7 +39,7 @@ defmodule Opus.Mixfile do
   defp deps do
     [
       {:retry, "~> 0.8"},
-      {:telemetry, "~> 0.4", optional: true},
+      {:telemetry, "~> 0.4 or ~> 1.0", optional: true},
       {:credo, "~> 0.8.10", only: [:dev, :test], runtime: false},
       {:ex_doc, "~> 0.24.2", only: :dev, runtime: false},
       {:dialyxir, "~> 1.0.0-rc.3", only: [:dev, :test], runtime: false},
```

You can view the diff in the browser by navigating to:

`https://diff.hex.pm/diff/<package_name>/<version1>..<version2>`

For example: [https://diff.hex.pm/diff/opus/0.7.0..0.8.1](https://diff.hex.pm/diff/opus/0.7.0..0.8.1)

Hex Diff generates a highlighted git diff which you can view in the browser. You can share the link or even highlight a specific row.

Third-party dependencies are essentially somebody's code downloaded from the internet, which ends up in your application. There is no shortage of examples where packages have been hijacked and malicious versions uploaded.

Ideally, you should inspect the diff of every update. Hex seems to be the only package manager with this built-in feature at the moment.

## Browsing Changelogs

Ultimately, an update might be available, but is it safe to apply it? Are there any code or configuration changes required for the update to work without issues? The diff between two package versions may contain thousands of lines of templates, tests, and docs that might not seem relevant to you.

Furthermore, a package might not even follow [Semver][semver] (semver indicates whether the update is safe in compatibility terms).

Commonly, package maintainers keep a changelog to communicate notable changes and upgrade paths concisely. [Read more about the benefits of keeping a changelog][keepachangelog].

Now the bad news: not all packages have a changelog. So let's go changelog hunting!

The following task will fetch information for the `credo` package:

```shell
mix hex.info credo
```

```shell
A static code analysis tool with a focus on code consistency and teaching.

Config: {:credo, "~> 1.6"}
Locked version: 1.6.3
Releases: 1.6.3, 1.6.2, 1.6.1, 1.6.0, 1.6.0-rc.1, 1.6.0-rc.0, 1.5.6, 1.5.5, ...

Licenses: MIT
Links:
  Changelog: https://github.com/rrrene/credo/blob/master/CHANGELOG.md <--- Here
  GitHub: https://github.com/rrrene/credo
```

As you can see, the maintainer has added a link to the changelog, so that's nice of them.

There is even a link to the changelog in the HexDocs, which some developers may find really handy:

![hexdocs](/images/posts/elixir_package_updates/hexdocs.png)

**Tips:**

* Ensure there's a link to your changelog in `mix.exs`
* Include the changelog in the hexdocs

## Automated Changelog Fetching

Hunting for changelogs can get tedious after a while, especially if you want to update many packages. Thankfully, there is now an experimental package for that.

You can add it in your dependencies with:

```elixir
defp deps do
  [
    {:changelog, "~> 0.1", only: [:dev, :test], runtime: false}
  ]
end
```

Ensure it is fetched:

```shell
mix deps.get
```

Invoke it for all updatable packages:

```shell
mix changelog
```

Or for a number of packages:

```shell
mix changelog tailwind jason

Package: tailwind
Current version: 0.1.4
Latest version:  0.1.5
Hexdiff: https://diff.hex.pm/diff/tailwind/0.1.4..0.1.5

## v0.1.5 (2022-01-18)
  * Prune app.js css import to remove required manual step on first install
```

**Note:** This will only print the version to update to, a link to the diff, and the changelog when there is a more recent version.

I wrote this [open-source task][mix-changelog]. It uses some heuristics to locate the changelog by retrieving the Hex package metadata from the API, falling back to common locations in the repo.

My wish is that Hex will standardize including a link to a changelog in mix.exs and `mix hex.info`, and that Hex Diff will be enhanced to include changelog information.

## Updating Dependencies in Elixir

To update all dependencies, run:

```shell
mix deps.update --all
```

In the output, you will see version updates in the following format:

```shell
Upgraded:
  credo 1.6.1 => 1.6.3
  earmark_parser 1.4.19 => 1.4.20
  ecto_sql 3.7.1 => 3.7.2
  ex_doc 0.27.3 => 0.28.2 (minor)
  makeup 1.0.5 => 1.1.0
  mint 1.4.0 => 1.4.1
  nimble_parsec 1.2.0 => 1.2.2
  nimble_pool 0.2.5 => 0.2.6
  phoenix_live_dashboard 0.6.2 => 0.6.5
  phoenix_live_view 0.17.5 => 0.17.7
  phoenix_view 1.1.0 => 1.1.2
  plug 1.12.1 => 1.13.3
  postgrex 0.15.13 => 0.16.2 (minor)
  tailwind 0.1.4 => 0.1.5
New:
  hpax 0.1.1
```

This is the same as running:

```shell
mix deps.unlock --all && mix deps.get
```

Keep in mind that this task will try to upgrade to versions that match the specifications in your mix.exs.

For example:

```elixir
def deps do
  [
    {:some_package, "~> 0.9"}
  ]
end
```

Even if there is a more recent 1.0 version for `some_package`, it does not match the specification above, and it won't be upgraded. You will have to change your mix.exs and try again.

As we saw in the first section of this article, there is a task you can run to check if an update is possible for a package.


```shell
mix hex.outdated some_package
```

```shell
Dependency              Current  Latest  Status
some_package            0.9.0    1.0.0   Update not possible
```

There might be a conflict in some cases where the package resolution cannot find a version to satisfy the dependencies in mix.exs.

A workaround (that you should use with caution) is `override`.

```elixir
def deps do
  [
    {:some_package, "~> 1.0"},
    {:other_package, "~> 2.0", override: true}
  ]
end
```

In this case, the dependency will override any other definitions by other dependencies.

## Further Reading: Keep Your Package Updates Safe in Elixir

Elixir comes with a whole arsenal of tools to manage dependencies. Try to master them and stir your mix.exs often. Read changelogs and diffs to ensure your updates are safe.

Here are some resources that can help you dive deeper into this topic:

- [HexDocs: mix deps](https://hexdocs.pm/mix/Mix.Tasks.Deps.html)
- [HexDocs: usage](https://hex.pm/docs/usage)
- [HexDocs: mix hex.outdated](https://hexdocs.pm/hex/Mix.Tasks.Hex.Outdated.html)
- [Hex](https://hex.pm/about)
- [Graphviz-install](https://graphviz.org/download/)
- [Keepachangelog](https://keepachangelog.com/en/1.0.0/)
- [Semver](https://semver.org/)
- [Changelog-repo](https://github.com/zorbash/changelog)

Happy coding!

[graphviz-instructions]: https://graphviz.org/download/
[semver]: https://semver.org/
[keepachangelog]: https://keepachangelog.com/en/1.0.0/
[mix-changelog]: https://github.com/zorbash/changelog

+++
author = "Dimitris Zorbas"
date = "2018-09-11"
draft = false
title = "Communication Patterns"
image = "images/posts/effective_comms/kanban_resized.jpg"
tags = ["communication", "management", "startups", "agile"]
comments = true
share = true
+++


This post is about communication patterns in software projects.
For your organisation and its teams to be truly agile and effective you should build a communication system.

## Goals

* Keeping people focused, aligned and effective
* Sharing information in the right places
* Optimising incident response times
* Operational safety


Your organisation is spending vast resources to optimise various parts of the technical
infrastructure to help your developers to work better.
We all spend a fair amount of time communicating and the quality of the deliverable
result of our work is largely affected by the accuracy and completeness of such communication.

![dilbert](/images/posts/effective_comms/dilbert_resized.jpg)

As your organisation grows to employ people from an assortment of cultures and beliefs, having a few guidelines on communication can improve cohesion and relieves the stress of having to guess how a person or team expects to receive information.

I’m keeping notes, trying to build a toolkit as I see that communication is key to the execution of a project regardless of the team’s size.

## Who's this post for?

Should you read this post, or spend your very precious time doing what
makes you feel productive?

Well, building a communication system, sounds like a manager's work, but in reality requires collective effort.

Let's surface a couple of [Andy Grove][grove]'s quotes:

> The output of a manager is the output of the organizational units under his or her supervision or influence.


and


> A team will perform well only if peak performance is elicited from the individuals in it.

I'm arguing that either you are a designer / developer / tech lead or
manager, helping to build such a system is a step to augment the output
of the team.

## Complexity

<br/>

<div class="polaroid">
  <img src="/images/posts/effective_comms/complexity_resized.jpg"
       class="img-medium"
       alt="complexity">
  <p>Photo by gil on Unsplash</p>
</div>

<br/>
<br/>

> Adding developers to a project rises work done linearly,
> but the complexity and communication costs rise at the square
> of the number of developers.
>
> -- Brooks's Law

How to deal with communication complexity? Devise rules according to your organisation’s
needs and get people to follow them.
Do document, using templates and ceremonies which are essential to have an organisation run as a well-oiled machine.

Should you improvise and author your own peculiar rules? Probably not,
there are vast resources online and you can graft whatever you consider applicable.

The most important thing, especially for early stage projects,
is goal-setting. Use a framework like [OKR][okr].

### OKR Definitions

**Objective**

> An OBJECTIVE, is simply WHAT is to be achieved, no more and no less. By definition, objectives are significant, concrete, action oriented, and (ideally) inspirational. When properly designed and deployed, they’re a vaccine against fuzzy thinking—and fuzzy execution.

**Key Results**

> KEY RESULTS benchmark and monitor HOW we get to the objective. Effective KRs are specific and time-bound, aggressive yet realistic. Most of all, they are measurable and verifiable.

For more information about OKR, start by reading [Measure What Matters][whatmatters] from their inventor [John Doerr][john-doerr].
A great example of OKRs out in public, is [Gitlab's][gitlab-okr] ones.

### Communication Media

For software projects, I can identify various types of communication
media to be used by team members. This post covers the following:

1. Project Management Application
2. Realtime Conversation Application
3. Wiki / Documentation

### 1. Pick a Project Management Application

[Jira][jira], [Trello][trello], [Asana][asana], [Phabricator][phabricator], pick one, then make sure people know how to interact with it. I bet you work with very smart people, but for such integral processes you should have a short manual so that they are feel with it.

Common questions you can consider answering:

#### Who creates tickets / tasks / cards and when?

This can be a tech lead, a product owner / project manager, or any team
member as long as their guided and conform to the set conventions.

#### What is the structure of a ticket?

A ticket can have the following format:

**Description**

This section is about determining the goal of this ticket. What problem does it solve?

**Rules**

What are the constraints which must not be violated?

**Technical Details**

This is where all the necessary technical information should be placed. It can be short or very extensive depending on the complexity of the task. You may create subtasks for authoring of design documents based on which the actual implementation will take place.

#### What are the required steps for a ticket to be considered done?

The definition of done is commonly confused with moving a ticket to a column named “done” in a  kanban app. The deliverable of a ticket and the scenarios which have to be satisfied must be clearly mentioned in the ticket. Nobody should pick up and waste time on a ticket which has not been fully specced out. If you anticipate follow up actions or measures, after for example the technical implementation of a ticket has gone live, document them to ensure those actions are taken on time.

#### How long should I wait to get an answer on a ticket comment I left?

This is a tricky one, but I'd say at most a day. It is tricky because we
set it any lower we're risking sacrificing focus by having people to
constantly looking at their inbox.

### 2. Realtime Conversation Application

This can be an application like [Slack][slack], [irc][irc], [rocket
chat][rocket-chat].

Let's focus on what all the cool kids are using these days; Slack.

One thing you should definitely try is to convince people not to use DMs.
You cannot forbid them completely, but they don't scale that well and
it yet another place where office politics might be brewing.

#### When to say something on Slack?

Use it for volatile information or emergencies. One should not feel obliged to
read every message in any of the numerous channels invited.

#### When to use @here and @channel

```
@here notifies members of a channel who are currently active in Slack.
@channel notifies all members of a channel, whether they are active or away.
```

As documented by the Slack [guides][slack-guides], you should use them sparingly.
If people are abusing them, remind them to get them on track.

#### Channels

Name them based on a pattern.

* Prefix channels meant to be joined by developers, with `dev-`, for example `dev-elixir`. This will let people form tech guilds, where they can more easily tap into
the specific technical domain without creating noise in other
channels.
* Prefix team-specific channels with `team-`, for example
  `team-payments`.
* You may have a few channels dedicated for support. Prefix them with
  `support-`, depending the group from which one would want to get
  support from. Define rules on what qualifies as support. A good rule
  of thumb is "if it will take more than 30 minutes or if you can do it yourself then it’s not Support".
* Always set a topic mentioning the scope of the channel and its rules. If for example it's a team-specific page, have a link to a documentation page with info about the team.

#### Emojis

<br/>

<div class="polaroid">
  <img src="/images/posts/effective_comms/disapproval.gif" 
       class="img-medium" 
       alt="disapproval">
  <p>While technically not an Emoji.
    <br/>
    This image is distracting you 😈
  </p>
</div>

<br/>
<br/>

> As silly as it sounds, emojis are surprisingly important in how people communicate. It's very hard for most folks to indicate emotions over text and emojis help support that. They've also been an effective way to communicate better across language barriers.

[source][emojis-hn-comment]

Let’s admit it, emojis are fun. Work can be fun too. Sprinkling emojis all over your messages on slack at work won’t make work fun though. There are ways to enjoy make yourself enjoy work more, or find the right employment to maximize your happiness. That's way beyond the scope of this post though. 🤐

**Do**

```
zorbash> :shipit: We’re releasing the much expected feature of anti-anti-gravity to all our new car models.
```

**Don't**

Avoid using emojis in design documents and release specific documents (release coordination docs, changelogs) or any document which might be read during some firefighting process.

Avoid using them in commit messages. They’re meant to be succinct, unambiguous and above all greppable.

**Really Don't**

https://github.com/atom/atom/blob/master/CONTRIBUTING.md#git-commit-messages


For the love of god, you wouldn’t want someone looking for a memory leak fix to have to search using `:non-potable_water:`.

When in doubt, don't use an emoji.

#### Threads

<br/>

<div class="polaroid">
  <img src="/images/posts/effective_comms/threads_resized.jpg"
       class="img-medium"
       alt="threads">
  <p>Photo by Terri Bleeker on Unsplash</p>
</div>

<br/>
<br/>

This section isn't about concurrency primitives. I'm talking about Slack
threads. They are ideal when you wish to ask a question, or have a quick discussion, keeping it contained. Why would you want to contain it? Because for people not involved it’s noise.

**Do**

```
zorbash> Good people of #support-devops, I just discovered that the X-Strict-Allow-Kittens header is included twice in all our responses. Is there any chance this is intended? (thread)
```

When you start a question thread and it gets a conclusive working answer, if possible edit the head message of the thread with a `[resolved]` tag, so that others know you no longer need they don’t have to react and read it. You may also use an emoji like ✅.

**Don't**

```
zorbash> I think we should implement FEAT-1337 of underwater balloons on Mars using a blockchain, wdyt? (thread)
the_m4rtian> What about planting potatoes instead?
jennyfromtheblockchain> Check out this new crypto, the potatocoin, might me useful.
```

In this case, given that a ticket for `FEAT-1337` already exists, the discussion should take place on the ticket or any design document associated with it. Ideally for a non-trivial feature or product, opt to arrange a design review meeting with the team.


Product development is inherently asynchronous these days, when you take
into account remote people and that it takes big chunks of time. Using a
realtime medium does more harm that good. Don't do product development
by talking on slack threads.

Sometimes it's better to schedule a meeting instead of breaking people's
focus and making them watch a thread. To aid you in such a decision,
consider reading [this previous post][effective-meetings] about effective meetings.

#### Bots

<br/>

<div class="polaroid">
  <img src="/images/posts/effective_comms/robot_resized.jpg"
       class="img-medium"
       alt="robot">
  <p>Photo by Franck V. on Unsplash</p>
</div>

<br/>

Is it OK to add bots to channels? Maybe. Ideally bots should have their own channels, not for them to chat with each other of course 😛. For example you may have channels for #releases and #project-x-ci. Prefer setting up bots to notify the minimum number of relevant people directly instead of sending messages to public threads.


**Do**


Use chatops to help complete otherwise tedious tasks like creating a support ticket for a specific team. Or answering a question for when did the last deployment of some service take place.

**Don't**

Have a bot flood a channel with application exceptions.

#### Sensitive Information

<br/>

<div class="polaroid">
  <img src="/images/posts/effective_comms/lock_resized.jpg" class="img-medium" alt="lock">
  <p>Photo by Micah Williams on Unsplash</p>
</div>

<br/>
<br/>

In my experience I've seen many times secrets being shared in places where they shouldn't. Even seemingly harmless information like `wifi password` or `the door code` can be used at least for social engineering purposes.

Using encryption should be the go-to option sensitive for information and thankfully there are options like keybase making it easy even for non-tech savvy people.

### 3. Wikis / Documentation

* Each code repository should clearly mention its code owners. Which team
/ person should be contacted when there's an incident? How are
incidents meant to be handled?
* For issues where people keep using Slack to get support, consider
  creating playbooks
* Each repository should use pull request templates (see [github][github-pr-templates],
  [gitlab][gitlab-mr-templates])
* What is the outline of the strategy of the organisation / team?
* Have an technical onboarding document per team
* Have a top-level diagram of tech architecture and fundamental business processes
* Document release policies, planning and coordination
* Build or adopt a methodology for secure software development. See:
  [OWASP - S-SDLC][owasp-ssdlc]
* Have a postmortem template. [This one][google-postmortem] from google can serve as an example

Document the structure of the organisation, the teams that there is.
Author a page for each one of them and let the team be responsible to
keep it up-to-date.

#### Team Page

A template for a team page can be the following:

**Remit**

List areas you are responsible for. Services you own. Be specific and add links.

**How We Measure Success**

Define the KPIs (key performance indicators) of the team. Ideally have a dashboard displaying those KPIs and add a link to access it.


**OKRs**

Add a links to any goal-setting application or documents.

**Ceremonies**

* Standup at 10:00
* We work in 2 week long sprints.
* Backlog grooming: 1st monday of the spring
* Sprint planning: X day of the month.
* Team retrospective: Last friday of the sprint
* Team lunch every other friday at 12:00
* We buy a plush toy mascot every 2 months

**People**

List all the members of the team, names, usernames and photos.
Add a link to a calendar with members’ holidays.


**Glossary**

List and explain any common team specific terms which you deem useful for cross-team collaboration and onboarding.

## Reading Resources

* [whatmatters.com][whatmatters]
* [When Coffee and Kale Compete by Alan Klement][coffee-kale]
* [Top Takeways from Andy Grove's "High Output Management"][top-takeaways]
* [A list of postmortems by Dan Luu][danluu-postmortems]

All the reading resources above are also available as a [list][tefter-list] on Tefter.

<style>
.main-header {
/*  background-size: 32% auto; */
}

.highlight {
  line-height: 20px;
}
</style>

[okr]: https://en.wikipedia.org/wiki/OKR
[rawpixel]: https://unsplash.com/@rawpixel
[unsplash]: https://unsplash.com/?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText
[top-takeaways]: https://medium.com/@iantien/top-takeaways-from-andy-grove-s-high-output-management-2e0ecfb1ea63
[grove]: https://en.wikipedia.org/wiki/Andrew_Grove
[whatmatters]: https://www.whatmatters.com/
[john-doerr]: https://en.wikipedia.org/wiki/John_Doerr
[jira]: https://www.atlassian.com/software/jira
[trello]: https://trello.com
[asana]: https://asana.com/ 
[phabricator]: https://www.phacility.com/phabricator/
[tefter-list]: https://www.tefter.io/zorbash/lists/building-products-teams
[slack]: https://slack.com
[rocket-chat]: https://rocket.chat/
[irc]: https://en.wikipedia.org/wiki/Internet_Relay_Chat
[slack-guides]: https://get.slack.help/hc/en-us/articles/202009646-Notify-a-channel-or-workspace
[emojis-hn-comment]: https://news.ycombinator.com/item?id=17523148
[effective-meetings]: {{< relref "post/effective-meetings.md" >}}
[gitlab-okr]: https://about.gitlab.com/okrs/
[github-pr-templates]: https://blog.github.com/2016-02-17-issue-and-pull-request-templates/
[gitlab-mr-templates]: https://docs.gitlab.com/ce/user/project/description_templates.html
[coffee-kale]: https://www.goodreads.com/book/show/39913835-when-coffee-and-kale-compete
[google-postmortem]: https://landing.google.com/sre/book/chapters/postmortem.html
[danluu-postmortems]: https://github.com/danluu/post-mortems
[owasp-ssdlc]: https://www.owasp.org/index.php/OWASP_Secure_Software_Development_Lifecycle_Project

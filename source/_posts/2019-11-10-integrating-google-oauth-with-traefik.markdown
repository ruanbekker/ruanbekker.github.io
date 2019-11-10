---
layout: post
title: "Integrating Google OAuth with Traefik"
date: 2019-11-10 20:03:06 +0200
comments: true
categories: ["traefik", "google", "authentication"] 
---

[![Say Thanks!](https://img.shields.io/badge/Say%20Thanks-!-1EAEDB.svg)](https://saythanks.io/to/ruanbekker) [![Slack Status](https://linux-hackers-slack.herokuapp.com/badge.svg)](https://linux-hackers-slack.herokuapp.com/) [![Chat on Slack](https://img.shields.io/badge/chat-on_slack-orange.svg)](https://linux-hackers.slack.com/) [![GitHub followers](https://img.shields.io/github/followers/ruanbekker.svg?label=Follow&style=social)](https://github.com/ruanbekker)

<a href="https://twitter.com/ruanbekker?ref_src=twsrc%5Etfw" class="twitter-follow-button" data-show-count="false">Follow @ruanbekker</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

I stumbled upon a really cool [project: Traefik Forward Auth](https://github.com/thomseddon/traefik-forward-auth) that provides Google OAuth based Login and Authentication for [Traefik](https://traefik.io/)

This means that you can secure your Traefik backend services by using Google for authentication to access your backends. Authorizing who can logon, get's managed on the forward proxy.

If you have not worked with Traefik, Traefik is one amazing dynamic and modern reverse proxy / load balancer built for micro services.

## What are we doing today

In this demonstration we will setup a new google application, setup the forward-auth proxy and spin up a service that we will use google to authenticate against to access our application on Docker Swarm.

Step by step tutorial has been published on my sysadmins blog, **[read more here](https://sysadmins.co.za/integrating-google-oauth-with-traefik/?referral=blog.ruanbekker.com)**

## Thank You

Let me know what you think. If you liked my content, feel free to checkout my content on **[ruan.dev](https://ruan.dev/)** or follow me on twitter at **[@ruanbekker](https://twitter.com/ruanbekker)**

<center><script type='text/javascript' src='https://ko-fi.com/widgets/widget_2.js'></script><script type='text/javascript'>kofiwidget2.init('Buy Me a Coffee', '#46b798', 'A6423ZIQ');kofiwidget2.draw();</script></center>


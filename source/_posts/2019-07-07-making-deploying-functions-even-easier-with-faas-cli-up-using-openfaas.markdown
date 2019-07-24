---
layout: post
title: "Making deploying functions even easier with faas-cli up using OpenFaaS"
date: 2019-07-07 03:53:59 -0400
comments: true
categories: ["openfaas", "python", "serverless"] 
---

![](https://camo.githubusercontent.com/cf01eefb5b6905f3774376d6d1ed55b8f052d211/68747470733a2f2f626c6f672e616c6578656c6c69732e696f2f636f6e74656e742f696d616765732f323031372f30382f666161735f736964652e706e67)

[![Say Thanks!](https://img.shields.io/badge/Say%20Thanks-!-1EAEDB.svg)](https://saythanks.io/to/ruanbekker) [![Slack Status](https://linux-hackers-slack.herokuapp.com/badge.svg)](https://linux-hackers-slack.herokuapp.com/) [![Chat on Slack](https://img.shields.io/badge/chat-on_slack-orange.svg)](https://linux-hackers.slack.com/) ![GitHub followers](https://img.shields.io/github/followers/ruanbekker.svg?label=Follow&style=social) ![Twitter Follow](https://img.shields.io/twitter/follow/ruanbekker.svg?style=social)

nan I recently discovered that the `faas-cli` allows you to append your function's yaml to an existing file when generating a new function. And that `faas-cli up` does the build, push and deploy for you.

## The way I always did it:

Usually, I will go through this flow: create, build, push, deploy, when creating 2 functions that will be in the same stack:

```
$ faas-cli new --lang python3 fn-old-foo \
--prefix=ruanbekker \
--gateway https://openfaas.domain.com

$ faas-cli build -f fn-old-foo.yml && \
faas-cli push -f fn-old-foo.yml && \
faas-cli deploy -f fn-old-foo.yml
```

And for my other function:

```
$ faas-cli new --lang python3 fn-old-bar \
--prefix=ruanbekker \
--gateway https://openfaas.domain.com

$ faas-cli build -f fn-old-bar.yml && \
faas-cli push -f fn-old-bar.yml && \
faas-cli deploy -f fn-old-bar.yml
```

And then you are ready to invoke those functions.

## The new discovered way

So recently I discovered that you can append the yaml definition of your function to an existing yaml file, and use `faas-cli up` to build, push and deploy your functions:

Generating the first function:

```
$ faas-cli new --lang python3 fn-foo \
--prefix=ruanbekker \
--gateway https://openfaas.domain.com

Stack file written: fn-foo.yml
```

Now that we have `fn-foo.yml` in our current work directory, we will append the second function the that file:

```
$ faas-cli new --lang python3 fn-bar \
--prefix=ruanbekker \
--gateway https://openfaas.domain.com \
--append fn-foo.yml

Stack file updated: fn-foo.yml
```

Now, when using `faas-cli up` it expects by default that the filename is `stack.yml` which we can change with `-f` but to keep this as easy as possible, we will change the filename to `stack.yml`:

```
$ mv fn-foo.yml stack.yml
```

At the moment, our `stack.yml` will look like this:

```
$ cat stack.yml
provider:
  name: openfaas
  gateway: https://openfaas.domain.com
functions:
  fn-foo:
    lang: python3
    handler: ./fn-foo
    image: ruanbekker/fn-foo:latest
  fn-bar:
    lang: python3
    handler: ./fn-bar
    image: ruanbekker/fn-bar:latest
```

Deploying our functions is as easy as:

```
$ faas-cli up
...
Deploying: fn-foo.

Deployed. 202 Accepted.
URL: https://openfaas.domain.com/function/fn-foo

Deploying: fn-bar.

Deployed. 202 Accepted.
URL: https://openfaas.domain.com/function/fn-bar
```

Simply amazing. OpenFaaS done a great job in making it as simple and easy as possible to get your functions from zero to deployed in seconds.


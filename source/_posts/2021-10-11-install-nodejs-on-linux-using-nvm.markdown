---
layout: post
title: "Install Nodejs on Linux using NVM"
date: 2021-10-11 19:07:43 -0400
comments: true
categories: ["nodejs", "nvm", "linux", "javascript"]
---

In this post we will install Nodejs using Node Version Manager (nvm), which allows you to install and use different versions of node via the command line.

For more information on NVM, checkout their [github repository](https://github.com/nvm-sh/nvm)

## Install

I will be using a debian based linux distribution, so I first will be updating my package manager's indexes:

```bash
$ apt update
```

Then I will install NVM using the instructions from [their](https://github.com/nvm-sh/nvm#installing-and-updating) repository (always ensure that you are aware what you are installing when you curl, pipe, bash):

```bash
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

## Verify

You can now log out and log back in for your path to be updated, or you can follow the instructions on your terminal to source your session so that your path to nvm is updated:

```bash
$ export NVM_DIR="$HOME/.nvm"
$ [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
$ [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
$ [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

Then you can verify if `nvm` is in your path:

```bash
$ command -v nvm
nvm
```

## Installing a Node Version

Before we install a specific version of nodejs, let's first look at the LTS versions from the Fermium release:

```bash
$ nvm ls-remote --lts=fermium
       v14.15.0   (LTS: Fermium)
       v14.15.1   (LTS: Fermium)
       v14.15.2   (LTS: Fermium)
       v14.15.3   (LTS: Fermium)
       v14.15.4   (LTS: Fermium)
       v14.15.5   (LTS: Fermium)
       v14.16.0   (LTS: Fermium)
       v14.16.1   (LTS: Fermium)
       v14.17.0   (LTS: Fermium)
       v14.17.1   (LTS: Fermium)
       v14.17.2   (LTS: Fermium)
       v14.17.3   (LTS: Fermium)
       v14.17.4   (LTS: Fermium)
       v14.17.5   (LTS: Fermium)
       v14.17.6   (LTS: Fermium)
       v14.18.0   (Latest LTS: Fermium)
```

So I want to install `v14.8.0`:

```bash
$ nvm install 14.8.0
```

I also would like to make it my default version of node:

```bash
$ nvm alias default node
default -> node (-> v14.8.0)
```

## Verify Installation

Now we can verify if `npm` is installed:

```bash
$ npm -v
6.14.7
```

as well as `node`:

```bash
$ node -v
v14.8.0
```

## Thank You

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.

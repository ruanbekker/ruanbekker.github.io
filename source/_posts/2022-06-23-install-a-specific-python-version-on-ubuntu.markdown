---
layout: post
title: "Install a specific Python version on Ubuntu"
description: "This tutorial will demonstrate how to install a specific version of Python on Ubuntu Linux."
date: 2022-06-23 17:53:46 -0400
comments: true
categories: ["linux", "python", "ubuntu"]
---

![install-specific-python-version](https://blog.ruanbekker.com/images/ruanbekker-install-specific-python-version.png)

In this short tutorial, I will demonstrate how to install a spcific version of Python on Ubuntu Linux.

[![](https://img.shields.io/badge/website-ruan.dev-red.svg)](https://ruan.dev) [![](https://img.shields.io/badge/twitter-@ruanbekker-00acee.svg)](https://twitter.com/ruanbekker) [![](https://img.shields.io/badge/github-cheatsheets-orange.svg)](https://github.com/ruanbekker) [![Say Thanks!](https://img.shields.io/badge/dm-saythanks.io-07B63F.svg)](https://saythanks.io/to/ruanbekker)  [![Ko-fi](https://img.shields.io/badge/-Buy%20Me%20a%20Coffee-ff5f5f?logo=ko-fi&logoColor=white)](https://ko-fi.com/ruanbekker)

## Dependencies

Update the apt repositories:

```bash
$ sudo apt update
```

Then install the required dependencies:

```bash
$ sudo apt install libssl-dev openssl wget build-essential zlib1g-dev -y
```

## Python Versions

Head over to the [Python Downloads](https://www.python.org/downloads/) section and select the version of your choice, in my case I will be using Python 3.8.13, once you have the download link, download it:

```bash
$ wget https://www.python.org/ftp/python/3.8.13/Python-3.8.13.tgz
```

Then extract the tarball:

```bash
$ tar -xvf Python-3.8.13.tgz
```

Once it completes, change to the directory:

```bash
$ cd Python-3.8.13
```

## Installation

Compile and add `--enable-optimizations` flag as an argument:

```bash
$ ./configure --enable-optimizations
```

Run make and make install:

```bash
$ make 
$ sudo make install 
```

Once it completes, you can symlink the python binary so that it's detected by your `PATH`, if you have no installed python versions or want to use it as the default, you can force overwriting the symlink:

```bash
$ sudo ln -fs /usr/local/bin/python3 /usr/bin/python3
```

Then we can test it by running:

```bash
$ python3 --version
Python 3.8.13
```

## Thank You

Thanks for reading, feel free to check out my [website](https://ruan.dev/), feel free to subscribe to my [newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog) or follow me at [@ruanbekker](https://twitter.com/ruanbekker) on Twitter.



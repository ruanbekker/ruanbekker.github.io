---
layout: post
title: "Setup a Golang Environment on Ubuntu"
date: 2018-11-22 17:09:29 -0500
comments: true
categories: ["golang", "golang-tutorial", "dev-setup", "ubuntu"] 
---

In this post I will demonstrate how to setup a golang environment on Ubuntu.

## Get the sources:

Get the latest stable release golang tarball from https://golang.org/dl/ and download to the directory path of choice, and extract the archive:

```bash
$ cd /tmp
$ wget https://dl.google.com/go/go1.11.2.linux-amd64.tar.gz
$ tar -xf go1.11.2.linux-amd64.tar.gz
```

Once the archive is extracted, set root permissions and move it to the path where your other executable binaries reside:

```bash
$ sudo chown -R root:root ./go
$ sudo mv go /usr/local/
```

Cleanup the downloaded archive:

```bash
$ rm -rf go1.*.tar.gz
```

## Path Variables:

Adjust your path variables in your `~/.profile` and append the following:

```bash ~/.profile
export GOPATH=$HOME/go
export PATH=$PATH:/usr/local/go/bin:$GOPATH/bin
```

Source your profile, or open a new tab:

```bash
$ source ~/.profile
```

Test if you can return the version:

```bash
$ go version
go version go1.11.2 linux/amd64
```

## Create a Golang Application

Create a simple golang app that prints a string to stdout:

```bash
$ cd ~/
$ mkdir -p go/src/hello
$ cd go/src/hello
$ vim app.go
```

Add the following golang code:

```go
package main

import "fmt"

func main() {
    fmt.Printf("Hello!\n")
}
```

Build the binary:

```bash
$ go build
```

Run it:

```bash
$ ./app
Hello!
```

---
layout: post
title: "Your First Hello World App with Golang"
date: 2017-10-25 17:16:25 -0400
comments: true
categories: ["golang", "hello-world", "programming", "golang-tutorial"] 
---

So everyone has been saying how awesome Golang is, and at this moment, I am quite curious to fiddle with it.

## Golang Environment: Golang Docker Image

A quick way to get a Golang Environment, will be to use Docker. We will be using the Alpine tag:

```bash
$ docker run -it golang:alpine sh
```

## Our Basic App

After we are in our container, lets write our first Hello World App:

```go app.go
package main

import "fmt"

func main() {
  fmt.Println("Hello, World!")
}
```

## Running our App:

Using golang to run our app:

```bash
$ go run app.go
Hello, World!
```

We can also build our app to create a executable binary:

```bash
$ go build app.go
```

You will find that there is a executable binary named `app` placed in the current working directory. Let's execute it:

```bash
$ ./app
Hello, World!
```

This was a very basic example, but will add more examples as I am learning the language

## Resources:

- https://golang.org/



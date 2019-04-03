---
layout: post
title: "Build Small Golang Docker Containers"
description: "building small golang docker images for having small golang docker containers"
date: 2019-04-03 08:24:08 -0400
comments: true
categories: ["docker", "golang", "alpine", "containers"]
---

![](https://user-images.githubusercontent.com/567298/55478306-aabb0600-561b-11e9-9cc6-730fadb4beeb.png)

In this tutorial I will show you how to build really small docker containers for golang applications. And I mean the difference between 310MB down to 2MB

## But Alpine..

So we thinking lets go with alpine right? Yeah sure lets build a small, app running on go with alpine.

Our application code:

```golang app.go
package main

import (
  "fmt"
  "math/rand"
  "time"
)

func main() {
  lekkewords := []string{
    "dog", "cat", "fish", "giraffe",
    "moo", "spider", "lion", "apple",
    "tree", "moon", "snake", "mountain lion",
    "trooper", "burger", "nasa", "yes",
  }

  rand.Seed(time.Now().UnixNano())
  var zelength int = len(lekkewords)
  var indexnum int = rand.Intn(zelength-1)
  word := lekkewords[indexnum]

  fmt.Println("Number of words:", zelength)
  fmt.Println("Selected index number:", indexnum)
  fmt.Println("Selected word is:", word)
}
```

Our Dockerfile:

```docker Dockerfile
FROM golang:alpine

WORKDIR $GOPATH/src/mylekkepackage/mylekkeapp/
COPY app.go .
RUN go build -o /go/app

CMD ["/go/app"]
```

Let's package our app to an image:

```
❯ docker build -t mygolangapp:using-alpine .
```

Inspect the size of our image, as you can see it being **310MB**

```
❯ docker images "mygolangapp:*"
REPOSITORY          TAG                 IMAGE ID            CREATED              SIZE
mygolangapp         using-alpine        eea1d7bde218        About a minute ago   310MB
```

Just make sure it actually works:

```
❯ docker run mygolangapp:using-alpine
Number of words: 16
Selected index number: 11
Selected word is: mountain lion
```

But for something just returning random selected text, 310MB is a bit crazy.

## Multi Stage Builds

As Go binaries are self-contained, we can make use of docker's multi stage builds, where we can build our application on alpine and use the binary on a scratch image:

Our multi stage Dockerfile:

```docker Dockerfile.mult
FROM golang:alpine AS builder

WORKDIR $GOPATH/src/mylekkepackage/mylekkeapp/
COPY app.go .
RUN go build -o /go/app

FROM scratch

COPY --from=builder /go/app /go/app

CMD ["/go/app"]
```

Build it:

```
❯ docker build -t mygolangapp:using-multistage -f Dockerfile.multi .
```

Notice that the image is only **2.01MB**, say w000t!

```
❯ docker images "mygolangapp:*"
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
mygolangapp         using-multistage    31474c61ba5b        15 seconds ago      2.01MB
mygolangapp         using-alpine        eea1d7bde218        2 minutes ago       310MB
```

Run the app:

```
❯ docker run mygolangapp:using-multistage
Number of words: 16
Selected index number: 5
Selected word is: spider
```

## Resources

Source code for this demonstration can be found at [github.com/ruanbekker/golang-build-small-images](https://github.com/ruanbekker/golang-build-small-images)

![](https://user-images.githubusercontent.com/567298/55478904-236e9200-561d-11e9-9382-f31b25a9ae03.png)

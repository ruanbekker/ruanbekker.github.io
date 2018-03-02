---
layout: post
title: "Golang: Reading from Files and Writing to Disk with Golang"
date: 2018-03-02 06:44:59 -0500
comments: true
categories: ["golang", "programming", "golang-tutorial"] 
---

![](![](https://i.snag.gy/VJmUZz.jpg))

Today we will create a very basic application to read content from a file, and write the content from the file back to disk, but to another filename. 

Basically, doing a copy of the file to another filename.

## Golang Environment: Golang Docker Image

Dropping into a Golang Environment using Docker:

```bash
$ docker run -it golang:alpine sh
```

## Our Golang Application

After we are in our container, lets write our app:

```go app.go
package main

import (
    "io/ioutil"
)

func main() {

    content, error := ioutil.ReadFile("source-data.txt")
    if error != nil {
        panic(error)
    }

    error = ioutil.WriteFile("destination-data.txt", content, 0644)
    if error != nil {
        panic(error)
    }
}
```

Building our application to a binary:

```bash
$ go build app.go
```

Creating our `source-data.txt` :

```bash
$ echo "foo" > source-data.txt
```

## Running the Golang App:

When we run this app, it will read the content of `source-data.txt` and write it to `destination-data.txt`:

```bash
$ ./app.go
```

We can see that the file has been written to disk:

```bash
$ ls | grep data
destination-data.txt
source-data.txt
```

Making sure the data is the same, we can do a `md5sum hash` function on them:

```bash
$ md5sum source-data.txt
d3b07384d113edec49eaa6238ad5ff00  source-data.txt

$ md5sum destination-data.txt
d3b07384d113edec49eaa6238ad5ff00  destination-data.txt
```

## Next:

This was a very static way of doing it, as you need to hardcode the filenames. In the [next post](https://goo.gl/t8fasN) I will show how to use arguments to make it more dynamic.

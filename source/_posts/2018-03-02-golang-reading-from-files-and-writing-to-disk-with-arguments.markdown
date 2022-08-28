---
layout: post
title: "Golang: Reading from Files and Writing to Disk with Arguments"
date: 2018-03-02 07:11:13 -0500
comments: true
categories: ["golang", "golang-tutorial", "programming"]
---

![](https://i.snag.gy/VJmUZz.jpg)

From our [Previous Post](https://goo.gl/ih43uv) we wrote a basic golang app that reads the contents of a file and writes it back to disk, but in a static way as we defined the source and destination filenames in the code.

Today we will use arguments to specify what the source and destination filenames should be instead of hardcoding it.

## Our Golang Application:

We will be using if statements to determine if the number of arguments provided is as expected, if not, then a usage string should be returned to stdout. Then we will loop through the list of arguments to determine what the values for our source and destination file should be.

Once it completes, it prints out the coice of filenames that was used:

```go app.go
package main

import (
    "io/ioutil"
    "os"
    "fmt"
)

var (
    input_filename string
    output_filename string
)

func main() {

    if len(os.Args) < 5 {
        fmt.Printf("Usage: (-i/--input) 'input_filename' (-o/--output) 'output_filename' \n")
        os.Exit(0)
    }

    for i, arg := range os.Args {
        if arg == "-i" || arg == "--input" {
            input_filename = os.Args[i+1]
            }
        if arg == "-o" || arg == "--output" {
            output_filename = os.Args[i+1]
            }
        }

    input_file_content, error := ioutil.ReadFile(input_filename)

    if error != nil {
        panic(error)
    }

    fmt.Println("File used for reading:", input_filename)

    ioutil.WriteFile(output_filename, input_file_content, 0644)
    fmt.Println("File used for writing:", output_filename)
}
```

Build your application:

```bash
$ go build app.go
```

Run your application with no additional arguments to determine the expected behaviour:

```bash
$ ./app
Usage: (-i/--input) 'input_filename' (-o/--output) 'output_file-to-write'
```

It works as expected, now create a source file, then run the application: 

```bash
$ echo $RANDOM > myfile.txt
```

Run the application, and in this run, we will set the destination file as newfile.txt:

```bash
$ ./app -i myfile.txt -o newfile.txt
File used for reading: myfile.txt
File used for writing: newfile.txt
```

Checking out the new file:

```
$ cat newfile.txt
8568
```


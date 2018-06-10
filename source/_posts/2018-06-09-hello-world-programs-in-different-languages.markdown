---
layout: post
title: "Hello World Programs in Different Languages"
date: 2018-06-09 21:11:00 -0400
comments: true
categories: ["python", "golang", "java", "ruby", "c++"] 
---

This post will demonstrate running hello world programs in different languages and also providing return time statistics


## C++

Code

```c
#include <iostream>
using namespace std;

int main()
{
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
```

Compile:

```bash
$ c++ hello_cpp.cpp -o hello_cpp
```

Run:

```bash
$ time ./hello_cpp
Hello, World!

real	0m0.005s
user	0m0.001s
sys	  0m0.001s
```

## Golang:

Code

```golang
package main

import "fmt"

func main() {
  fmt.Println("Hello, World!")
}
```

Compile:

```bash
$ go build hello_golang.go
```

Run:

```bash
time ./hello_golang
Hello, World!

real	0m0.006s
user	0m0.001s
sys	  0m0.003s
```

## Python

Code:

```python
#!/usr/bin/env python
print("Hello, World!")
```

Make it executable:

```bash
$ chmod +x ./hello_python.py
```

Run:

```bash
$ time ./hello_python.py
Hello, World!

real	0m0.033s
user	0m0.015s
sys	  0m0.010s
```

## Ruby

Code:

```ruby
#!/usr/bin/env ruby
puts "Hello, World!"
```

Make it executable:

```bash
$ chmod +x ./hello_ruby.rb
```

Run:

```bash
$ time ./hello_ruby.rb
Hello, World!

real	0m0.136s
user	0m0.080s
sys	  0m0.024s
```

## Java

Code:

```java
public class hello_java {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

Compile:

```bash
$ javac hello_java.java
```

Run:

```bash
$ time java hello_java
Hello, World!

real	0m0.114s
user	0m0.086s
sys	  0m0.023s
```

## Resource:

- https://www.lifewire.com/command-return-time-command-4054237

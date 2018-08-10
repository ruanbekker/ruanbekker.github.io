---
layout: post
title: "Ruby Tutorial Series Setup and Variables"
date: 2018-08-09 21:11:52 -0400
comments: true
categories: ["ruby", "programming", "ruby-tutorial-series"] 
---

![](https://objects.ruanbekker.com/assets/images/ruby-variables-logo.png)

In this post we will setup our Ruby environment, then start printing out values to the console and will also be touching on variables.

## Ruby Environment:

I have a Docker image built on Alpine, the resources can be found via:

- [DockerHub](https://hub.docker.com/r/rbekker87/alpine-ruby)
- [GitHub](https://github.com/ruanbekker/dockerhub-sources/blob/master/alpine-ruby/Dockerfile)

To setup a Ruby environment on your workstation, I would recommend using [https://github.com/rbenv/rbenv](https://github.com/rbenv/rbenv).

## Drop into a Ruby Shell:

I will be using Docker to drop into a ruby container:

```bash
$ docker run -it rbekker87/alpine-ruby:2.5 sh

       ______       _____
______ ___  /__________(_)___________
_  __ `/_  /___  __ \_  /__  __ \  _ \
/ /_/ /_  / __  /_/ /  / _  / / /  __/
\__,_/ /_/  _  .___//_/  /_/ /_/\___/
            /_/

Alpine Build:
Container Hostname: 8a4dfc590dd0
Checkout my Docker Blogs:
- https://sysadmins.co.za/tag/docker
- http://blog.ruanbekker.com/blog/categories/docker

$ irb
irb(main):001:0>
```

If you have the `irb` output, you should be good to go.

## Strings and Integers

You will find when you enter a string, which is represented as one or more characters enclosed within quotation marks:

```bash
irb(main):001:0> "hello"
=> "hello"
```

The integers will be without the quotation marks, when we introduce anything within quotation marks, ruby will read it as a string. So for a integer, lets provide ruby with a number and the number will be returned to the shell:

```bash
irb(main):002:0> 1
=> 1
```

Using mathematical symbols like the `+` will either sum the two values when they are integers, or concatenate when they are strings. 

Let's start with strings: we will add the string `hello` and `world`

```bash
irb(main):003:0> "hello" + "world"
=> "helloworld"
```

Now let's add two numbers together, `10` and `20`:

```bash
irb(main):004:0> 10 + 20
=> 30
```

As you can see, it did a calculation on the two numbers as they were treated as integeres. But what happens when we add them as strings?

```bash
irb(main):005:0> "10" + "20"
=> "1020"
```

Adding them as strings, will concatenate them.

## String Methods

Ruby's strings has many built in methods, which makes it convenient manipulating data, let me go through a couple that I am working with:

Getting the length of the string:

```bash
irb(main):006:0> "hello".length
5
```

Is the string empty?

```bash
irb(main):007:0> "hello".empty?
=> false
```

Getting the index position of 0 of the string:

```bash
irb(main):008:0> "hello"[0]
=> "h"
```

Getting a array of your string:

```bash
irb(main):009:0> "hello".chars
=> ["h", "e", "l", "l", "o"]
```

Returning your string in Uppercase:

```bash
irb(main):010:0> "hello".upcase
=> "HELLO"
```

Returning your string in Lowercase:

```bash
irb(main):011:0> "HELLO".downcase
=> "hello"
```

Capitalize your String:

```bash
irb(main):012:0> "hello".capitalize
=> "Hello"
```

Swap the case of your string:

```bash
irb(main):013:0> "Hello".swapcase
=> "hELLO"
```

## Variables

Let's define variables to the static content that we used above. 

Let's define our key: `word` to the value: of `hello, world`:

```bash
irb(main):019:0> word = "hello, world"
=> "hello, world"
```

Accessing the variables value:

```bash
irb(main):020:0> word
=> "hello, world"
```

We can also use `puts`, which stands for `put string`, which prints out the value to the terminal:

```bash
irb(main):021:0> puts word
hello, world
```

We can also, format our variable so that we can add something like a exclamation mark:

```bash
irb(main):022:0> puts "#{word}!"
hello, world!
```

Let's do the same with integers:

```bash
irb(main):023:0> num_1 = 10
=> 10
irb(main):024:0> num_2 = 20
=> 20
```

Now when we calculate the numbers using variables, you will find the expected result of 30:


```bash
irb(main):025:0> num_1 + num_2
=> 30
```

or:

```bash
irb(main):026:0> num_1 + num_2
puts "#{num_1 + num_2}"
30
```

## Variables are Mutable:

Remember that variables are mutable, so they can be changed after they have been set, lets take age for example:

```bash
irb(main):027:0> age = 20
irb(main):028:0> puts age
20

irb(main):029:0> age = 22
irb(main):030:0> puts age
22
```

## Strings and Integers:

What happens when we add strings and integers together in one line:

```bash
irb(main):038:0> name = "ruan"
=> "ruan"
irb(main):039:0> id = 120398
=> 120398
irb(main):040:0> puts "#{name + id}"
Traceback (most recent call last):
        3: from /usr/bin/irb:11:in `<main>'
        2: from (irb):40
        1: from (irb):40:in `+'
TypeError (no implicit conversion of Integer into String)
```

That is because we cant concatenate strings with integers, so we will need to convert the integer to a string, we do that with the `to_s` method:

```bash
irb(main):041:0> puts "#{name + id.to_s}"
ruan120398
```

And if we want to define that to a variable:

```bash
irb(main):042:0> userid = "#{name + id.to_s}"
irb(main):043:0> userid
=> "ruan120398"
```

## Working with rb files:

We can add this together in a file with a `.rb` extension and call the file as an argument with ruby, as a script:

Create the file, in my case `test.rb`

```bash
$ vim test.rb
```
```ruby
user = "ruan"
idnumber = 23049823
userid = "#{user + idnumber}"

puts "#{userid}"
```

Running the ruby file:

```bash
$ ruby test.rb
ruan23049823
```

## Resources:

- [1](https://www.digitalocean.com/community/tutorials/how-to-work-with-string-methods-in-ruby)
- [2](https://learnrubythehardway.org/book/ex3.html)

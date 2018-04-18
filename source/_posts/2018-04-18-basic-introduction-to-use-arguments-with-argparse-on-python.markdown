---
layout: post
title: "Basic Introduction to use arguments with Argparse on Python"
date: 2018-04-18 13:35:28 -0400
comments: true
categories: ["python", "argparse", "arguments"]
---

I used to work a lot with `sys.argv` for using arguments in my applications, until I stumbled upon the `argparse` module! (Thanks Donovan!)

What I like about argparse, is that it builds up the help menu for you, and you also have a lot of options, as you can set the argument to be required, set the datatypes, addtional help context etc.

## The Basic Demonstration:

Today we will just run through a very basic example on how to use `argparse`:

- Return the generated help menu
- Return the required value
- Return the additional arguments
- Compare arguments with a IF statement

## The Python Argparse Tutorial Code:

```python
import argparse

parser = argparse.ArgumentParser(description='argparse demo')
parser.add_argument('-w', '--word', help='a word (required)', required=True)
parser.add_argument('-s', '--sentence', help='a sentence (not required)', required=False)
parser.add_argument('-c', '--comparison', help='a word to compare (not required)', required=False)
args = parser.parse_args()

print("Word: {}".format(args.word))

if args.sentence:
	print("Sentence: :{}".format(args.sentence))

if args.comparison:
	if args.comparison == args.word:
		print("Comparison: the provided word argument and provided comparison argument is the same")
	else:
		print("Comparison: the provided word argument and provided comparison argument is NOT the same")
```


## Seeing it in action:

To return a usage/help info, run it with the `-h` or `--help` argument:

```bash
$ python foo.py -h
usage: foo.py [-h] -w WORD [-s SENTENCE] [-c COMPARISON]

argparse demo

optional arguments:
  -h, --help            show this help message and exit
  -w WORD, --word WORD  a word (required)
  -s SENTENCE, --sentence SENTENCE
                        a sentence (not required)
  -c COMPARISON, --comparison COMPARISON
                        a word to compare (not required)
```

For this to work, the application is expecting the `word` argument to run, as we declared it as `required=True`:

```bash
$ python foo.py -w hello
Word: hello
```

Now to use the arguments that is not required, which makes it optional:

```bash
$ python foo.py -w hello -s "hello, world"
Word: hello
Sentence: :hello, world
```

We can also implement some if statements into our application to compare if arguments are the same (as a basic example):

```bash
$ python foo.py -w hello -s "hello, world" -c goodbye
Word: hello
Sentence: :hello, world
Comparison: the provided word argument and provided comparison argument is NOT the same
```

We can see that the word and comparison arguments are not the same. When they match up:

```bash
$ python foo.py -w hello -s "hello, world" -c hello
Word: hello
Sentence: :hello, world
Comparison: the provided word argument and provided comparison argument is the same
```

This was a very basic demonstration on the `argparse` module.

## Resource:

- [Python Docs: Argparse](https://docs.python.org/3/library/argparse.html)

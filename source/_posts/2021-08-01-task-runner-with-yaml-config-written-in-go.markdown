---
layout: post
title: "Task runner with YAML config written in Go"
date: 2021-08-01 06:11:54 -0400
comments: true
categories: ["task", "taskfile", "golang"] 
---

![](https://blog.ruanbekker.com/images/ruanbekker-header-photo.png)

[Task](https://taskfile.dev/) (aka Taskfile) is a task runner written in [Go](https://golang.org/), which is similar to GNU Make, but in my opinion is a lot easier to use as you specify your tasks in yaml.

## What to expect

In this post we will go through a quick demonstration using Task, how to install Task, as well as a couple of basic examples to get you up and running with Task.

## Install

For mac, installing task::

```bash
$ brew install go-task/tap/go-task
```

For linux, installing task:

```bash
$ sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin
```

Or manual installation for arm as an example:

```bash
$ pushd /tmp
$ wget https://github.com/go-task/task/releases/download/v3.7.0/task_linux_arm.tar.gz
$ tar -xvf task_linux_arm.tar.gz
$ sudo mv task /usr/local/bin/task
$ sudo chmod +x /usr/local/bin/task
$ popd
```

Verify that task is installed:

```bash
$ task --version
Task version: v3.7.0
```

For more information check the installation page:
- https://taskfile.dev/#/installation

## Usage

Task uses a default config file: `Taskfile.yml` in the current working directory where you can provide context on what your tasks should do.

To generate a `Taskfile.yml` with example config, task gives us a `--init` flag to generate a sample.

For a basic hello-world example, our task `helloworld` will echo out `hello, world!`. To generate the sample code, run:

```bash
task --init
```

Then update the config, to the following:

```yaml
version: '3'

tasks:
  helloworld:
    desc: prints out hello world message
    cmds:
      - echo "hello, world!"
```

To demonstrate what the config means:

* `tasks`: refers to the list of tasks
* `helloworld`: is the task name
* `desc`: describes the task, useful for listing tasks
* `cmds`: the commands that the task will execute 

To list all our tasks for our taskfile:

```bash
$ task --list
task: Available tasks for this project:
* helloworld: 	prints out hello world message
```

Which we call using the application `task` with the argument of the task name:

```bash
$ task helloworld
task: [helloworld] echo "hello, world!"
hello, world!
```

We can also reduce the output verbosity using `silent`:

```yaml
version: '3'

tasks:
  helloworld:
    desc: prints out hello world message
    cmds:
      - echo "hello, world!"
    silent: true
```

Which will result in:

```bash
$ task helloworld
hello, world!
```

For a example using environment variables, we can use it in two ways:

- per task
- globally, across all tasks

For using environment variables per task:

```yaml
version: '3'

tasks:
  helloworld:
    cmds:
      - echo "hello, $WORD!"
    env:
      WORD: world
```

Results in:

```bash
$ task helloworld
task: [helloworld] echo "hello, $WORD!"
hello, world!
```

For using environment variables globally across all tasks:

```yaml
version: '3'

env:
  WORD: world

tasks:
  helloworld:
    cmds:
      - echo "hello, $WORD!"
    env:
      GREETING: hello

  byeworld:
    cmds:
      - echo "$GREETING, $WORD!"
    env:
      GREETING: bye
```

Running our first task:

```bash
$ task helloworld
task: [helloworld] echo "hello, $WORD!"
hello, world!
```

And running our second task:

```bash
$ task byeworld
task: [byeworld] echo "$GREETING, $WORD!"
bye, world!
```

To store your environment variables in a `.env` file, you can specify it as the following in your `Taskfile.yml`:

```yaml
version: '3'

dotenv: ['.env']

tasks:
  helloworld:
    cmds:
      - echo "hello, $WORD!"
    env:
      GREETING: hello

  byeworld:
    cmds:
      - echo "$GREETING, $WORD!"
    env:
      GREETING: bye
```

And in your `.env`:

```
WORD=world
```

Then you should see your environment variables referenced from the `.env` file:

```
$ task helloworld
task: [helloworld] echo "hello, $WORD!"
hello, world!
```

We can also reference config using `vars`:

```yaml
version: '3'

vars:
  GREETING: Hello, World!

tasks:
  default:
    desc: prints out a message
    cmds:
      - echo "{{.GREETING}}"
```

In this case our task name is `default`, therefore we can only run `task` without any arguments, as default with be the default task:

```
$ task
task: [default] echo "Hello, World!"
Hello, World!
```

To run both tasks with one command, you can specify dependencies, so if we define a task with zero commands but just dependencies, it will call those tasks and execute them:

```yaml
version: '3'

env:
  WORD: world

tasks:
  helloworld:
    cmds:
      - echo "hello, $WORD!"
    env:
      GREETING: hello

  byeworld:
    cmds:
      - echo "$GREETING, $WORD!"
    env:
      GREETING: bye

  all:
    deps: [helloworld, byeworld]
```

So when we run the `all` task:

```bash
$ task all
task: [helloworld] echo "hello, $WORD!"
hello, world!
task: [byeworld] echo "$GREETING, $WORD!"
bye, world!
```

For more usage examples, have a look at their documentation:
- https://taskfile.dev/#/usage

## Thanks

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.

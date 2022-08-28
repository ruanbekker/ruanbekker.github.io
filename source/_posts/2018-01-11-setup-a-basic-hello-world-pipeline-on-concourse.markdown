---
layout: post
title: "Setup a Basic Hello World Pipeline on Concourse"
date: 2018-01-11 09:15:27 -0500
comments: true
categories: ["ci", "devops", "concourse"] 
---

We will setup a basic pipeline that pulls down content from github, then executes a task that prints hello world.

## Content on Github

The config can be found on my [Github Branch](https://github.com/ruanbekker/concourse-test/tree/basic-helloworld) but I will display each file in this post.

## Running our Pipeline

Our `pipeline.yml` that we need to have for concourse to know what to do:

```yaml
---
resources:
- name: my-git-repo
  type: git
  source:
    uri: https://github.com/ruanbekker/concourse-test
    branch: basic-helloworld

jobs:
- name: hello-world-job
  public: true
  plan:
  - get: my-git-repo
  - task: task_print-hello-world
    file: my-git-repo/ci/task-hello-world.yml
```

We can see from our `pipeline.yml` file, it points to a `task-hello-world.yml`, which I will preview below, but can be found in the repo:

```yaml
---
platform: linux

image_resource:
  type: docker-image
  source:
    repository: busybox

run:
  path: echo
  args: ["hello world"]
```

## Set Pipeline:

```
$ fly -t tutorial sp -c pipeline.yml -p pipeline-01
```

## Unpause Pipeline:

```
$ fly -t tutorial up -p pipeline-01
```

## Trigger Job:

```
$ fly -t tutorial tj -j pipeline-01/hello-world-job --watch
started pipeline-01/hello-world-job #2

Cloning into '/tmp/build/get'...
Fetching HEAD
292c84b change task name
initializing
running echo hello world
hello world
succeeded
```

This was all done through the command line, but you can also accessed it from the web ui

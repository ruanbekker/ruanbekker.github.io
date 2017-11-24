---
layout: post
title: "Basic Concourse Pipeline with Bash and Golang Jobs"
date: 2017-11-24 18:38:15 -0500
comments: true
categories: ["concourse", "devops", "ci", "golang"] 
---

From one of my previous posts, we went through the steps to setup a [Concourse CI Server on Ubuntu](http://blog.ruanbekker.com/blog/2017/11/07/setup-a-concourse-ci-server-on-ubuntu-16/) .

## What are we doing today?

Today we will setup a basic pipeline that executes 2 jobs, one using a alpine container that runs a couple of shell commands, and the other job will be using a Golang container to build and execute a golang app. I will also be experimenting with auto trigger, that will trigger the pipeline to run its jobs every 60 seconds.

## Our Pipeline Definition:

```yml bash-and-golang.yml
resources:
- name: container-resource
  type: time
  source:
    interval: 60m

jobs:
- name: my-alpine-job
  plan:
  - get: container-resource
    trigger: true
  - task: vanilla-alpine-tasks
    params:
      OWNER: ruan
    config:
      platform: linux
      image_resource:
        type: docker-image
        source:
          repository: alpine
          tag: edge
      run:
        path: /bin/sh
        args:
        - -c
        - |
          apk update > /dev/null
          apk upgrade > /dev/null
          apk add curl > /dev/null
          echo "Public IP is: `curl -s http://ip.ruanbekker.com`"
          echo "Hostname is: $HOSTNAME"
          echo "Owner is: $OWNER"
          echo foo > /tmp/word.txt
          export MAGIC_WORD=`cat /tmp/word.txt`
          echo "Magic word is $MAGIC_WORD"
          cat > app.sh << EOF
          #!/usr/bin/env sh
          echo "Hello, World!"
          EOF
          chmod +x app.sh
          echo "Shell Script Executing:"
          ./app.sh

- name: my-golang-job
  plan:
  - get: container-resource
    trigger: true
  - task: golang-tasks
    params:
      OWNER: james
    config:
      platform: linux
      image_resource:
        type: docker-image
        source:
          repository: golang
          tag: '1.6'
      run:
        path: /bin/sh
        args:
        - -c
        - |
          echo "User: `whoami`"
          echo "Go Version: `go version`"
          echo "Hostname is: $HOSTNAME"
          echo "Owner is: $OWNER"
          echo bar > /tmp/word.txt
          export MAGIC_WORD=`cat /tmp/word.txt`
          echo "Magic word is $MAGIC_WORD"
          cat > app.go << EOF
          package main

          import "fmt"

          func main() {
            fmt.Println("Hello, World!")
          }
          EOF
          go build app.go
          echo "Go App Executing:"
          ./app
```

## Login to Concourse:

Logon to concourse and set your target:

```bash
$ fly -t ci login --concourse-url=http://10.20.30.40:8080
logging in to team 'main'

username: admin
password:

target saved
```

List your targets:

```bash
$ fly targets
name      url                       team  expiry
ci        http://10.20.30.40:8080   main  Sat, 25 Nov 2017 23:30:55 UTC
```

## Apply Configuration

Apply your Configuration:

```bash
$ fly -t ci set-pipeline -p bash-and-golang -c bash-and-golang.yml

apply configuration? [yN]: y
pipeline created!
you can view your pipeline here: http://10.20.30.40:8080/teams/main/pipelines/bash-and-golang

the pipeline is currently paused. to unpause, either:
  - run the unpause-pipeline command
  - click play next to the pipeline in the web ui
```

## Unpause

Unpause your Pipeline:

```bash
$ fly -t ci unpause-pipeline -p bash-and-golang
unpaused 'bash-and-golang'
```

## Trigger

Trigger your first job:

```bash
$ fly -t ci trigger-job --job bash-and-golang/my-alpine-job
started bash-and-golang/my-alpine-job #2
```

Trigger your second job:

```bash
$ fly -t ci trigger-job --job bash-and-golang/my-golang-job
started bash-and-golang/my-golang-job #2
```

Remember, we can also monitor the output from the shell:

```bash
$ fly -t ci trigger-job --job bash-and-golang/my-golang-job --watch
started bash-and-golang/my-golang-job #3

initializing
running /bin/sh -c echo "User: `whoami`"
echo "Go Version: `go version`"
echo "Hostname is: $HOSTNAME"
echo "Owner is: $OWNER"
echo bar > /tmp/word.txt
export MAGIC_WORD=`cat /tmp/word.txt`
echo "Magic word is $MAGIC_WORD"
cat > app.go << EOF
package main

import "fmt"

func main() {
  fmt.Println("Hello, World!")
}
EOF
go build app.go
echo "Go App Executing:"
./app

User: root
Go Version: go version go1.6.4 linux/amd64
Hostname is:
Owner is: james
Magic word is bar
Go App Executing:
Hello, World!
succeeded
```

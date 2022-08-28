---
layout: post
title: "Running VS Code in your Browser with Docker"
date: 2019-09-14 12:56:05 +0200
comments: true
categories: ["vscode", "docker"] 
---

![vscode](https://user-images.githubusercontent.com/567298/64907374-cc9fd500-d6f1-11e9-87f0-3cae18f02c8d.png)

[![Say Thanks!](https://img.shields.io/badge/Say%20Thanks-!-1EAEDB.svg)](https://saythanks.io/to/ruanbekker) [![Slack Status](https://linux-hackers-slack.herokuapp.com/badge.svg)](https://linux-hackers-slack.herokuapp.com/) [![Chat on Slack](https://img.shields.io/badge/chat-on_slack-orange.svg)](https://linux-hackers.slack.com/) [![GitHub followers](https://img.shields.io/github/followers/ruanbekker.svg?label=Follow&style=social)](https://github.com/bekkerstacks/traefik)

<a href="https://twitter.com/ruanbekker?ref_src=twsrc%5Etfw" class="twitter-follow-button" data-show-count="false">Follow @ruanbekker</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

Today we will setup a Visual Studio Code instance running on Docker, so that you can access VSCode via the web browser.

## VSCode in Docker

The work directory will be under `code` and the application will store its data under `data`. Lets go ahead and create them:

```
mkdir demo/{code,data}
cd demo
```

Run the vscode container:

```
$ docker run --rm --name vscode \
  -it -p 8443:8443 -p 8888:8888 \
  -v $(pwd)/data:/data -v $(pwd)/code:/code \
ruanbekker/vscode:python-3.7
```

The password that you require on login will be prompted in the output:

```
INFO  code-server v1.1156-vsc1.33.1
INFO  Additional documentation: http://github.com/cdr/code-server
INFO  Initializing {"data-dir":"/data","extensions-dir":"/data/extensions","working-dir":"/code","log-dir":"/root/.cache/code-server/logs/20190914105631217"}
INFO  Starting shared process [1/5]...
INFO  Starting webserver... {"host":"0.0.0.0","port":8443}
INFO
INFO  Password: 4b050c4fa0ef109d53c10d9f
INFO
INFO  Started (click the link below to open):
INFO  https://localhost:8443/
INFO  Connected to shared process
```

Access vscode on `https://localhost:8443/` and after you accepted the self-signed certificate warning, you will be presented with the login page:

<img width="775" alt="image" src="https://user-images.githubusercontent.com/567298/64907196-89dcfd80-d6ef-11e9-82ac-09196c926f82.png">

After you have logged a example of creating a python file will look like this:

<img width="898" alt="image" src="https://user-images.githubusercontent.com/567298/64907240-02dc5500-d6f0-11e9-8443-cc1778b0de86.png">

The source code for this docker image can be found at https://github.com/ruanbekker/dockerfiles/tree/master/vscode .

## Different versions

Currently I have only [python available on docker hub](https://hub.docker.com/r/ruanbekker/vscode/tags) with the requests and flask packages available. But you can fork the repository and add the upstream or packages of your choice.

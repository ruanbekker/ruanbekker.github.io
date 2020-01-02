---
layout: post
title: "Managing Background Processes with Screen"
date: 2020-01-02 10:42:54 +0200
comments: true
categories: ["linux", "screen"]
---

![image](https://user-images.githubusercontent.com/567298/71659085-e6bbfc80-2d4e-11ea-9264-5ce0c848f9f3.png)

This is a quick post on how to create, manage and delete background processes with screen

## About

Screen allows you to run processes in a different session, so when you exit your terminal the process will still be running.

## Install

Install screen on the operating system of choice, for debian based systems it will be:

```bash
$ sudo apt install screen -y
```

## Working with Screen

To create a screen session, you can just run `screen` or you can provide an argument to provide a name:

```
$ screen -S my-screen-session
```

Now you will be dropped into a screen session, run a ping:

```
$ ping 8.8.8.8
```

Now to allow the ping process to run in the background, send the commands to detach the screen session:

```
Ctrl + a, then press d
```

To view the screen session:

```
$ screen -ls
There is a screen on:
	45916.my-screen-session	(Detached)
1 Socket in /var/folders/jr/dld7mjhn0sx6881xs_0s7rtc0000gn/T/.screen.
```

To resume the screen session, pass the screen id or screen name as a argument:

```
$ screen -r my-screen-session
64 bytes from 8.8.8.8: icmp_seq=297 ttl=55 time=7.845 ms
64 bytes from 8.8.8.8: icmp_seq=298 ttl=55 time=6.339 ms
```

## Scripting

To use a one liner to send a process as a detached screen session for scripting as an example, you can do that like this:

```
$ screen -S ping-process -m -d sh -c "ping 8.8.8.8"
```

Listing the screen session:

```
$ screen -ls
There is a screen on:
	46051.ping-process	(Detached)
```

Terminating the screen session:

```
$ screen -S ping-process -X quit
```

## Thank You

Let me know what you think. If you liked my content, feel free to visit me at **[ruan.dev](https://ruan.dev/)** or follow me on twitter at **[@ruanbekker](https://twitter.com/ruanbekker)**

[![](https://user-images.githubusercontent.com/567298/71188576-e2410f80-2289-11ea-8667-08f0c14ab7b5.png)](https://twitter.com/ruanbekker)

[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/A6423ZIQ)

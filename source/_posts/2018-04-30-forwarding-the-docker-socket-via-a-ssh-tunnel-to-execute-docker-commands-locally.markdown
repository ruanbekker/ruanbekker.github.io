---
layout: post
title: "Forwarding The Docker Socket via a SSH Tunnel to Execute Docker Commands Locally"
date: 2018-04-30 08:30:23 -0400
comments: true
categories: ["docker", "ssh", "devops", "ssh-tunnel"] 
---

With automation in mind, when you want to execute docker commands remotely, you want to do it in a secure manner, as you don't want to expose your Docker port to the whole world.

One way in doing that, is forwarding the remote docker socket via a local port over a SSH Tunnel. With this way, you can execute docker commands locally on your workstation, as if the swarm is running on your workstation/laptop/node/bastion host etc.

Without the tunnel, I have a swarm on my laptop with no running services:

```bash
$ docker service ls
ID                  NAME                   MODE                REPLICAS            IMAGE                                                               PORTS
```

As you can see, we have no services running, but the remote swarm has a couple, so after forwarding the connection, we should see our remote services.

## Setting up the SSH Tunnel:

Here we will forward the remote docker socket: `/var/run/docker.sock` to a local port bound to localhost: `localhost:2377`:

```bash
$ screen -S docker
$ ssh -oStrictHostKeyChecking=no -oUserKnownHostsFile=/dev/null -i ~/path/to/key.pem -NL localhost:2377:/var/run/docker.sock root@docker-managers.mydomain.com
```

Now the SSH Tunnel will be established, and you can detach your screen session, or open a new shell session. To detach your screen session: `'ctrl + a' then d`

## Verifying that the tunnel is established:

You can use netstat to verify that the port is listening:

```bash
$ netstat -ant | grep 2377
tcp4       0      0  127.0.0.1.2377         *.*                    LISTEN
```

## Inform the Docker Client to use the Port:

Now we need to inform the docker client, to use the new port to talk to the docker daemon. We do that by setting the `DOCKER_HOST` environment variable to point to `localhost:2377`:

```bash
$ export DOCKER_HOST="localhost:2377"
```

This will remain for the lifetime of the shell session.

## Testing it Out:

Now we can run our commands locally, and we should see the output of our remote swarm:

```bash
$ docker service ls
ID                  NAME                   MODE                REPLICAS            IMAGE                                                               PORTS
xjta8e3ek2u2        apps_flask_reminders   replicated          3/3                 rbekker87/flask-reminders:debian
0l7ruktbqj99        apps_kibana            replicated          1/1                 kibana:latest
...
```

## Terminating our SSH Tunnel:

To terminate our SSH Tunnel, reconnect to your shell session, and hit `ctrl + c`:

```bash
$ screen -ls 
There is a screen on:
	50413.docker	(Detached)
$ screen -r 50413
```

Hit `ctrl + c` :

```bash
CKilled by signal 2.
```

And exit the screen session:

```bash
$ exit
```

With this way, you can do lots of automation with docker swarm, not limited to swarm, but one of them.

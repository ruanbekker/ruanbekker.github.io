---
layout: post
title: "Deploy Traefik using Bekker Stacks"
date: 2019-09-04 21:46:35 +0200
comments: true
categories: ["traefik", "docker", "swarm", "bekkerstacks"]
---

![](![image](https://user-images.githubusercontent.com/50801771/64287218-67b0e600-cf5f-11e9-8fe7-f36cb8e71f6f.png))

[![Say Thanks!](https://img.shields.io/badge/Say%20Thanks-!-1EAEDB.svg)](https://saythanks.io/to/ruanbekker) [![Slack Status](https://linux-hackers-slack.herokuapp.com/badge.svg)](https://linux-hackers-slack.herokuapp.com/) [![Chat on Slack](https://img.shields.io/badge/chat-on_slack-orange.svg)](https://linux-hackers.slack.com/) [![GitHub followers](https://img.shields.io/github/followers/ruanbekker.svg?label=Follow&style=social)](https://github.com/bekkerstacks/traefik) 

<a href="https://twitter.com/ruanbekker?ref_src=twsrc%5Etfw" class="twitter-follow-button" data-show-count="false">Follow @ruanbekker</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>


After a year or two spending quite a lot of time into docker and more specifically docker swarm, I found it quite tedious to write up docker-compose files for specific stacks that you are working on. I also felt the need for a docker swarm compose package manager.

Fair enough, you store them on a central repository and then you can reuse them as you go, and that is exactly what I did, but I felt that perhaps other people have the same problem.

## The Main Idea

So the main idea is to have a central repository with docker swarm stacks, that you can pick and choose what you want, pull down the repository and use environment variables to override the default configuration and use the deploy script to deploy the stack that you want.

## Future Ideas

In the future I would like to create a cli tool that you can use to list stacks, as example:

```
$ bstacks list
traefik
monitoring-cpang (cAdvisor, Prometheus, Alertmanager, Node-Exporter, Grafana)
monitoring-tig   (Telegraf, InfluxDB, Grafana)
logging-efk      (Elasticsearch, Filebeat, Kibana)
...
```

Listing stacks by category:

```
$ bstacks list --category logging
logging-efk
...
```

Deploying a stack:

```
$ bstacks deploy --stack traefik --stack-name proxy --env-file ./stack.env
Username for Traefik UI: ruan
Password for Traefik UI: deploying traefik stack in http mode
Creating network public
Creating config proxy_traefik_htpasswd
Creating service proxy_traefik
Traefik UI is available at:
- http://traefik.localhost
```

At the time of writing the cli tool is not available yet, but the list of available templated docker stack repositories are availabe at [github.com/bekkerstacks](https://github.com/bekkerstacks?tab=repositories)

## What are we doing today

In this tutorial we will deploy a [Traefik](https://github.com/bekkerstacks/traefik) proxy on Docker Swarm. I will be demonstrating the deployment on my Mac, and currently I have only docker installed, without a swarm being initialized.

If you already have a swarm initialized and running this on servers, you can skip the local dev section.

## Local Dev

We will be initializing a 3 node docker swarm on a mac using docker-in-docker. Get the repository:

```
$ git clone https://github.com/bekkerstacks/docker-swarm
```

Switch to the directory and deploy the swarm:

```
$ bash deploy.sh

ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS      ENGINE VERSION
lkyjkvuc5uobzgps4m7e98l0u *   docker-desktop      Ready               Active              Leader              19.03.1
6djgz804emj89rs8icd53wfgn     worker-1            Ready               Active                                  18.06.3-ce
gcz6ou0s5p8kxve63ihnky7ai     worker-2            Ready               Active                                  18.06.3-ce
ll8zfvuaek8q4x9nlijib0dfa     worker-3            Ready               Active                                  18.06.3-ce
```

As you can see we have a 4 node docker swarm running on our local dev environment to continue.

## Deploy Traefik

To deploy traefik in HTTPS mode, we need to set 3 environment variables: `EMAIL`, `DOMAIN`, `PROTOCOL`. We also need to setup our DNS to direct traefik to our swarm. In my case I will be using `1.2.3.4` as the IP of my Manager node and using the domain `mydomain.com`

The DNS setup will look like this:

```
A Record: mydomain.com -> 1.1.1.1
A Record: *.mydomain.com -> 1.1.1.1
```

And if you are using this locally, you can setup your `/etc/hosts` to `127.0.0.1 traefik.mydomain.com`

Clone the repository:

```
$ git clone https://github.com/bekkerstacks/traefik
```

Change the the repository and deploy the stack:

```
$ EMAIL=me@mydomain.com DOMAIN=mydomain.com PROTOCOL=https bash deploy.sh
Username for Traefik UI: ruan
Password for Traefik UI: deploying traefik stack in https mode
Creating network public
Creating config proxy_traefik_htpasswd
Creating service proxy_traefik
Traefik UI is available at:
- https://traefik.mydomain.com
```

Verify that the Traefik service is running:

```
$ docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE               PORTS
0wga71zbx1pe        proxy_traefik       replicated          1/1                 traefik:1.7.14      *:80->80/tcp
```

Navigating to the Traefik Dashboard, after providing your username and password, you should see the Traefik UI:

![](https://user-images.githubusercontent.com/50801771/64284457-eefb5b00-cf59-11e9-90cb-eeb2b417c80c.png)

Note: I don't own mydomain.com therefore I am using the traefik default cert, that will be why it's showing not secure.

## Deploy Traefik in HTTP Mode

If you want to deploy Traefik in HTTP mode rather, you would use:

```
$ DOMAIN=localhost PROTOCOL=http bash deploy.sh
Username for Traefik UI: ruan
Password for Traefik UI: deploying traefik stack in http mode
Creating network public
Creating config proxy_traefik_htpasswd
Creating service proxy_traefik
Traefik UI is available at:
- http://traefik.localhost
```

Navigating to the Traefik Dashboard, after providing your username and password, you should see the Traefik UI:

![](https://user-images.githubusercontent.com/50801771/64283759-56b0a680-cf58-11e9-9f85-6721ab3b1500.png)

## More Info

In future posts, I will demonstrate how to deploy other stacks using bekkerstacks. 

Have a look at the repositories on github for more info:

- https://github.com/bekkerstacks
- https://github.com/bekkerstacks/docker-swarm
- https://github.com/bekkerstacks/traefik

## Thank You

Let me know what you think. If you liked my content, feel free to checkout my content on **[ruan.dev](https://ruan.dev/)** or follow me on twitter at **[@ruanbekker](https://twitter.com/ruanbekker)**

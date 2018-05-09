---
layout: post
title: "Manage Scaleway Instances via their API like a Boss with their Command Line Tool scw"
date: 2018-05-09 12:31:11 -0400
comments: true
categories: ["scaleway", "cli", "api", "docker"]
---

![](https://preview.ibb.co/bBRhn7/scw.png)

Let's set things straight: I am a command line fan boy, If I can do the things I have to do with a command line interface, i'm happy! And that means automation ftw! :D

## Scaleway Command Line Interface:

I have been using Scaleway for about 2 years now, and absolutely loving their services! So I recently found their [command line interface utility: scw](https://github.com/scaleway/scaleway-cli), which is written in golang and has a very similar feel to docker.

## Install the SCW CLI Tool:

A golang environment is needed and I will be using docker to drop myself into a golang environment and then install the scw utility:

```bash
$ docker run -it golang:alpine sh
$ apk update
$ apk add openssl git openssh curl
$ go get -u github.com/scaleway/scaleway-cli/cmd/scw
``` 

Verify that it was installed:

```bash
$ scw --version
scw version v1.16+dev, build
```

Awesome sauce!

## Authentication:

When we authenticate to Scaleway, it will prompt you to upload your public ssh key, as I am doing this in a container I have no ssh keys, so therefore will generate one before I authenticate.

Generate the SSH Key:

```bash
$ ssh-keygen -t rsa
Generating public/private rsa key pair.
Enter file in which to save the key (/root/.ssh/id_rsa):
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /root/.ssh/id_rsa.
Your public key has been saved in /root/.ssh/id_rsa.pub.
```

Now loging to Scaleway using the cli tools:

```bash
$ scw login
Login (cloud.scaleway.com): <youremail@domain.com>
Password:
Do you want to upload an SSH key ?
[0] I don't want to upload a key !
[1] id_rsa.pub
Which [id]: 1

You are now authenticated on Scaleway.com as Ruan.
You can list your existing servers using `scw ps` or create a new one using `scw run ubuntu-xenial`.
You can get a list of all available commands using `scw -h` and get more usage examples on github.com/scaleway/scaleway-cli.
Happy cloud riding.
```

Sweeet! 

![](https://pics.me.me/hacker-voice-im-in-24303160.png)

## Getting Info from Scaleway

List Instance Types:

```bash
$ scw products servers
COMMERCIAL TYPE     ARCH     CPUs      RAM  BAREMETAL
ARM64-128GB        arm64       64   137 GB      false
ARM64-16GB         arm64       16    17 GB      false
ARM64-2GB          arm64        4   2.1 GB      false
ARM64-32GB         arm64       32    34 GB      false
ARM64-4GB          arm64        6   4.3 GB      false
ARM64-64GB         arm64       48    69 GB      false
ARM64-8GB          arm64        8   8.6 GB      false
C1                   arm        4   2.1 GB       true
C2L               x86_64        8    34 GB       true
C2M               x86_64        8    17 GB       true
C2S               x86_64        4   8.6 GB       true
START1-L          x86_64        8   8.6 GB      false
START1-M          x86_64        4   4.3 GB      false
START1-S          x86_64        2   2.1 GB      false
START1-XS         x86_64        1   1.1 GB      false
VC1L              x86_64        6   8.6 GB      false
VC1M              x86_64        4   4.3 GB      false
VC1S              x86_64        2   2.1 GB      false
X64-120GB         x86_64       12   129 GB      false
X64-15GB          x86_64        6    16 GB      false
X64-30GB          x86_64        8    32 GB      false
X64-60GB          x86_64       10    64 GB      false
```

Get a list of available Images, in my case I am just looking for Ubuntu:

```bash
$ scw images | grep -i ubuntu
Ubuntu_Bionic               latest              a21bb700            11 days             [ams1 par1]         [x86_64]
Ubuntu_Mini_Xenial_25G      latest              bc75c00b            13 days             [ams1 par1]         [x86_64]
```

List Running Instances:

```bash
$ scw ps
SERVER ID           IMAGE                       ZONE                CREATED             STATUS              PORTS               NAME                  COMMERCIAL TYPE
abc123de            Ubuntu_Xenial_16_04_lates   ams1                5 weeks             running             xx.xx.xx.xx         scw-elasticsearch-01  ARM64-4GB
abc456de            ruan-docker-swarm-17_03     par1                10 months           running             xx.xx.xxx.xxx       scw-swarm-manager-01  VC1M
...
```

List All Instances (Running, Stopped, Started, etc):

```bash
$ scw ps -a
SERVER ID           IMAGE                       ZONE                CREATED             STATUS              PORTS               NAME                  COMMERCIAL TYPE
abc123df            Ubuntu_Xenial_16_04_lates   ams1                5 weeks             stopped             xx.xx.xx.xx         scw-elasticsearch-02  ARM64-4GB
...
```

List Instances with a filter based on its name:

```bash
$ scw ps -f name=scw-swarm-worker-02
SERVER ID           IMAGE               ZONE                CREATED             STATUS              PORTS               NAME                COMMERCIAL TYPE
1234abcd            Ubuntu_Xenial       par1                8 minutes           running             xx.xx.xxx.xxx       scw-swarm-worker-2  START1-XS
```

List the Latest Instance that was created:

```bash
$ scw ps -l
SERVER ID           IMAGE               ZONE                CREATED             STATUS              PORTS               NAME                COMMERCIAL TYPE
1234abce            Ubuntu_Xenial       par1                6 minutes           running             xx.xx.xxx.xxx       scw-swarm-worker-3  START1-XS
``` 

## Create Instances:

In my scenario, I would like to create a instance named `docker-swarm-worker-4` with the instance type `START1-XS` in the Paris datacenter, and I will be using my key that I have uploaded, also the image id that I passed, was retrieved when listing for images:

```bash
$ scw --region=par1 create --commercial-type=START1-XS --ip-address=dynamic --ipv6=false --name="docker-swarm-worker-4" --tmp-ssh-key=false  bc75c00b
<response: random uuid string>
```

Now that the instance is created, we can start it by calling either the name or the id:

```bash
$ scw start docker-swarm-worker-4
```

To verify the status of the instance, we can do:

```bash
$ scw ps -l
SERVER ID           IMAGE               ZONE                CREATED             STATUS              PORTS               NAME                   COMMERCIAL TYPE
102abc34            Ubuntu_Xenial                           28 seconds          starting                                docker-swarm-worker-4  START1-XS
```

At this moment it is still starting, after waiting a minute or so, run it again:

```bash
$ scw ps -l
SERVER ID           IMAGE               ZONE                CREATED             STATUS              PORTS               NAME                   COMMERCIAL TYPE
102abc34            Ubuntu_Xenial       par1                About a minute      running             xx.xx.xx.xx         docker-swarm-worker-4  START1-XS
```

As we can see its in a running state, so we are good to access our instance. You have 2 options to access your server, via exec and ssh.

```
$ scw exec docker-swarm-worker-4 /bin/bash
root@docker-swarm-worker-4:~
```

or via SSH:

```
$ ssh root@xx.xx.xx.xx
root@docker-swarm-worker-4:~
```

If you would like to access your server without uploading your SSH key to your account, you can pass `--tmp-ssh-key=true` as in:

```bash
$ scw --region=par1 create --commercial-type=START1-XS --ip-address=dynamic --ipv6=false --name="scw-temp-instance" --tmp-ssh-key=true  bc75c00b
```

## Terminating Resources:

This wil stop, terminate the instance with the associated volumes and reserved ip

```bash
$ scw stop --terminate=true scw-temp-instance 
scw-temp-instance
```

If you had to remove a volume that is not needed, or unused:

```
$ scw rmi test-1-snapshot-<long-string>--2018-04-26_12:42
```

To logout:

```bash
$ scw logout
```

## Resources:

Have a look at [Scaleway-CLI Documentation](https://github.com/scaleway/scaleway-cli) and their [Website](https://www.scaleway.com/) for more info, and have a look at their new `START1-XS` instance types, that is only 1.99 Euro's, that is insane!

Personally love what they are doing, feel free to head over to their [pricing page](https://www.scaleway.com/pricing/) to see some sweet deals!

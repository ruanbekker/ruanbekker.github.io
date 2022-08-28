---
layout: post
title: "Setting up a Docker Swarm Cluster on 3 RaspberryPi Nodes"
date: 2018-10-23 16:24:00 -0400
comments: true
categories: ["raspberrypi", "docker", "swarm", "glusterfs", "storage"] 
---

![](https://objects.ruanbekker.com/assets/images/rpi-docker-swarm.png)

As the curious person that I am, I like to play around with new stuff that I stumble upon, and one of them was having a docker swarm cluster running on 3 Raspberry Pi's on my LAN.

The idea is to have 3 Raspberry Pi's (Model 3 B), a Manager Node, and 2 Worker Nodes, each with a 32 GB SanDisk SD Card, which I will also be part of a 3x Replicated GlusterFS Volume that will come in handy later for some data that needs persistent data.

More Inforamtion on: [Docker Swarm](https://docs.docker.com/engine/swarm/)

<script id="mNCC" language="javascript">
    medianet_width = "728";
    medianet_height = "90";
    medianet_crid = "218284798";
    medianet_versionId = "3111299"; 
  </script>
<script src="//contextual.media.net/nmedianet.js?cid=8CUD78FSV"></script>

## Provision Raspbian on each RaspberryPi

Grab the [Latest Raspbian Lite ISO](https://downloads.raspberrypi.org/raspbian_lite_latest) and the following [source](https://www.raspberrypi.org/documentation/installation/installing-images/) will help provisioning your RaspberryPi with Raspbian.

## Installing Docker on Raspberry PI

On each node, run the following to install docker, and also add your user to the docker group, so that you can run docker commands with a normal user:

```bash
$ apt-get update && sudo apt-get upgrade -y
$ sudo apt-get remove docker.io
$ curl https://get.docker.com | sudo bash
$ sudo usermod -aG docker pi
```

If you have an internal DNS Server, set an A Record for each node, or for simplicity, set your hosts file on each node so that your hostname for each node responds to it's provisioned IP Address:

```bash
$ cat /etc/hosts
192.168.0.2   rpi-01
192.168.0.3   rpi-02
192.168.0.4   rpi-03
```

Also, to have passwordless SSH, from each node:

```bash
$ ssh-keygen -t rsa
$ ssh-copy-id rpi-01
$ ssh-copy-id rpi-02
$ ssh-copy-id rpi-03
```

## Initialize the Swarm

Time to set up our swarm. As we have more than one network interface, we will need to setup our swarm by specifying the IP Address of our network interface that is accessible from our LAN:

```bash
$ ifconfig eth0
eth0      Link encap:Ethernet  HWaddr a1:12:bc:d3:cd:4d
          inet addr:192.168.0.2  Bcast:192.168.0.255  Mask:255.255.255.0
```

Now that we have our IP Address, initialize the swarm on the manager node:

```bash
pi@rpi-01:~ $ docker swarm init --advertise-addr 192.168.0.2
Swarm initialized: current node (siqyf3yricsvjkzvej00a9b8h) is now a manager.

To add a worker to this swarm, run the following command:

    docker swarm join \
    --token SWMTKN-1-0eith07xkcg93lzftuhjmxaxwfa6mbkjsmjzb3d3sx9cobc2zp-97s6xzdt27y2gk3kpm0cgo6y2 \
    192.168.0.2:2377

To add a manager to this swarm, run 'docker swarm join-token manager' and follow the instructions.  

```

Then from `rpi-02` join the manager node of the swarm:

```bash
pi@rpi-02:~ $ docker swarm join --token SWMTKN-1-0eith07xkcg93lzftuhjmxaxwfa6mbkjsmjzb3d3sx9cobc2zp-97s6xzdt27y2gk3kpm0cgo6y2 192.168.0.2:2377
This node joined a swarm as a worker.  
```

Then from `rpi-03` join the manager node of the swarm:

```bash
pi@rpi-03:~ $ docker swarm join --token SWMTKN-1-0eith07xkcg93lzftuhjmxaxwfa6mbkjsmjzb3d3sx9cobc2zp-97s6xzdt27y2gk3kpm0cgo6y2 192.168.0.2:2377
This node joined a swarm as a worker.  
```

Then from the manager node: `rpi-01`, ensure that the nodes are checked in:

```bash
pi@rpi-01:~ $ docker node ls
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS
62s7gx1xdm2e3gp5qoca2ru0d     rpi-03              Ready               Active
6fhyfy9yt761ar9pl84dkxck3 *   rpi-01              Ready               Active              Leader
pg0nyy9l27mtfc13qnv9kywe7     rpi-02              Ready               Active
```

## Setting Up a Replicated GlusterFS Volume

I have decided to setup a replicated glusterfs volume to have data replicated throughout the cluster if I would like to have some persistent data. From each node, install the GlusterFS Client and Server:

```bash
$ sudo apt install glusterfs-server glusterfs-client -y && sudo systemctl enable glusterfs-server
```

Probe the other nodes from the manager node:

```bash
pi@rpi-01:~ $ sudo gluster peer probe rpi-02
peer probe: success.

pi@rpi-01:~ $ sudo gluster peer probe rpi-03
peer probe: success.
```

Ensure that we can see all 3 nodes in our GlusterFS Pool:

```bash
pi@rpi-01:~ $ sudo gluster pool list
UUID                                    Hostname        State
778c7463-ba48-43de-9f97-83a960bba99e    rpi-02          Connected
00a20a3c-5902-477e-a8fe-da35aa955b5e    rpi-03          Connected
d82fb688-c50b-405d-a26f-9cb2922cce75    localhost       Connected
```

From each node, create the directory where GlusterFS will store the data for the bricks that we will specify when creating the volume:

```bash
pi@rpi-01:~ $ sudo mkdir -p /gluster/brick 
pi@rpi-02:~ $ sudo mkdir -p /gluster/brick
pi@rpi-03:~ $ sudo mkdir -p /gluster/brick
```

Next, create a 3 Way Replicated GlusterFS Volume:

```bash
pi@rpi-01:~ $ sudo gluster volume create rpi-gfs replica 3 \
rpi-01:/gluster/brick \
rpi-02:/gluster/brick \
rpi-03:/gluster/brick \
force

volume create: rpi-gfs: success: please start the volume to access data
```

Start the GlusterFS Volume:

```bash
pi@rpi-01:~ $ sudo gluster volume start rpi-gfs
volume start: rpi-gfs: success
```

Verify the GlusterFS Volume Info, and from the below output you will see that the volume is replicated 3 ways from the 3 bricks that we specified

```bash
pi@rpi-01:~ $ sudo gluster volume info

Volume Name: rpi-gfs
Type: Replicate
Volume ID: b879db15-63e9-44ca-ad76-eeaa3e247623
Status: Started
Number of Bricks: 1 x 3 = 3
Transport-type: tcp
Bricks:
Brick1: rpi-01:/gluster/brick
Brick2: rpi-02:/gluster/brick
Brick3: rpi-03:/gluster/brick
```

Mount the GlusterFS Volume on each Node, first on `rpi-01`:

```bash
pi@rpi-01:~ $ sudo umount /mnt
pi@rpi-01:~ $ sudo echo 'localhost:/rpi-gfs /mnt glusterfs defaults,_netdev,backupvolfile-server=localhost 0 0' >> /etc/fstab
pi@rpi-01:~ $ sudo mount.glusterfs localhost:/rpi-gfs /mnt
pi@rpi-01:~ $ sudo chown -R pi:docker /mnt
```

Then on `rpi-02`:

```bash
pi@rpi-02:~ $ sudo umount /mnt
pi@rpi-02:~ $ sudo echo 'localhost:/rpi-gfs /mnt glusterfs defaults,_netdev,backupvolfile-server=localhost 0 0' >> /etc/fstab
pi@rpi-02:~ $ sudo mount.glusterfs localhost:/rpi-gfs /mnt
pi@rpi-02:~ $ sudo chown -R pi:docker /mnt
```

And lastly on `rpi-03`:

```bash
pi@rpi-03:~ $ sudo umount /mnt
pi@rpi-03:~ $ sudo echo 'localhost:/rpi-gfs /mnt glusterfs defaults,_netdev,backupvolfile-server=localhost 0 0' >> /etc/fstab
pi@rpi-03:~ $ sudo mount.glusterfs localhost:/rpi-gfs /mnt
pi@rpi-03:~ $ sudo chown -R pi:docker /mnt
```

Then your GlusterFS Volume will be mounted on all the nodes, and when a file is written to the `/mnt/` partition, data will be replicated to all the nodes in the Cluster:

```bash
pi@rpi-01:~ $ df -h
Filesystem          Size  Used Avail Use% Mounted on
/dev/root            30G  4.5G   24G  16% /
localhost:/rpi-gfs   30G  4.5G   24G  16% /mnt
```

## Create a Web Service on Docker Swarm:

Let's create a Web Service in our Swarm, called `web` and by specifying `1` replica and publishing the exposed port `80` to our containers port `80`: 

```bash
pi@rpi-01:~ $ docker service create --name web --replicas 1 --publish 80:80 hypriot/rpi-busybox-httpd
vsvyanuw6q6yf4jr52m5z7vr1
```

Verifying that our Service is Started and equals to the desired replica count:

```bash
pi@rpi-01:~ $ docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE                                                    PORTS
vsvyanuw6q6y        web                 replicated          1/1                 hypriot/rpi-busybox-httpd:latest                         *:891->80/tcp
```

Inspecting the Service:

```bash
pi@rpi-01:~ $ docker service inspect web
[
    {
        "ID": "vsvyanuw6q6yf4jr52m5z7vr1",
        "Version": {
            "Index": 2493
        },
        "CreatedAt": "2017-07-16T21:20:00.017836646Z",
        "UpdatedAt": "2017-07-16T21:20:00.026359794Z",
        "Spec": {
            "Name": "web",
            "Labels": {},
            "TaskTemplate": {
                "ContainerSpec": {
                    "Image": "hypriot/rpi-busybox-httpd:latest@sha256:c00342f952d97628bf5dda457d3b409c37df687c859df82b9424f61264f54cd1",
                    "StopGracePeriod": 10000000000,
                    "DNSConfig": {}
                },
                "Resources": {
                    "Limits": {},
                    "Reservations": {}
                },
                "RestartPolicy": {
                    "Condition": "any",
                    "Delay": 5000000000,
                    "MaxAttempts": 0
                },
                "Placement": {},
                "ForceUpdate": 0
            },
            "Mode": {
                "Replicated": {
                    "Replicas": 1
                }
            },
            "UpdateConfig": {
                "Parallelism": 1,
                "FailureAction": "pause",
                "Monitor": 5000000000,
                "MaxFailureRatio": 0,
                "Order": "stop-first"
            },
            "RollbackConfig": {
                "Parallelism": 1,
                "FailureAction": "pause",
                "Monitor": 5000000000,
                "MaxFailureRatio": 0,
                "Order": "stop-first"
            },
            "EndpointSpec": {
                "Mode": "vip",
                "Ports": [
                    {
                        "Protocol": "tcp",
                        "TargetPort": 80,
                        "PublishedPort": 80,
                        "PublishMode": "ingress"
                    }
                ]
            }
        },
        "Endpoint": {
            "Spec": {
                "Mode": "vip",
                "Ports": [
                    {
                        "Protocol": "tcp",
                        "TargetPort": 80,
                        "PublishedPort": 80,
                        "PublishMode": "ingress"
                    }
                ]
            },
            "Ports": [
                {
                    "Protocol": "tcp",
                    "TargetPort": 80,
                    "PublishedPort": 80,
                    "PublishMode": "ingress"
                }
            ],
            "VirtualIPs": [
                {
                    "NetworkID": "zjerz0xsw39icnh24enja4cgk",
                    "Addr": "10.255.0.13/16"
                }
            ]
        }
    }
]
```

Docker Swarm's Routing mesh takes care of the internal routing, so requests will respond even if the container is not running on the node that you are making the request against.

With that said, verifying on which node our service is running:

```bash
pi@rpi-01:~ $ docker service ps web
ID                  NAME                IMAGE                              NODE                DESIRED STATE       CURRENT STATE           ERROR               PORTS
sd67cd18s5m0        web.1               hypriot/rpi-busybox-httpd:latest   rpi-02              Running             Running 2 minutes ago
```

When we make a HTTP Request to one of these Nodes IP Addresses, our request will be responded with this awesome static page:

![](https://objects.ruanbekker.com/assets/images/armed-with-hypriot.jpg)

We can see we only have one container in our swarm, let's scale that up to `3` containers:

```bash
pi@rpi-01:~ $ docker service scale web01=3
web01 scaled to 3
```

Now that the service is scaled to 3 containers, requests will be handled using the round-robin algorithm. To ensured that the service scaled, we will see that we will have 3 replicas:

```bash
pi@rpi-01:~ $ docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE                                                    PORTS
vsvyanuw6q6y        web                 replicated          3/3                 hypriot/rpi-busybox-httpd:latest                         *:891->80/tcp
```

Verifying where these containers are running on:

```bash
pi@rpi-01:~ $ docker service ps web01
ID                  NAME                IMAGE                              NODE                DESIRED STATE       CURRENT STATE            ERROR               PORTS
sd67cd18s5m0        web.1               hypriot/rpi-busybox-httpd:latest   rpi-02              Running             Running 2 minutes ago
ope3ya7hh9j4        web.2               hypriot/rpi-busybox-httpd:latest   rpi-03              Running             Running 30 seconds ago
07m1ww7ptxro        web.3               hypriot/rpi-busybox-httpd:latest   rpi-01              Running             Running 28 seconds ago
```

Lastly, removing the service from our swarm:

```bash
pi@rpi-01:~ $ docker service rm web01
web01
```

## Massive Thanks:

a Massive thanks to [Alex Ellis](https://twitter.com/alexellisuk) for mentioning me on one of his blogposts:

- [https://blog.alexellis.io/blog-community-inspiration/](https://blog.alexellis.io/blog-community-inspiration/)

![](https://objects.ruanbekker.com/assets/images/tweet-alexellis-21072017.png)

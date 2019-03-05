---
layout: post
title: "Container Persistent Storage for Docker Swarm using a GlusterFS Volume PLugin"
date: 2019-03-05 13:18:30 -0500
comments: true
categories: ["docker", "swarm", "glusterfs", "storage", "containers"]
---

![](https://user-images.githubusercontent.com/567298/53351889-85572000-392a-11e9-9720-464e9318206e.jpg)

From one of my previous posts I demonstrated how to provide persistent storage for your containers by using a [Convoy NFS Plugin](https://blog.ruanbekker.com/blog/2018/02/16/guide-to-setup-docker-convoy-volume-driver-for-docker-swarm-with-nfs/). 

I've stumbled upon one AWESOME GlusterFS Volume Plugin for Docker by [@trajano](https://github.com/trajano/docker-volume-plugins/tree/master/glusterfs-volume-plugin), please have a look at his repository. I've been waiting for some time for one solid glusterfs volume plugin, and it works great.

## What we will be doing today

We will setup a 3 node replicated glusterfs volume and show how easy it is to install the volume plugin and then demonstrate how storage from our swarms containers are persisted.

Our servers that we will be using will have the private ip's as shown below:

```
10.22.125.101
10.22.125.102
10.22.125.103
```

## Setup GlusterFS

Have a look at [this](https://sysadmins.co.za/setup-a-3-node-replicated-storage-volume-with-glusterfs/) post to setup the glusterfs volume.

## Install the GlusterFS Volume Plugin

Below I'm installing the plugin and setting the alias name as `glusterfs`, granting all permissions and keeping the plugin in a disabled state.

```bash
$ docker plugin install --alias glusterfs trajano/glusterfs-volume-plugin --grant-all-permissions --disable
```

Set the glusterfs servers:

```
$ docker plugin set glusterfs SERVERS=10.22.125.101,10.22.125.102,10.22.125.103
```

Enable the glusterfs plugin:

```
$ docker plugin enable glusterfs
```

## Create a Service in Docker Swarm

Deploy a sample service on docker swarm with a volume backed by glusterfs. Note that my glusterfs volume is called `gfs`

```yaml
version: "3.4"

services:
  foo:
    image: alpine
    command: ping localhost
    networks:
      - net
    volumes:
      - vol1:/tmp

networks:
  net:
    driver: overlay

volumes:
  vol1:
    driver: glusterfs
    name: "gfs/vol1"
```

Deploy the stack:

```bash
$ docker stack deploy -c docker-compose.yml test
Creating service test_foo
```

Have a look on which node is your container running:

```bash
$ docker service ps test_foo
ID                  NAME                IMAGE               NODE                DESIRED STATE       CURRENT STATE            ERROR               PORTS
jfwzb7yxnrxx        test_foo.1          alpine:latest       swarm-worker-1      Running             Running 37 seconds ago
```

Now jump to the `swarm-worker-1` node and verify that the container is running on that node:

```bash
$ docker ps
CONTAINER ID        IMAGE                                          COMMAND                  CREATED             STATUS                  PORTS               NAMES
d469f341d836        alpine:latest                                  "ping localhost"           59 seconds ago      Up 57 seconds                               test_foo.1.jfwzb7yxnrxxnd0qxtcjex8lu
```

Now since the container is running on this node, we will also see that the volume defined in our task configuration will also be present:

```bash
$ docker volume ls
DRIVER                       VOLUME NAME
glusterfs:latest             gfs/vol1
```

Exec into the container and look at the disk layout:

```bash
$ docker exec -it d469f341d836 sh
/ # df -h
Filesystem                Size      Used Available Use% Mounted on
overlay                  45.6G      3.2G     40.0G   7% /
10.22.125.101:gfs/vol1   45.6G      3.3G     40.0G   8% /tmp
```

While you are in the container, write the hostname's value into a file which is mapped to the glusterfs volume:

```bash
$ echo $HOSTNAME > /tmp/data.txt
$ cat /tmp/data.txt
d469f341d836
```

## Testing Data Persistence

Time to test the data persistence. Scale the service to 3 replicas, then hop onto a new node where a replica resides and check if the data was persisted.

```bash
$ docker service scale test_foo=3
test_foo scaled to 3
overall progress: 3 out of 3 tasks
1/3: running   [==================================================>]
2/3: running   [==================================================>]
3/3: running   [==================================================>]
verify: Service converged
```

Check where the containers are running:

```bash
$ docker service ps test_foo
ID                  NAME                IMAGE               NODE                DESIRED STATE       CURRENT STATE            ERROR               PORTS
jfwzb7yxnrxx        test_foo.1          alpine:latest       swarm-worker-1      Running             Running 2 minutes ago
mdsg6c5b2nqb        test_foo.2          alpine:latest       swarm-worker-3      Running             Running 15 seconds ago
iybat57t4lha        test_foo.3          alpine:latest       swarm-worker-2      Running             Running 15 seconds ago
```

Hop onto the `swarm-worker-2` node and check if the data is persisted from our previous write:

```bash
$ docker exec -it 4228529aba29 sh
$ cat /tmp/data.txt
d469f341d836
```

Now let's append data to that file, then delete the stack and recreate to test if the data is still persisted:

```bash
$ echo $HOSTNAME >> /tmp/data.txt
$ cat /tmp/data.txt
d469f341d836
4228529aba29
```

On the manager delete the stack:

```bash
$ docker stack rm test
Removing service test_foo
```

The deploy the stack again:

```bash
$ docker stack deploy -c docker-compose.yml test
Creating service test_foo
```

Check where the container is running:

```bash
$ docker service ps test_foo
ID                  NAME                IMAGE               NODE                DESIRED STATE       CURRENT STATE           ERROR               PORTS
9d6z02m123jk        test_foo.1          alpine:latest       swarm-worker-1      Running             Running 2 seconds ago
```

Exec into the container and read the data:

```bash
$ docker exec -it 3008b1e1bba1 cat /tmp/data.txt
d469f341d836
4228529aba29
```

And as you can see the data is persisted.

## Resources

Please have a look and star [@trajano's](https://github.com/trajano/docker-volume-plugins) repository:

* https://github.com/trajano/docker-volume-plugins

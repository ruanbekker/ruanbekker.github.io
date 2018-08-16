---
layout: post
title: "Guide to Setup Docker Convoy Volume Driver for Docker Swarm with NFS"
date: 2018-02-16 08:51:59 -0500
comments: true
categories: ["docker", "docker-swarm", "nfs", "storage", "convoy"] 
---

![](http://obj-cache.cloud.ruanbekker.com/docker-logo.png)

In this post we will setup [Rancher's Convoy Storage Plugin](https://github.com/rancher/convoy) with NFS, to provide data persistence in Docker Swarm.

## The Overview:

This essentially means that we will have a NFS Volume, when the service gets created on Docker Swarm, the cluster creates these volumes with path mapping, so when a container gets spawned, restarted, scaled etc, the container that gets started on the new node will be aware of the volume, and will get the data that its expecting.

Its also good to note that our NFS Server will be a single point of failure, therefore its also good to look at a Distributed Volume like [GlusterFS](https://sysadmins.co.za/tag/glusterfs), [XtreemFS](https://sysadmins.co.za/tag/xtreemfs/), [Ceph](), etc.

- NFS Server (10.8.133.83)
- Rancher Convoy Plugin on Each Docker Node in the Swarm (10.8.133.83, 10.8.166.19, 10.8.142.195)

## Setup NFS:

Setup the NFS Server

*Update:*

In order for the containers to be able to change permissions, you need to set `(rw,async,no_subtree_check,no_wdelay,crossmnt,insecure,all_squash,insecure_locks,sec=sys,anonuid=0,anongid=0)`

- https://github.com/rancher/rancher/issues/6452

```bash
$ sudo apt-get install nfs-kernel-server nfs-common -y
$ mkdir /vol
$ chown -R nobody:nogroup /vol
$ echo '/vol 10.8.133.83(rw,sync,no_subtree_check) 10.8.166.19(rw,sync,no_subtree_check) 10.8.142.195(rw,sync,no_subtree_check)' >> /etc/exports
$ sudo systemctl restart nfs-kernel-server
$ sudo systemctl enable nfs-kernel-server
```

Setup the NFS Clients on each Docker Node:

```bash
$ sudo apt-get install nfs-common -y
$ mount 10.8.133.83:/vol /mnt
$ umount /mnt
$ df -h
```

If you can see tht the volume is mounted, unmount it and add it to the `fstab` so the volume can be mounted on boot:

```bash
$ sudo bash -c "echo '10.8.133.83:/vol /mnt nfs auto,nofail,noatime,nolock,intr,tcp,actimeo=1800 0 0' >> /etc/fstab"
$ sudo mount -a
```

## Install Rancher Convoy Plugin:

The Plugin needs to be installed on each docker node that will be part of the swarm:

```bash
$ cd /tmp
$ wget https://github.com/rancher/convoy/releases/download/v0.5.0/convoy.tar.gz
$ tar xzf convoy.tar.gz
$ sudo cp convoy/convoy convoy/convoy-pdata_tools /usr/local/bin/
$ sudo mkdir -p /etc/docker/plugins/
$ sudo bash -c 'echo "unix:///var/run/convoy/convoy.sock" > /etc/docker/plugins/convoy.spec'
```

## Create the init script:

Thanks to [deviantony](https://gist.github.com/deviantony/557984d62e867e6f505577b207db6ffc)

```bash
#!/bin/sh
### BEGIN INIT INFO
# Provides:
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Start daemon at boot time
# Description:       Enable service provided by daemon.
### END INIT INFO

dir="/usr/local/bin"
cmd="convoy daemon --drivers vfs --driver-opts vfs.path=/mnt/docker/volumes"
user="root"
name="convoy"

pid_file="/var/run/$name.pid"
stdout_log="/var/log/$name.log"
stderr_log="/var/log/$name.err"

get_pid() {
    cat "$pid_file"
}

is_running() {
    [ -f "$pid_file" ] && ps `get_pid` > /dev/null 2>&1
}

case "$1" in
    start)
    if is_running; then
        echo "Already started"
    else
        echo "Starting $name"
        cd "$dir"
        if [ -z "$user" ]; then
            sudo $cmd >> "$stdout_log" 2>> "$stderr_log" &
        else
            sudo -u "$user" $cmd >> "$stdout_log" 2>> "$stderr_log" &
        fi
        echo $! > "$pid_file"
        if ! is_running; then
            echo "Unable to start, see $stdout_log and $stderr_log"
            exit 1
        fi
    fi
    ;;
    stop)
    if is_running; then
        echo -n "Stopping $name.."
        kill `get_pid`
        for i in {1..10}
        do
            if ! is_running; then
                break
            fi

            echo -n "."
            sleep 1
        done
        echo

        if is_running; then
            echo "Not stopped; may still be shutting down or shutdown may have failed"
            exit 1
        else
            echo "Stopped"
            if [ -f "$pid_file" ]; then
                rm "$pid_file"
            fi
        fi
    else
        echo "Not running"
    fi
    ;;
    restart)
    $0 stop
    if is_running; then
        echo "Unable to stop, will not attempt to start"
        exit 1
    fi
    $0 start
    ;;
    status)
    if is_running; then
        echo "Running"
    else
        echo "Stopped"
        exit 1
    fi
    ;;
    *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac

exit 0
```

Make the script executable:

```bash
$ chmod +x /etc/init.d/convoy
```

Enable the service on boot:

```bash
$ sudo systemctl enable convoy
```

Start the service:

```bash
$ sudo /etc/init.d/convoy start
```

This should be done on all the nodes.

## Externally Managed Convoy Volumes

One thing to note is that, after your delete a volume, you will still need to delete the directory from the path where its hosted, as the application does not do that by itself.

Creating the Volume Before hand:

```bash
$ convoy create test1
test1

$ docker volume ls
DRIVER              VOLUME NAME
convoy              test1

$ cat /mnt/docker/volumes/config/vfs_volume_test1.json
{"Name":"test1","Size":0,"Path":"/mnt/docker/volumes/test1","MountPoint":"","PrepareForVM":false,"CreatedTime":"Mon Feb 05 13:07:05 +0000 2018","Snapshots":{}}
```

Viewing the volume from another node:

```bash
$ docker volume ls
DRIVER              VOLUME NAME
convoy              test1
```

## Creating a Test Service:

Create a test service to test the data persistence, our docker-compose.yml:

```bash
version: '3.4'

volumes:
  test1:
    external: true

networks:
  appnet:
    external: true

services:
  test:
    image: alpine:edge
    command: sh -c "ping 127.0.0.1"
    volumes:
      - test1:/data
    networks:
      - appnet
```

Creating the Overlay Network and Deploying the Stack:

```bash
$ docker network create -d overlay appnet
$ docker stack deploy -c docker-compose.yml apps
Creating service apps_test
```

Write data to the volume in the container:

```
$ docker exec -it apps_test.1.iojo7fpw8jirqjs3iu8qr7qpe sh
/ # echo "ok" > /data/file.txt
/ # cat /data/file.txt
ok
```

Scale the service:

```bash
$ docker service scale apps_test=2
apps_test scaled to 2
```

Inspect to see if the new replica is on another node:

```bash
$ docker service ps apps_test
ID                  NAME                IMAGE               NODE                DESIRED STATE       CURRENT STATE               ERROR                         PORTS
myrq2pc3z26z        apps_test.1         alpine:edge         scw-docker-1        Running             Running 45 seconds ago
ny8t97l2q00c         \_ apps_test.1     alpine:edge         scw-docker-1        Shutdown            Failed 51 seconds ago       "task: non-zero exit (137)"
iojo7fpw8jir         \_ apps_test.1     alpine:edge         scw-docker-1        Shutdown            Failed about a minute ago   "task: non-zero exit (137)"
tt0nuusvgeki        apps_test.2         alpine:edge         scw-docker-2        Running             Running 15 seconds ago
```

Logon to the new container and test if the data is persisted:

```bash
$ docker exec -it apps_test.2.tt0nuusvgekirw1c5myu720ga sh
/ # cat /data/file.txt
ok
```

Delete the Stack and Redeploy and have a look at the data we created earlier, and you will notice the data is persisted:

```bash
$ docker stack rm apps
$ docker stack deploy -c docker-compose.yml apps
$ docker exec -it apps_test.1.la4w2sbuu8cmv6xamwxl7n0ip cat /data/file.txt
ok
$ docker stack rm apps
```

## Create Volume via Compose:

You can also create the volume on service/stack creation level, so you dont need to create the volume before hand, the compose file:

```yml
version: '3.4'

volumes:
  test2:
    driver: convoy
    driver_opts:
      size: 10

networks:
  appnet:
    external: true

services:
  test:
    image: alpine:edge
    command: sh -c "ping 127.0.0.1"
    volumes:
      - test2:/data
    networks:
      - appnet
```

Deploy the Stack:

```bash
$ docker stack deploy -c docker-compose-new.yml apps
Creating service apps_test
```

List the volumes and you will notice that the volume was created:

```bash
$ docker volume ls
DRIVER              VOLUME NAME
convoy              apps_test2
convoy              test1
```

Lets inspect the volume, to see more details about it:

```bash
docker volume inspect apps_test2
[
    {
        "CreatedAt": "0001-01-01T00:00:00Z",
        "Driver": "convoy",
        "Labels": {
            "com.docker.stack.namespace": "apps"
        },
        "Mountpoint": "/mnt/docker/volumes/apps_test2",
        "Name": "apps_test2",
        "Options": {
            "size": "10"
        },
        "Scope": "local"
    }
]
```

As mentioned earlier, if you delete the volume, you need to delete the data directories as well

```bash
$ docker volume rm test1
test1

$ ls /mnt/docker/volumes/
apps_test2  config  test1

$ rm -rf /mnt/docker/volumes/test1
```

More info about the project:
- https://github.com/rancher/convoy

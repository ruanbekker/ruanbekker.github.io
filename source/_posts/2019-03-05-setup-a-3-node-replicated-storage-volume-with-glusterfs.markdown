---
layout: post
title: "Setup a 3 Node Replicated Storage Volume with GlusterFS"
date: 2019-03-05 14:01:37 -0500
comments: true
categories: ["glusterfs", "storage", "clustering"] 
---

![](https://access.redhat.com/documentation/en-US/Red_Hat_Storage/2.1/html/Administration_Guide/images/Replicated_Volume.png)

In one of my earlier posts on [GlusterFS](https://sysadmins.co.za/tag/glusterfs), we went through the steps on how to setup a [Distributed Storage Volume](https://sysadmins.co.za/setup-a-distributed-storage-volume-with-glusterfs/), where the end result was to have scalable storage, where size was the requirement.

<script type="text/javascript">
  ( function() {
    if (window.CHITIKA === undefined) { window.CHITIKA = { 'units' : [] }; };
    var unit = {"calltype":"async[2]","publisher":"rbekker87","width":728,"height":90,"sid":"Chitika Default"};
    var placement_id = window.CHITIKA.units.length;
    window.CHITIKA.units.push(unit);
    document.write('<div id="chitikaAdBlock-' + placement_id + '"></div>');
}());
</script>
<script type="text/javascript" src="//cdn.chitika.net/getads.js" async></script><p>
    
## What will we be doing today with GlusterFS?

Today, we will be going through the steps on how to setup a Replicated Storage Volume with GlusterFS, where we will have 3 GlusterFS Nodes, and using the replication factor of 3. 

**Replication Factor of 3:**

In other words, having 3 copies of our data and in our case, since we will have 3 nodes in our cluster, a copy of our data will reside on each node.

**What about Split-Brain:**

In Clustering, we get the term Split-Brain, where a node dies or leaves the cluster, the cluster reforms itself with the available nodes and then during this reformation, instead of the remaining nodes staying with the same cluster, 2 subset of cluster are created, and they are not aware of each other, which causes data corruption, here's a great resource on [Split-Brain](http://techthoughts.typepad.com/managing_computers/2007/10/split-brain-quo.html)

To prevent Split-Brain in GlusterFS, we can setup a [Arbiter Volume](https://gluster.readthedocs.io/en/latest/Administrator%20Guide/arbiter-volumes-and-quorum/). In a Replica Count of 3 and Arbiter count of 1: 2 Nodes will hold the replicated data, and the 1 Node which will be the Arbiter node, will only host the file/directory names and metadata but not any data. I will write up an [article]() on this in the future.

## Getting Started:

Let's get started on setting up a 3 Node Replicated GlusterFS. Each node will have an additional drive that is 50GB in size, which will be part of our GlusterFS Replicated Volume. I will also be using Ubuntu 16.04 as my linux distro.

**Preparing DNS Resolution:**

I will install GlusterFS on each node, and in my setup I have the following DNS entries:

- gfs01 (10.0.0.2)
- gfs02 (10.0.0.3)
- gfs03 (10.0.0.4)

**Preparing our Secondary Drives:**

I will be formatting my drives with `XFS`. Listing our block volumes:

```bash
$ lsblk
NAME MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
vdb  253:16   0 46.6G  0 disk
vda  253:0    0 18.6G  0 disk /
```

Creating the FileSystem with XFS, which we will be running on each node:

```bash
$ mkfs.xfs /dev/vdb
```

Then creating the directories where our bricks will reside, and also add an entry to our `/etc/fstab` so that our disk gets mounted when the operating system boots:

```bash
# node: gfs01
$ mkdir /gluster/bricks/1 -p
$ echo '/dev/vdb /gluster/bricks/1 xfs defaults 0 0' >> /etc/fstab
$ mount -a
$ mkdir /gluster/bricks/1/brick

# node: gfs02
$ mkdir /gluster/bricks/2 -p
$ echo '/dev/vdb /gluster/bricks/2 xfs defaults 0 0' >> /etc/fstab
$ mount -a
$ mkdir /gluster/bricks/2/brick

# node: gfs03
$ mkdir /gluster/bricks/3 -p
$ echo '/dev/vdb /gluster/bricks/3 xfs defaults 0 0' >> /etc/fstab
$ mount -a
$ mkdir /gluster/bricks/3/brick
```

After this has been done, we should see that the disks are mounted, for example on node: `gfs01`:

```
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/vda         18G  909M   17G   3% /
/dev/vdb         47G   80M   47G   1% /gluster/bricks/1
```

## Installing GlusterFS on Each Node:

Installing GlusterFS, repeat this on all 3 Nodes:

```bash
$ apt update && sudo apt upgrade -y
$ apt install xfsprogs attr glusterfs-server glusterfs-common glusterfs-client -y
$ systemctl enable glusterfs-server
```

In order to add the nodes to the trusted storage pool, we will have to add them by using `gluster peer probe`. Make sure that you can resolve the hostnames to the designated IP Addresses, and that traffic is allowed.

```bash
$ gluster peer probe gfs01
$ gluster peer probe gfs02
$ gluster peer probe gfs03
```

Now that we have added our nodes to our trusted storage pool, lets verify that by listing our pool:

```bash
$ gluster pool list
UUID                                    Hostname                State
f63d0e77-9602-4024-8945-5a7f7332bf89    gfs02                   Connected
2d4ac6c1-0611-4e2e-b4af-9e4aa8c1556d    gfs03                   Connected
6a604cd9-9a9c-406d-b1b7-69caf166a20e    localhost               Connected
```

Great! All looks good.

## Create the Replicated GlusterFS Volume:

Let's create our Replicated GlusterFS Volume, named `gfs`:

```bash
$ gluster volume create gfs \
  replica 3 \
  gfs01:/gluster/bricks/1/brick \
  gfs02:/gluster/bricks/2/brick \
  gfs03:/gluster/bricks/2/brick 

volume create: gfs: success: please start the volume to access data
```

Now that our volume is created, lets list it to verify that it is created:

```bash
$ gluster volume list
gfs
```

Now, start the volume:

```bash
$ gluster volume start gfs
volume start: gfs: success
```

View the status of our volume:

```bash
$ gluster volume status gfs
Status of volume: gfs
Gluster process                             TCP Port  RDMA Port  Online  Pid
------------------------------------------------------------------------------
Brick gfs01:/gluster/bricks/1/brick         49152     0          Y       6450
Brick gfs02:/gluster/bricks/2/brick         49152     0          Y       3460
Brick gfs03:/gluster/bricks/3/brick         49152     0          Y       3309
```

Next, view the volume inforation:

```bash
$ gluster volume info gfs

Volume Name: gfs
Type: Replicate
Volume ID: 6f827df4-6df5-4c25-99ee-8d1a055d30f0
Status: Started
Number of Bricks: 1 x 3 = 3
Transport-type: tcp
Bricks:
Brick1: gfs01:/gluster/bricks/1/brick
Brick2: gfs02:/gluster/bricks/2/brick
Brick3: gfs03:/gluster/bricks/3/brick
```

## Security:

From a GlusterFS level, it will allow clients to connect by default. To authorize these 3 nodes to connect to the GlusterFS Volume:

```bash
$ gluster volume set gfs auth.allow 10.0.0.2,10.0.0.3,10.0.0.4
```

Then if you would like to remove this rule:

```bash
$ gluster volume set gfs auth.allow *
```

## Mount the GlusterFS Volume to the Host:

Mount the GlusterFS Volume to each node, so we will have to mount it to each node, and also append it to our `/etc/fstab` file so that it mounts on boot:

```bash
$ echo 'localhost:/gfs /mnt glusterfs defaults,_netdev,backupvolfile-server=localhost 0 0' >> /etc/fstab
$ mount.glusterfs localhost:/gfs /mnt
```

**Verify the Mounted Volume:**

Check the mounted disks, and you will find that the Replicated GlusterFS Volume is mounted on our `/mnt` partition.

```bash
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/vda         18G  909M   17G   3% /
/dev/vdb         47G   80M   47G   1% /gluster/bricks/1
localhost:/gfs   47G   80M   47G   1% /mnt
```

You will note that GlusterFS Volume has a total size of 47GB usable space, which is the same size as one of our disks, but that is because we have a replicated volume with a replication factor of 3:  `(47 * 3 / 3)`

Now we have a Storage Volume which has 3 Replicas, one copy on each node, which allows us Data Durability on our Storage.

<p>

<center><script type='text/javascript' src='https://ko-fi.com/widgets/widget_2.js'></script><script type='text/javascript'>kofiwidget2.init('Buy Me a Coffee', '#46b798', 'A6423ZIQ');kofiwidget2.draw();</script></center>

<p>

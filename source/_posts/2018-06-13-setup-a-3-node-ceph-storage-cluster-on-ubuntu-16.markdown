---
layout: post
title: "Setup a 3 Node Ceph Storage Cluster on Ubuntu 16"
date: 2018-06-13 18:22:06 -0400
comments: true
categories: ["ceph", "storage"] 
---

![](https://ceph.com/wp-content/uploads/2016/07/Ceph_Logo_Standard_RGB_120411_fa.png)

For some time now, I wanted to do a setup of Ceph, and I finally got the time to do it. This setup was done on Ubuntu 16.04

<script id="mNCC" language="javascript">
    medianet_width = "728";
    medianet_height = "90";
    medianet_crid = "218284798";
    medianet_versionId = "3111299"; 
  </script>
<script src="//contextual.media.net/nmedianet.js?cid=8CUD78FSV"></script>

## What is Ceph

Ceph is a storage platform that implements object storage on a single distributed computer cluster and provides interfaces for object, block and file-level storage.

- Object Storage:

Ceph provides seemless access to objects via native language bindings or via the REST interface, RadosGW and also compatible for applications written for S3 and Swift.

- Block Storage:

Ceph's Rados Block Device (RBD) provides access to block device images that are replicated and striped across the storage cluster.

- File System:

Ceph provides a network file system (CephFS) that aims for high performance.

## Our Setup

We will have 4 nodes. 1 Admin node where we will deploy our cluster with, and 3 nodes that will hold the data:

- ceph-admin (10.0.8.2)
- ceph-node1 (10.0.8.3)
- ceph-node2 (10.0.8.4)
- ceph-node3 (10.0.8.5)

## Host Entries

If you don't have dns for your servers, setup the `/etc/hosts` file so that the names can resolves to the ip addresses:

```bash 
10.0.8.2 ceph-admin
10.0.8.3 ceph-node1
10.0.8.4 ceph-node2
10.0.8.5 ceph-node3
```

## User Accounts and Passwordless SSH

Setup the `ceph-system` user accounts on all the servers:

```bash
$ useradd -d /home/ceph-system -s /bin/bash -m ceph-system
$ passwd ceph-system
```

Setup the created user part of the sudoers that is able to issue sudo commands without a pssword:

```bash
$ echo "ceph-system ALL = (root) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/ceph-system
$ chmod 0440 /etc/sudoers.d/ceph-system
```

Switch user to `ceph-system` and generate SSH keys and copy the keys from the `ceph-admin` server to the ceph-nodes:

```bash
$ sudo su - ceph-system
$ ssh-keygen -t rsa -f ~/.ssh/id_rsa -P ""
$ ssh-copy-id ceph-system@ceph-node1
$ ssh-copy-id ceph-system@ceph-node2
$ ssh-copy-id ceph-system@ceph-node3
$ ssh-copy-id ceph-system@ceph-admin
```

## Pre-Requisite Software:

Install Python and Ceph Deploy on each node:

```
$ sudo apt-get install python -y
$ sudo apt install ceph-deploy -y
```

Note: Please skip this section if you have additional disks on your servers. 

The instances that im using to test this setup only has one disk, so I will be creating loop block devices using allocated files. This is not recommended as when the disk fails, all the (files/block device images) will be gone with that. But since im demonstrating this, I will create the block devices from a file:

I will be creating a 12GB file on each node

```
$ sudo mkdir /raw-disks 
$ sudo dd if=/dev/zero of=/raw-disks/rd0 bs=1M count=12288
```

The use losetup to create the loop0 block device:

```
$ sudo losetup /dev/loop0 /raw-disks/rd0
```

As you can see the loop device is showing when listing the block devices:

```
$ lsblk
NAME      MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
loop0       7:0    0   12G  0 loop
``` 

## Install Ceph

Now let's install ceph using ceph-deploy to all our nodes:

```
$ sudo apt update && sudo apt upgrade -y
$ ceph-deploy install ceph-admin ceph-node1 ceph-node2 ceph-node3
```

The version I was running at the time:
 
```
$ ceph --version
ceph version 10.2.9
```

## Initialize Ceph

Initialize the Cluster with 3 Monitors:

```
$ ceph-deploy new ceph-node1 ceph-node2 ceph-node3
```

Add the initial monitors and gather the keys from the previous command:

```
$ ceph-deploy mon create-initial
```

At this point, we should be able to scan the block devices on our nodes:

```
$ ceph-deploy disk list ceph-node3
[ceph-node3][INFO  ] Running command: sudo /usr/sbin/ceph-disk list
[ceph-node3][DEBUG ] /dev/loop0 other
```

## Prepare the Disks:

First we will zap the block devices and then prepare to create the partitions:

```
$ ceph-deploy disk zap ceph-node1:/dev/loop0 ceph-node2:/dev/loop0 ceph-node3:/dev/loop0
$ ceph-deploy osd prepare ceph-node1:/dev/loop0 ceph-node2:/dev/loop0 ceph-node3:/dev/loop0
[ceph_deploy.osd][DEBUG ] Host ceph-node1 is now ready for osd use.
[ceph_deploy.osd][DEBUG ] Host ceph-node2 is now ready for osd use.
[ceph_deploy.osd][DEBUG ] Host ceph-node3 is now ready for osd use.
```

When you scan the nodes for their disks, you will notice that the partitions has been created:

```
$ ceph-deploy disk list ceph-node1 
[ceph-node1][DEBUG ] /dev/loop0p2 ceph journal, for /dev/loop0p1 
[ceph-node1][DEBUG ] /dev/loop0p1 ceph data, active, cluster ceph, osd.0, journal /dev/loop0p2
```

Now let's activate the OSD's by using the data partitions:

```
$ ceph-deploy osd activate ceph-node1:/dev/loop0p1 ceph-node2:/dev/loop0p1 ceph-node3:/dev/loop0p1
```

## Redistribute Keys:

Copy the configuration files and admin key to your admin node and ceph data nodes:

```
$ ceph-deploy admin ceph-admin ceph-node1 ceph-node2 ceph-node3
```

If you would like to add more OSD's (not tested):

```
$ ceph-deploy disk zap ceph-node1:/dev/loop1 ceph-node2:/dev/loop1 ceph-node3:/dev/loop1
$ ceph-deploy osd prepare ceph-node1:/dev/loop1 ceph-node2:/dev/loop1 ceph-node3:/dev/loop1 
$ ceph-deploy osd activate ceph-node2:/dev/loop1p1:/dev/loop1p2 ceph-node2:/dev/loop1p1:/dev/loop1p2 ceph-node3:/dev/loop1p1:/dev/loop1p2
$ ceph-deploy admin ceph-node1 ceph-node2 ceph-node3
```

## Ceph Status:

Have a look at your cluster status:

```
$ sudo ceph -s
    cluster 8d704c8a-ac19-4454-a89f-89a5d5b7d94d
     health HEALTH_OK
     monmap e1: 3 mons at {ceph-node1=10.0.8.3:6789/0,ceph-node2=10.0.8.4:6789/0,ceph-node3=10.0.8.5:6789/0}
            election epoch 10, quorum 0,1,2 ceph-node2,ceph-node3,ceph-node1
     osdmap e14: 3 osds: 3 up, 3 in
            flags sortbitwise,require_jewel_osds
      pgmap v29: 64 pgs, 1 pools, 0 bytes data, 0 objects
            100 MB used, 18298 MB / 18398 MB avail
                  64 active+clean
```

Everything looks good. Also change the permissions on this file, on all the nodes in order to execute the ceph, rados commands:

```
$ sudo chmod +r /etc/ceph/ceph.client.admin.keyring
```

## Storage Pools:

List your pool in your Ceph Cluster:

```
$ rados lspools
rbd
```

Let's create a new storage pool called `mypool`:

```
$ ceph osd pool create mypool 32 32 
pool 'mypool' created
```

Let's the list the storage pools again:

```
$ rados lspools 
rbd 
mypool
```

You can also use the ceph command to list the pools:

```
$ ceph osd pool ls 
rbd 
mypool
```

Create a Block Device Image:

```
$ rbd create --size 1024 mypool/disk1 --image-feature layering
```

List the Block Device Images under your Pool:

```
$ rbd list mypool
disk1
```

Retrieve information from your image:

```
$ rbd info mypool/disk1
rbd image 'disk1':
        size 1024 MB in 256 objects
        order 22 (4096 kB objects)
        block_name_prefix: rbd_data.1021643c9869
        format: 2
        features: layering
        flags:
        create_timestamp: Thu Jun  7 23:48:23 2018
```

Create a local mapping of the image to a block device:

```
$ sudo rbd map mypool/disk1
/dev/rbd0
```

Now we have a block device available at `/dev/rbd0`. Go ahead and mount it to `/mnt`:

```
$ sudo mount /dev/rbd0 /mnt
```

We can then see it when we list our mounted disk partitions:

```
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        19G   13G  5.2G  72% /
/dev/rbd0       976M  1.3M  908M   1% /mnt
```

We can also resize the disk on the fly, let's resize it from 1GB to 2GB:

```
$ rbd resize mypool/disk1 --size 2048
Resizing image: 100% complete...done.
```

To grow the space we can use resize2fs for ext4 partitions and xfs_growfs for xfs partitions:

```
$ sudo resize2fs /dev/rbd0 
resize2fs 1.42.13 (17-May-2015)
Filesystem at /dev/rbd0 is mounted on /mnt; on-line resizing required
old_desc_blocks = 1, new_desc_blocks = 1
The filesystem on /dev/rbd0 is now 524288 (4k) blocks long.
```

When we look at our mounted partitions, you will notice that the size of our mounted partition has been increased in size:

```
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        19G   13G  5.2G   72% /
/dev/rbd0       2.0G  1.5M  1.9G   1% /mnt
```

## Object Storage RadosGW

Let's create a new pool where we will store our objects:

```
$ ceph osd pool create object-pool 32 32
pool 'object-pool' created
```

We will now create a local file, push the file to our object storage service, then delete our local file, download the file as a file with a different name, and read the contents:

Create the local file:

```
$ echo "ok" > test.txt
```

Push the local file to our pool in our object storage:

```
$ rados put objects/data/test.txt ./test.txt --pool object-pool
```

List the pool (note that this can be executed from any node):

```
$ $ rados ls --pool object-pool
objects/data/test.txt
```

Delete the local file, download the file from our object storage and read the contents:

```
$ rm -rf test.txt 

$ rados get objects/data/test.txt ./newfile.txt --pool object-pool

$ cat ./newfile.txt 
ok
```

View the disk space from our storage-pool:

```
$ rados df --pool object-pool
pool name                 KB      objects       clones     degraded      unfound           rd        rd KB           wr        wr KB
object-pool                1            1            0            0            0            0            0            1            1
  total used          261144           37
  total avail       18579372
  total space       18840516
```

## Resources:

- https://stackoverflow.com/questions/39589696/ceph-too-many-pgs-per-osd-all-you-need-to-know
- https://github.com/lucj/swarm-rexray-ceph
- http://docs.ceph.com/docs/mimic/rbd/
- http://docs.ceph.com/docs/mimic/radosgw/

<script type="text/javascript">
  ( function() {
    if (window.CHITIKA === undefined) { window.CHITIKA = { 'units' : [] }; };
    var unit = {"calltype":"async[2]","publisher":"rbekker87","width":728,"height":90,"sid":"Chitika Default"};
    var placement_id = window.CHITIKA.units.length;
    window.CHITIKA.units.push(unit);
    document.write('<div id="chitikaAdBlock-' + placement_id + '"></div>');
}());
</script>
<script type="text/javascript" src="//cdn.chitika.net/getads.js" async></script>

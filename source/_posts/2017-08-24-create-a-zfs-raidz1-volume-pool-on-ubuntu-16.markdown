---
layout: post
title: "Create a ZFS Raidz1 Volume Pool on Ubuntu 16"
date: 2017-08-24 09:16:34 -0400
comments: true
categories: ["zfs", "storage", "ubuntu"]
---

Setting up ZFS Volume Pool on Ubuntu 16.04

## Installation

```
$ sudo apt-get install zfsutils-linux -y
```

## Creating the ZFS Storage Pool

We will create a RAIDZ(1) Volume which is like Raid5 with Single Parity, so we can lose one of the Physical Disks before Raid failure.

Let's first have a look at our disks that we have on our server:

```
$ lsblk
NAME    MAJ:MIN RM SIZE RO TYPE MOUNTPOINT
xvda    202:0    0   8G  0 disk
└─xvda1 202:1    0   8G  0 part /
xvdf    202:80   0 100G  0 disk 
xvdg    202:80   0 100G  0 disk 
```

So we will be creating the volume consisting of `/dev/xvdf` and `/dev/xvdg` and we will name our pool: `storage-pool`

```
$ zpool create storage-pool raidz1 xvdf xvdg -f
```

## Listing Pools

```
$ zpool list
NAME           SIZE  ALLOC   FREE  EXPANDSZ   FRAG    CAP  DEDUP  HEALTH  ALTROOT
storage-pool   199G   125K   199G         -     0%     0%  1.00x  ONLINE  -
```

We can also list the volume with `zfs`:

```
$ zfs list
NAME            USED  AVAIL  REFER  MOUNTPOINT
storage-pool    125K  199G   19K    /storage-pool
```

## Mounting the Volume:

You will find that the volume is already mounted:

```
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/xvda1      7.7G  1.1G  6.7G  14% /
pool            199G  125K  198G   1% /pool
```

## Resources:

See how Brett Kelly from 45 Drives tried to break a Storage Cluster with GlusterFS and ZFS:

<iframe width="740" height="318" src="https://www.youtube.com/embed/A0wV4k58RIs" frameborder="0" allowfullscreen></iframe>


Great ZFS Performance Comparison:

- https://calomel.org/zfs_raid_speed_capacity.html

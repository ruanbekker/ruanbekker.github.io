---
layout: post
title: "Expanding the Size of your EBS Volume on AWS EC2 for Linux"
date: 2018-03-28 01:45:07 -0400
comments: true
categories: ["aws", "ec2", "ebs", "storage", "linux", "cloud", "sysadmin"]
---

![](https://i.snag.gy/BJLbwQ.jpg)

Resizing your EBS Volume on the fly, that is attached to your EC2 Linux instance, on Amazon Web Services.

We want to resize our EBS Volume from 100GB to 1000GB and at the moment my EBS Volume is 100GB, as you can see:

```bash
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
devtmpfs        7.9G   60K  7.9G   1% /dev
tmpfs           7.9G     0  7.9G   0% /dev/shm
/dev/xvda1       99G   32G   67G  32% /
```

Now we want to resize the volume to 1000GB, without shutting down our EC2 instance.

Go to your EC2 Management Console, Select your EC2 Instance, scroll down to the EBS Volume, click on it and click the EBS Volume ID, from there select Actions, modify and resize the disk to the needed size. As you can see the disk is now 1000GB:

```bash
$ lsblk
NAME    MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
xvda    202:0    0 1000G  0 disk
xvda1 202:1    0 1000G  0 part /
```

But our partition is still 100GB:

```bash
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
devtmpfs        7.9G   60K  7.9G   1% /dev
tmpfs           7.9G     0  7.9G   0% /dev/shm
/dev/xvda1       99G   32G   67G  32% /
```

We need to use `growpart` and `resize2fs` to resize our partition:

```bash
$ sudo growpart /dev/xvda 1
CHANGED: disk=/dev/xvda partition=1: start=4096 old: size=209711070,end=209715166 new: size=2097147870,end=2097151966
```

```bash
$ sudo resize2fs /dev/xvda1
resize2fs 1.42.12 (29-Aug-2014)
Filesystem at /dev/xvda1 is mounted on /; on-line resizing required
old_desc_blocks = 7, new_desc_blocks = 63
The filesystem on /dev/xvda1 is now 262143483 (4k) blocks long.
```

**Note:** If you are using XFS as your filesystem type, you will need to use `xfs_growfs` instead of `resize2fs`. (Thanks Donovan). 

Example using XFS shown below:

```bash
$ sudo xfs_growfs /dev/xvda1
```

**Note:** If you are using nvme, it will look like this:

```
$ sudo lsblk
NAME        MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
nvme1n1     259:0    0  160G  0 disk
-nvme1n1p1  259:1    0   80G  0 part /data

$ sudo growpart /dev/nvme1n1 1
CHANGED: partition=1 start=2048 old: size=167770112 end=167772160 new: size=335542239 end=335544287

$ resize2fs /dev/nvme1n1p1
resize2fs 1.45.5 (07-Jan-2020)

$ sudo lsblk
NAME        MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
nvme1n1     259:0    0  160G  0 disk
-nvme1n1p1  259:1    0  160G  0 part /data
```

Now we will have a resized partition to 100GB:

```bash
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
devtmpfs        7.9G   60K  7.9G   1% /dev
tmpfs           7.9G     0  7.9G   0% /dev/shm
/dev/xvda1      985G   33G  952G   4% /
```

Resources:

- https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/recognize-expanded-volume-linux.html

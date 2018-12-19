---
layout: post
title: "Resizing Hetzner Cloud Block Storage Volumes on the Fly"
date: 2018-12-19 00:59:11 -0500
comments: true
categories: ["hetzner", "xfs", "storage", "resize", "cloud"] 
---

![](https://user-images.githubusercontent.com/567298/50203557-96a01100-036a-11e9-8fd5-2953497f92d8.png)

Today we will be looking into Hetzner's Cloud Storage Volumes and how you can resize volumes on the fly!

## What is Hetzner's Cloud Storage Volumes

[Hetzner Cloud](https://www.hetzner.com/cloud) offers a fast, flexible, and cost-effective SSD based Block Storage which can be attach to your Hetzner Cloud Server. At this point in time its available in the Nuremberg and Helsinki regions.

## Resizing of Volumes

Volumes can be resized up to 10TB and the console allows you to resize in 1GB increments. You are allowed to increase, but cannot decrease.

## Demo through Cloud Volumes

Let's run through a demo, where we will do the following:

- Provision a Server
- Provision a Volume (XFS Filesystem / EXT4 is also optional)
- Inspect the Volume, do some performance testing
- Resize the Volume via Hetzner Cloud Console
- Grow the XFS Filesystem

After provisioning a server, which takes less than a minute, you should see that the server is created:

![](https://user-images.githubusercontent.com/567298/50202325-6f474500-0366-11e9-8e7d-e96f0c78beba.png)

SSH into your server. At this moment, we have not provisioned any volumes, so only the root partition should be mounted. Look at the block allocation:

```bash
$ lsblk
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sda      8:0    0 19.1G  0 disk
--sda1   8:1    0 19.1G  0 part /
sr0     11:0    1 1024M  0 rom
```

Have a look at the fstab:

```bash
cat /etc/fstab
# <file system> <mount point>   <type>  <options>       <dump>  <pass>
UUID=2f54e8e6-ff9c-497a-88ea-ce159f6cd283 /               ext4    discard,errors=remount-ro 0       1
/dev/fd0        /media/floppy0  auto    rw,user,noauto,exec,utf8 0       0
```

And have a look at the mounted disks layout:

```bash
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
udev            959M     0  959M   0% /dev
tmpfs           195M  652K  194M   1% /run
/dev/sda1        19G  1.6G   17G   9% /
tmpfs           973M     0  973M   0% /dev/shm
tmpfs           5.0M     0  5.0M   0% /run/lock
tmpfs           973M     0  973M   0% /sys/fs/cgroup
tmpfs           195M     0  195M   0% /run/user/0
```

Now, time to provision a Volume. Head over to the Volumes section:

![](https://user-images.githubusercontent.com/567298/50202468-dfee6180-0366-11e9-8e48-aaadeb707938.png)

I'm going ahead with creating a volume with 10GB of space and assign it to my server, and yeah that's right, 10GB of storage is 0,40 EUR per month, epic value for money!

![](https://user-images.githubusercontent.com/567298/50202502-fd233000-0366-11e9-9c71-475966488ca1.png)

After you volume is created, you should see similar output below:

![](https://user-images.githubusercontent.com/567298/50202614-5a1ee600-0367-11e9-97ab-8352d5b6f064.png)

Head back to your server, and have a look at the output when running the similar commands from earlier:

```bash
$ lsblk
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sda      8:0    0 19.1G  0 disk
--sda1   8:1    0 19.1G  0 part /
sdb      8:16   0   10G  0 disk /mnt/HC_Volume_1497823
sr0     11:0    1 1024M  0 rom
```

The fstab config:

```bash
$ cat /etc/fstab
# <file system> <mount point>   <type>  <options>       <dump>  <pass>
UUID=2f54e8e6-ff9c-497a-88ea-ce159f6cd283 /               ext4    discard,errors=remount-ro 0       1
/dev/fd0        /media/floppy0  auto    rw,user,noauto,exec,utf8 0       0
/dev/disk/by-id/scsi-0HC_Volume_1497823 /mnt/HC_Volume_1497823 xfs discard,nofail,defaults 0 0
```

The disk layout:

```bash
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
udev            959M     0  959M   0% /dev
tmpfs           195M  660K  194M   1% /run
/dev/sda1        19G  1.6G   17G   9% /
tmpfs           973M     0  973M   0% /dev/shm
tmpfs           5.0M     0  5.0M   0% /run/lock
tmpfs           973M     0  973M   0% /sys/fs/cgroup
tmpfs           195M     0  195M   0% /run/user/0
/dev/sdb         10G   43M   10G   1% /mnt/HC_Volume_1497823
```

We can see from the output above how easy it is to provision a volume to your Hetzner Cloud Server. And everything gets done for you, the disk is mounted and the `/etc/fstab` configuration is populated for you.

Time for some performance testing on the volume:

```bash
$ dd bs=2M count=256 if=/dev/zero of=/mnt/HC_Volume_1497823/test.dd
256+0 records in
256+0 records out
536870912 bytes (537 MB, 512 MiB) copied, 0.911306 s, 589 MB/s
```

Pretty neat right? :D

Let's resize the volume via the Hetzner Cloud Console to 20GB and resize the filesystem. From the Console, head over to the volumes section, select the more options and select resize:

![](https://user-images.githubusercontent.com/567298/50203010-bcc4b180-0368-11e9-86e8-653490ad6870.png)

After the volume has been resized, head back to your server and resize the filesystem. As we are using XFS Filesystem, we will use `xfs_growfs` :

```bash
$ xfs_growfs /dev/sdb
meta-data=/dev/sdb               isize=512    agcount=4, agsize=655360 blks
         =                       sectsz=512   attr=2, projid32bit=1
         =                       crc=1        finobt=1 spinodes=0 rmapbt=0
         =                       reflink=0
data     =                       bsize=4096   blocks=2621440, imaxpct=25
         =                       sunit=0      swidth=0 blks
naming   =version 2              bsize=4096   ascii-ci=0 ftype=1
log      =internal               bsize=4096   blocks=2560, version=2
         =                       sectsz=512   sunit=0 blks, lazy-count=1
realtime =none                   extsz=4096   blocks=0, rtextents=0
data blocks changed from 2621440 to 5242880
```

Have a look at the disk layout and see that the filesystem was resized on the fly. If you have applications writing/reading to and from that volume, its better to unmount it first.

```bash
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
udev            959M     0  959M   0% /dev
tmpfs           195M  660K  194M   1% /run
/dev/sda1        19G  2.1G   16G  12% /
tmpfs           973M     0  973M   0% /dev/shm
tmpfs           5.0M     0  5.0M   0% /run/lock
tmpfs           973M     0  973M   0% /sys/fs/cgroup
tmpfs           195M     0  195M   0% /run/user/0
/dev/sdb         20G  565M   20G   3% /mnt/HC_Volume_1497823
```

I must admit, I am really stoked with Hetzner's offerings and their performance. I've been hosting servers with them for the past 5 months and so far they really impressed me.

Have a look at [Hetzner Cloud's](https://www.hetzner.com/cloud) offerings, they have great prices as you can start off with a server from as little as 2.49 EUR per month, which gives you 1vCPU, 2GB of RAM, 20GB disk Space and 20TB of traffic. I mean, thats awesome value for money. They also offer Floating IP's, Backups, etc.

## Resources:

- [Hetzner Cloud's](https://www.hetzner.com/cloud) 
- [More info on Hetzner Volumes](https://wiki.hetzner.de/index.php/CloudServer/en#What_are_the_Hetzner_Cloud_Volumes.3F)
 

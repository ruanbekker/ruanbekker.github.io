---
layout: post
title: "Create a Logical Volume using LVM on Ubuntu"
date: 2018-03-30 20:38:18 -0400
comments: true
categories: ["lvm", "storage", "linux", "ubuntu"] 
---

Logical Volume Manager (LVM) - adds an extra layer between the physical disks and the file system, which allows you to resize your storage on the fly, use multiple disks, instead of one, etc.

## Concepts:

Physical Volume:
- Physical Volume represents the actual disk / block device.

Volume Group:
- Volume Groups combines the collection of Logical Volumes and Physical Volumes into one administrative unit. 

Logical Volume:
- A Logical Volume is the conceptual equivalent of a disk partition in a non-LVM system.

File Systems:
- File systems are built on top of logical volumes.

## What we are doing today:

We have a disk installed on our server which is 150GB that is located on `/dev/vdb`, which we will manage via LVM and will be mounted under `/mnt`

## Dependencies:

Update and Install LVM:

```
$ apt update && apt upgrade -y
$ apt install lvm2 -y
$ systemctl enable lvm2-lvmetad
$ systemctl start lvm2-lvmetad
```

## Create the Logical Volume:

Initialize the Physical Volume to be managed by LVM, then create the Volume Group, then go ahead to create the Logical Volume:

```
$ pvcreate /dev/vdb
$ vgcreate vg1 /dev/vdb
$ lvcreate -l 100%FREE -n vol1 vg1
```

Build the Linux Filesystem with ext4 and mount the volume to the `/mnt` partition:

```
$ mkfs.ext4 /dev/vg1/vol1
$ mount /dev/vg1/vol1 /mnt
$ echo '/dev/mapper/vg1-vol1 /mnt ext4 defaults,nofail 0 0' >> /etc/fstab
```

## Other useful commands:

To list Physical Volume Info:

```
$ pvs
PV         VG   Fmt  Attr PSize   PFree
/dev/vdb   vg1  lvm2 a--  139.70g    0

```

To list Volume Group Info:

```
$ vgs
VG   #PV #LV #SN Attr   VSize   VFree
vg1    1   1   0 wz--n- 139.70g    0

```

And viewing the logical volume size from the volume group:

```
$ vgs -o +lv_size,lv_name
VG   #PV #LV #SN Attr   VSize   VFree LSize   LV
vg1    1   1   0 wz--n- 139.70g    0  139.70g vol1
```

Information about Logical Volumes:

```
$ lvs
LV   VG   Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
vol1 vg1  -wi-ao---- 139.70g
```

## Resources:

- [1](https://www.thegeekdiary.com/redhat-centos-a-beginners-guide-to-lvm-logical-volume-manager/)

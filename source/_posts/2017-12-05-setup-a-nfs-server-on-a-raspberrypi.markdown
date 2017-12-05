---
layout: post
title: "Setup a NFS Server on a RaspberryPi"
date: 2017-12-05 10:45:35 -0500
comments: true
categories: ["nfs", "raspberypi", "linux"]
---

Setup a NFS Server/Client on RaspberryPi 3

## Setup the Server Side - Disks and Directories

Prepare the directories:

```bash
$ sudo mkdir -p /opt/nfs
$ sudo chown pi:pi /opt/nfs
$ sudo chmod 755 /opt/nfs
```

For demonstration, I will be using the same disk as my OS, but if you have other disks that you would like to mount, mount them like the following:

```bash
$ sudo lsblk
$ sudo mount /dev/sda2 /opt/nfs
$ sudo chown -R pi:pi /opt/nfs/existing_dirs
$ sudo find /opt/nfs/existing_dirs/ -type d -exec chmod 755 {} \;
$ sudo find /opt/nfs/existing_dirs/ -type f -exec chmod 644 {} \;
```

If you mounted the disk, and you would like to mount the disk on boot, we need to add it to our `/etc/fstab`. We can get the disk by running either:

```bash
$ sudo lsblk
# or
$ sudo blkid
```

Populate the `/etc/fstab` with your disk info, it will look more or less like:

```bash
/dev/sda2 /opt/nfs ext4 defaults,noatime 0 0
```

Append `rootdelay=10` after `rootwait` in `/boot/cmdline.txt`, then reboot for the changes to become active.

## Setup the Server Side - Installing NFS Server

Install the NFS Server packages:

```bash
$ sudo apt install nfs-kernel-server nfs-common rpcbind -y
```

Configure the paths in `/etc/exports`, we need to uid gid for the user that owns permission that we need to pass to the NFS Client. To get that:

```bash
$ id pi
uid=1000(pi) gid=1000(pi)
```

Setup our path that we would like to be accessible via NFS:

```bash
/opt/nfs 192.168.1.0/24(rw,all_squash,no_hide,insecure,async,no_subtree_check,anonuid=1000,anongid=1000)
```

If you would like to have open access:

```bash
/opt/nfs *(rw,all_squash,no_hide,insecure,async,no_subtree_check,anonuid=1000,anongid=1000)
```

Export the config, enable the services on boot and start NFS:

```bash
$ sudo exportfs -ra
$ sudo systemctl enable rpcbind
$ sudo systemctl enable nfs-kernel-server
$ sudo systemctl enable nfs-common
$ sudo systemctl start rpcbind
$ sudo systemctl start nfs-kernel-server
$ sudo systemctl start nfs-common
```

## Setup the NFS Client

On the client install the NFS Client packages:

```bash
$ sudo apt install nfs-common -y
```

Create the mountpoint of choice and change the ownership:

```bash
$ sudo chown pi:pi /mnt
```

Setup the `/etc/idmapd.conf` to match the user:

```
[Mapping]
Nobody-User = pi
Nobody-Group = pi
```

Mount the NFS Share to your local mount point:

```bash
$ sudo mount 192.168.1.2:/opt/nfs /mnt
```

Enable mount on boot via `/etc/fstab`:

```bash
192.168.1.2:/opt/nfs /mnt nfs rw 0 0
```

## Resources:

- [Great Resource on NFS](https://zsiti.eu/nfs-file-sharing-server-raspberry-pi/)

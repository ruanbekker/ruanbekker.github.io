---
layout: post
title: "Setup a NFS Server on Ubuntu"
date: 2018-02-11 17:26:56 -0500
comments: true
categories: ["storage", "nfs", "ubuntu", "networking"] 
---

Quick post on how to setup a NFS Server on Ubuntu and how to setup the client to interact with the NFS Server.

## Setup the Dependencies:

```bash
$ apt update && sudo apt upgrade -y
$ sudo apt-get install nfs-kernel-server nfs-common -y
```

Create the Directory for NFS and set permissions:

```bash
mkdir /vol
chown -R nobody:nogroup /vol
```

## Allow the Clients:

We need to set in the `exports` file, the clients we would like to allow:

- `rw`: Allows Client R/W Access to the Volume.
- `sync`: This option forces NFS to write changes to disk before replying. More stable and Consistent. Note, it does reduce the speed of file operations.
- `no_subtree_check`: This prevents subtree checking, which is a process where the host must check whether the file is actually still available in the exported tree for every request. This can cause many problems when a file is renamed while the client has it opened. In almost all cases, it is better to disable subtree checking.

```bash
$ echo '/vol 10.8.133.83(rw,sync,no_subtree_check) 10.8.166.19(rw,sync,no_subtree_check) 10.8.142.195(rw,sync,no_subtree_check)' >> /etc/exports
```

## Start the NFS Server:

Restart the service and enable the service on boot:

```bash
$ sudo systemctl restart nfs-kernel-server
$ sudo systemctl enable nfs-kernel-server
```

## Client Side:

We will mount the NFS Volume to our Clients `/mnt` partition.

Install the dependencies:

```bash
$ sudo apt-get install nfs-common -y
```

Test if we can mount the volume, then unmount it, as we will set the config in our `fstab`:

```bash
$ sudo mount 10.8.133.83:/vol /mnt
$ sudo umount /mnt
$ df -h
```

Set the config in your `fstab`, then mount it from there:

```bash
$ sudo bash -c "echo '10.8.133.83:/vol /mnt nfs auto,nofail,noatime,nolock,intr,tcp,actimeo=1800 0 0' >> /etc/fstab"
$ sudo mount -a
$ df -h
```

Now you shoule be able to write to your NFS Volume from your client.

Sources:
- [1](https://www.digitalocean.com/community/tutorials/how-to-set-up-an-nfs-mount-on-ubuntu-16-04) [2](https://gist.github.com/deviantony/557984d62e867e6f505577b207db6ffc%)

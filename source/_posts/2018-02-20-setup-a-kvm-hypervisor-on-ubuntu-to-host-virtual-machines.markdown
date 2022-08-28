---
layout: post
title: "Setup a KVM Hypervisor on Ubuntu to Host Virtual Machines"
date: 2018-02-20 06:21:56 -0500
comments: true
categories: ["kvm", "virtualization", "ubuntu", "vms", "linux", "alpine"] 
---

Today we will setup a KVM (Kernel Virtual Machine) Hypervisor, where we can host Virtual Machines. In order to do so, your host needs to Support Hardware Virtualization.

## What we will be doing today:

- Check if your host supports Hardware Virtualization
- Setup the KVM Hypervisor
- Setup a Alpine VM

## Check for Hardware Virtualization Support:

We will install the package required to do the check:

```bash
$ sudo apt update && sudo apt install cpu-checker -y
```

Once that is installed, run `kvm-ok` and if its supported, your output should look something like this:

```bash
$ kvm-ok
INFO: /dev/kvm exists
KVM acceleration can be used
```

## Installing KVM

Update your System and get the Packages required to Setup KVM:

```bash
$ sudo apt update && sudo apt upgrade -y
$ apt install bridge-utils qemu-kvm libvirt-bin virtinst -y
```

Add your user to the libvirtd group:

```bash
$ sudo usermod -G libvirtd $USER
```

Check that the libvirtd service is running:

```bash
$ sudo systemctl is-active libvirtd
active
```

You will also find that there is a new interface configured called `virbr0` in my case.

## Provision the Alpine VM and Setup OpenSSH:

Get the ISO:

- https://alpinelinux.org/downloads/

```bash
$ wget http://dl-cdn.alpinelinux.org/alpine/v3.7/releases/x86_64/alpine-virt-3.7.0-x86_64.iso
```

Provision the VM:

```bash
$ virt-install \
--name alpine1 \
--ram 256 \
--disk path=/var/lib/libvirt/images/alpine1.img,size=8 \
--vcpus 1 \
--os-type linux \
--os-variant generic \
--network bridge:virbr0,model=virtio \
--graphics none \
--console pty,target_type=serial \
--cdrom ./alpine-virt-3.7.0-x86_64.iso 
```

After this, you will be dropped into the console:

```bash
Starting install...
Allocating 'alpine1.img'                                                                                                           |   8 GB  00:00:01
Creating domain...                                                                                                                 |    0 B  00:00:00
Connected to domain alpine1
Escape character is ^]

ISOLINUX 6.04 6.04-pre1  Copyright (C) 1994-2015 H. Peter Anvin et al
boot:

   OpenRC 0.24.1.a941ee4a0b is starting up Linux 4.9.65-1-virthardened (x86_64)

Welcome to Alpine Linux 3.7
Kernel 4.9.65-1-virthardened on an x86_64 (/dev/ttyS0)

localhost login:
```

Login with the `root` user and no password, then setup the VM by running `setup-alpine`:

```bash
localhost login: root
Welcome to Alpine!

localhost:~# setup-alpine
```

After completing the prompts reboot the VM by running `reboot`, then you will be dropped out of the console. Check the status of the reboot:

```bash
$ virsh list
 Id    Name                           State
----------------------------------------------------
 2     alpine1                        running
```

As we can see our guest is running, lets console to our guest, provide the root user and password that you provided during the setup phase:

```bash
$ virsh console 2
Connected to domain alpine1
Escape character is ^]

alpine1 login: root
Password:
Welcome to Alpine!
```

Setup OpenSSH so that we can SSH to our guest over the network:

```bash
$ apk update
$ apk add openssh
```

Configure SSH to accept Root Passwords, this is not advisable for production environments, but for testing this is okay. For Production servers, we will rather look at Key Based Authentication etc.

```bash
$ sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/g' /etc/ssh/sshd_config
$ /etc/init.d/sshd restart
```

Get the IP Address:

```
$ ifconfig
eth0      Link encap:Ethernet  HWaddr 52:54:00:D0:48:0C
          inet addr:192.168.122.176  Bcast:192.168.122.255  Mask:255.255.255.0
          inet6 addr: fe80::5054:ff:fed0:480c/64 Scope:Link
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:55 errors:0 dropped:28 overruns:0 frame:0
          TX packets:34 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000
          RX bytes:4545 (4.4 KiB)  TX bytes:3345 (3.2 KiB)
```

Exit the guest by running `exit` and `Ctrl + ]` to exit the console session. 

Now SSH to your Alpine VM:

```bash
$ ssh root@192.168.122.176
root@192.168.122.176's password:
Welcome to Alpine!
```

## Some Useful Commands:

List Running VMs:

```
$ virsh list
 Id    Name                           State
----------------------------------------------------
 3     alpine1                        running
```

Shutdown a VM:

```bash
$ virsh shutdown alpine1
Domain alpine1 is being shutdown
```

List all VMs:

```bash
$ virsh list --all
 Id    Name                           State
----------------------------------------------------
 -     alpine1                        shut off
```

Delete a VM:

```bash
$ virsh shutdown alpine1 #or to force shutdown:
$ virsh destroy alpine1
$ virsh undefine alpine1
```

Any future KVM posts will be tagged under [KVM](http://blog.ruanbekker.com/blog/categories/kvm?source_site=blog.ruanbekker.com?source_category=kvm) and Alpine posts will be available under the [Alpine](http://blog.ruanbekker.com/blog/categories/alpine?source_site=blog.ruanbekker.com?source_category=kvm) tag.

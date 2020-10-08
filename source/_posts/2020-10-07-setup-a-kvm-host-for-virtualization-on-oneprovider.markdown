---
layout: post
title: "Setup a KVM Host for Virtualization on OneProvider"
date: 2020-10-07 23:31:43 +0000
comments: true
categories: ["kvm", "oneprovider", "virtualization"] 
---

I've been on the hunt for a hobby dedicated server for a terraform project, where I'm intending to use the [libvirt provider](https://github.com/dmacvicar/terraform-provider-libvirt) and found one awesome provider that offers amazingly great prices.

At [oneprovider.com](https://oneprovider.com/dedicated-servers), they offer dedicated servers for great prices and they offer a huge number of locations. So I decided to give them a go and ordered a dedicated server in Amsterdam, Netherlands:

![cheap-dedicated-servers](https://user-images.githubusercontent.com/567298/95398393-e9630800-0905-11eb-8277-79f13393187c.png)

I went for a 4GB DDR3 RAM, Atom C2350 2 Cores CPU with 128GB SSD and 1Gbps unmetered bandwidth for $7.30 a month, which is super cheap and more than enough for a hobby project:

![image](https://user-images.githubusercontent.com/567298/95398413-f7188d80-0905-11eb-9250-6368ea92b873.png)

I've been using them for the last week and super impressed.

## What are we doing

As part of my Terraform project, I would like to experiment with the libvirt provisioner to provision KVM instances, I need a dedicated server with KVM installed, and in this guide we will install KVM and create a dedicated user that we will use with Terraform.

## Install KVM

Once your server is provisioned, SSH to your dedicated server and install `cpu-checker` to ensure that we are able to install KVM:

```
$ $ apt update && apt upgrade -y
$ apt install cpu-checker -y
```

Test using `kvm-ok`:

```
$ kvm-ok
INFO: /dev/kvm exists
KVM acceleration can be used
```

On a client pc, generate the SSH key that we will use to authenticate with on our KVM host:

```
$ ssh-keygen -t rsa -C deploys -f ~/.ssh/deploys.pem
```

Back on the server, create the user and prepare the ssh directory:

```
$ useradd -m -s /bin/bash deploys
$ mkdir /home/deploys/.ssh
$ touch /home/deploys/.ssh/authorized_keys
```

On the client PC where you generated your SSH key, copy the public key:

```
$ cat ~/.ssh/deploys.pem.pub| pbcopy
```

Paste your public key to the servers authorized_keys file:

```
$ vim /home/deploys/.ssh/authorized_keys
# paste the public key contents and save
```

Update the content below with the correct permissions:

```
$ chown -R deploys:deploys /home/deploys
$ chmod 755 /home/deploys/.ssh
$ chmod 644 /home/deploys/.ssh/authorized_keys
```

Install KVM on the host:

```
$ apt install bridge-utils qemu-kvm libvirt-bin virtinst -y
```

Add our dedicated user to the libvirt group:

```
$ usermod -G libvirt deploys
```

Create the directory where we will store our vm's disks:

```
$ mkdir -p /opt/kvm
```

And apply ownership permissions for our user and group:

```
$ chown -R deploys:libvirt /opt/kvm
```

I ran into a permission denied issue using terraform and the dedicated user, and to resolve I had to ensure that the `security_driver` is set to `none` in `/etc/libvirt/qemu.conf`:

```
$ vim /etc/libvirt/qemu.conf
```

and update the following:

```
security_driver = "none"
```

Then restart libvirtd:

```
$ sudo systemctl restart libvirtd 
```

## Test KVM

Switch to the `deploys` user:

```
$ sudo su - deploys
```

And list domains using `virsh`:

```
$ virsh list
 Id    Name                           State
----------------------------------------------------
```

## Thank You

That's it, now we have a KVM host that allows us to provision VM's. In the next post we will install terraform and the libvirt provisioner for terraform to provision a vm and use ansible to deploy software to our vm.

[![Say Thanks!](https://img.shields.io/badge/Say%20Thanks-!-1EAEDB.svg)](https://saythanks.io/to/ruan.ru.bekker@gmail.com) 

Thanks for reaching out to me, check out my <strong><a href="" rel="nofollow" target="_blank">website</a></strong> or follow me at <strong><a href="https://twitter.com/ruanbekker" rel="nofollow" target="_blank">@ruanbekker</a></strong> on Twitter.

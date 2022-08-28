---
layout: post
title: "Use Vagrant to Setup a Local Development Environment on Linux"
date: 2019-05-30 15:14:15 -0400
comments: true
categories: ["vagrant", "development"] 
---

![vagrant](https://user-images.githubusercontent.com/567298/58658188-37cec280-8320-11e9-90ca-1226b3ccb292.png)

**[Vagrant!](https://www.vagrantup.com)** Another super product from Hashicorp.

Vagrant makes it really easy to provision virtual servers, which they refer as "boxes", that enables developers to run their jobs/tasks/applications in a really easy and fast way. Vagrant utilizes a declarative configuration model, so you can describe which OS you want, bootstrap them with installation instructions as soon as it boots, etc.

## What are we doing today?

When completing this tutorial, you should be able to launch a Ubuntu Virtual Server locally with Vagrant and using the Virtualbox Provider which will be responsible for running our VM's.

I am running this on a Ubuntu 19 Desktop, but you can run this on Mac/Windows/Linux. First we will install Virtualbox, then Vagrant, then we will provision a Ubuntu box and I will also show how to inject shell commands into your Vagrantfile so that you can provision software to your VM, and also forward traffic to a web server through your host to the guest.

## Virtualbox

Install some pre-requirements:

```
$ sudo apt-get install dkms build-essential linux-headers-`uname -r`
```

Head over to Virtualbox's [download page](https://www.virtualbox.org/wiki/Downloads) and grab the latest version of virtualbox and install it.

After the installation run `vboxconfig` to build the kernel modules. If you get the error that I received as seen below:

```
$ sudo /sbin/vboxconfig

vboxdrv.sh: Building VirtualBox kernel modules
vboxdrv.sh: Starting VirtualBox services
vboxdrv.sh: Building VirtualBox kernel modules
vboxdrv.sh: failed: modprobe vboxdrv failed. Please use 'dmesg' to find out why
```

This [resource on askubuntu.com](https://askubuntu.com/questions/900118/vboxdrv-sh-failed-modprobe-vboxdrv-failed-please-use-dmesg-to-find-out-why) helped me out. In short, theres a requirement that all the kernel modules must be signed by a key trusted by the UEFI system.

To resolve:

```
$ sudo apt-get install linux-headers-generic build-essential dkms
$ sudo apt-get remove --purge virtualbox-dkms
$ sudo apt-get install virtualbox-dkms

$ openssl req -new -x509 -newkey rsa:2048 -keyout MOK.priv -outform DER -out MOK.der -nodes -days 36500 -subj "/CN=Descriptive common name/"
$ sudo /usr/src/linux-headers-$(uname -r)/scripts/sign-file sha256 ./MOK.priv ./MOK.der $(modinfo -n vboxdrv)
$ sudo mokutil --import MOK.der
```

Remember the password, as you will require it when you reboot. You will get the option to "Enroll MOK", select that, enter the initial password and reboot. 

```
$ sudo reboot
```

You should be able to get a response from the binary:

```
$ VirtualBox -h
Oracle VM VirtualBox VM Selector v6.0.6_Ubuntu
```

## Install Vagrant

Head over to Vagrant's [installation page](https://www.vagrantup.com/docs/installation/), get the latest version for your operating system and install it.

After installing it you should get the following response:

```
$ vagrant --version
Vagrant 2.2.4
```

## Provision a Box with Vagrant

When you head over to [app.vagrantup.com/boxes/search](https://app.vagrantup.com/boxes/search) you can select the pre-packed operating system of your choice. As for this demonstration, I went with: `ubuntu/trusty64`

First we will need to initialize a new Vagrant environment by creating a Vagrantfile, as we will be passing the name of our operating system, it will be populated in our Vagrantfile:

```
$ vagrant init ubuntu/trusty64

A `Vagrantfile` has been placed in this directory. You are now
ready to `vagrant up` your first virtual environment! Please read
the comments in the Vagrantfile as well as documentation on
`vagrantup.com` for more information on using Vagrant.
```

Now since the Vagrantfile has been placed in our current working directory, let's have a look at it:

```
$ cat Vagrantfile
# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/trusty64"
  # config.vm.network "forwarded_port", guest: 80, host: 8080
  # config.vm.network "forwarded_port", guest: 80, host: 8080, host_ip: "127.0.0.1"
  # config.vm.network "private_network", ip: "192.168.33.10"
  # config.vm.network "public_network"
  # config.vm.synced_folder "../data", "/vagrant_data"
  #
  # config.vm.provider "virtualbox" do |vb|
  #   vb.gui = true
  #   vb.memory = "1024"
  # end
  #
  # config.vm.provision "shell", inline: <<-SHELL
  #   apt-get update
  #   apt-get install -y apache2
  # SHELL
end
```

As you can see the Vagrantfile has a set of instructions of how we want our VM to be. At this moment you will only see that the image is defined as `ubuntu/trusty64`.

Let's start our VM:

```
$ vagrant up

Bringing machine 'default' up with 'virtualbox' provider...
==> default: Importing base box 'ubuntu/trusty64'...
==> default: Matching MAC address for NAT networking...
==> default: Checking if box 'ubuntu/trusty64' version '20190429.0.1' is up to date...
==> default: Setting the name of the VM: vagrant_default_1559238982328_97737
==> default: Clearing any previously set forwarded ports...
    default: Adapter 1: nat
==> default: Forwarding ports...
    default: 22 (guest) => 2222 (host) (adapter 1)
==> default: Booting VM...
==> default: Waiting for machine to boot. This may take a few minutes...
    default: SSH address: 127.0.0.1:2222
    default: SSH username: vagrant
    default: SSH auth method: private key
    default:
    default: Vagrant insecure key detected. Vagrant will automatically replace
    default: this with a newly generated keypair for better security.
```

Now that our VM has been booted, we can ssh to our server by simply running:

```
$ vagrant ssh
ubuntu-server $
```

## Making changes to your config

So let's say we want to edit our Vagrantfile to provide shell commands to install nginx and forward our host port 8080 to our guest port 80, so that we can access our VM's webserver on localhost using port 8080.

Edit your Vagrantfile so that it looks like this:

```ruby
Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.network "forwarded_port", guest: 80, host: 8080
  config.vm.provision "shell", inline: <<-SHELL
    apt-get update
    apt-get install nginx -y
  SHELL
end
```

In order to call the shell activity we need to call the provision argument:

```
$ vagrant provision
```

That will install nginx to our VM, then call reload to change to port configuration:

```
$ vagrant reload
```

Now that everything is in order, we can access our nginx web server:

```
$ curl -i http://localhost:8080
HTTP/1.1 200
Server: nginx
..
```

## Tear down

Delete the server by running:

```
$ vagrant destroy
```

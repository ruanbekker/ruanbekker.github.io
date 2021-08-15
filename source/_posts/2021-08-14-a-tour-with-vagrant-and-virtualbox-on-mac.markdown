---
layout: post
title: "A Tour with Vagrant and Virtualbox on Mac"
date: 2021-08-14 13:41:32 -0400
comments: true
categories: ["vagrant", "virtualbox", "mac", "docker", "ansible"]
---

![vagrant](https://user-images.githubusercontent.com/567298/58658188-37cec280-8320-11e9-90ca-1226b3ccb292.png)

[Vagrant](https://www.vagrantup.com/), yet another amazing product from [Hashicorp](https://www.hashicorp.com/).

Vagrant makes it really easy to provision virtual servers for local development (not limited to), which they refer as "boxes", that enables developers to run their jobs/tasks/applications in a really easy and fast way. Vagrant utilizes a declarative configuration model, so you can describe which OS you want, bootstrap them with installation instructions as soon as it boots, etc.

## What are we doing today?

When completing this tutorial, you will have Vagrant and Virtualbox installed on your Mac and should be able to launch a Ubuntu Virtual Server locally with Vagrant and using the Virtualbox provider which will be responsible for running our VM's.

We will also look at different configuration options to configure the VM, bootstrapping software, using the shell, docker and ansible provisioner.

For this demonstration, I am using a Mac OSX, but you can run this on Mac, Windows or Linux. First we will use Homebrew to install Virtualbox, then Vagrant, then we will provision a Ubuntu box and I will also show how to inject shell commands into your Vagrantfile so that you can provision software to your VM, and also forward traffic to a web server from the host to the guest.

If you are looking for a Linux version instead of mac, you can look at this post:
* [Use Vagrant to Setup a Local Development Environment on Linux](https://blog.ruanbekker.com/blog/2019/05/30/use-vagrant-to-setup-a-local-development-environment-on-linux/)

## Pre-Requisites

I will be installing Vagrant and Virtualbox with Homebrew, if you do not have homebrew installed, you can install homebrew with:

```bash
$ ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

Once homebrew is installed, it's a good thing to update the indexes:

```bash
$ brew update
```

## Virtualbox

Install [VirtualBox](https://www.virtualbox.org/) using homebrew:

```bash
$ brew install --cask virtualbox
```

## Vagrant

Install [Vagrant](https://www.vagrantup.com/) using homebrew:

```bash
$ brew install --cask vagrant
```

Install the virtualbox guest additions plugin for vagrant:

```bash
$ vagrant plugin install vagrant-vbguest
```

If you would like a vagrant manager utility to help you manage your vagrant boxes, you can install [vagrant-manager](http://www.vagrantmanager.com/) using homebrew:

```bash
$ brew install --cask vagrant-manager
```

## Create your first Vagrant Box

From [app.vagrantup.com/boxes/search](https://app.vagrantup.com/boxes/search) you can search for any box, such as ubuntu, centos, alpine etc and for this demonstration I am going with [ubuntu/focal64](https://app.vagrantup.com/ubuntu/boxes/focal64).

I am creating a new directory for my devbox:

```bash
$ mkdir devbox 
$ cd devbox
```

Then initialize the Vagrantfile by running:

```bash
$ vagrant init ubuntu/focal64
```

A `Vagrantfile` has been created in the current working directory:

```
$ cat Vagrantfile | grep -v "#"

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/focal64"
end
```

Boot the VM:

```bash
$ vagrant up
```

The box should now be in a started state, and we can verify that by running:

```bash
$ vagrant status
Current machine states:

default                   running (virtualbox)
```

We can now SSH to our VM by running:

```bash
$ vagrant ssh
vagrant@ubuntu-focal:~$
```

## Installing Software with Vagrant

First let's destroy the VM that we created:

```bash
$ vagrant destroy --force
```

Then edit the `Vagrantfile` and add the commands that we want to be executed when the VM boots, in our case, installing Nginx:

```ruby
Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/focal64"
  config.vm.network "forwarded_port", guest: 80, host: 8080
  config.vm.provision "shell", inline: <<-SHELL
     apt update
     apt install nginx -y
  SHELL
end
```

You will also notice that we are forwarding port 8080 from our host, to port 80 on the VM so that we can access the webserver on port 8080 from our laptop. Then boot the VM:

```
$ vagrant up
```

Once the VM has booted and installed our software, we should be able to access the index document served by Nginx on our VM:

```bash
$ curl -I http://localhost:8080/

HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Sat, 14 Aug 2021 18:11:59 GMT
Content-Type: text/html
Content-Length: 612
Last-Modified: Sat, 14 Aug 2021 18:11:10 GMT
Connection: keep-alive
ETag: "6118073e-264"
Accept-Ranges: bytes
```

## Shared Folders

Let's say you want to map your local directory to your VM, in a scenario where you want to store your `index.html` on your laptop and map it to the VM, we can use `config.vm.synced_folder`.

On our laptop, create a `html` directory where we will store our `index.hml`:

```
$ mkdir html
```

Now create the content in the `index.html` under the `html` directory:

```
$ echo "Hello, World" > html/index.html
```

Now we need to make vagrant aware of the folder that we are mapping to the VM, so we need to edit the `Vagrantfile` and it will now look like this:

```ruby
# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/focal64"
  config.vm.network "forwarded_port", guest: 80, host: 8080
  config.vm.provision "shell", inline: <<-SHELL
     apt update
     apt install nginx -y
  SHELL
  config.vm.synced_folder "html", "/var/www/html"
end
```

To reload the VM with our changes, we use `vagrant provision` to update our VM when changes to provisioners are made, and `vagrant reload` when we have config changes such as `config.vm.network`, but to restart the VM and forcing provisioners to run, we can use the following: 

Thanks [@joshva_jebaraj](https://twitter.com/joshva_jebaraj)

```bash
$ vagrant reload --provision
```

Once the VM is up, we can verify the changes:

```
$ curl http://localhost:8080/
Hello, World
```

Now we can edit our content locally which is synced to our VM.

## Setting Hostname and Configure Memory

We can also configure the hostname of our VM and configure the amount of memory that we want to allocate to our VM using:

* `config.vm.hostname`
* `vb.memory`

An example of that will look like the following:

```ruby
# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/focal64"
  config.vm.hostname = "mydevbox"
  config.vm.network "forwarded_port", guest: 80, host: 8080
  config.vm.provision "shell", inline: <<-SHELL
     apt update
     apt install nginx -y
  SHELL
  config.vm.synced_folder "html", "/var/www/html"
  config.vm.provider "virtualbox" do |vb|
    vb.memory = "1024"
  end
end
````

In this example our VM's hostname is `mydevbox` and we assigned 1024MB of memory to our VM.

## Provisioners: Shell

We can also run scripts from our local directory on our laptop on our VM using the [shell provisioner](https://www.vagrantup.com/docs/provisioning/shell). 

First we need to create the script on our local directory:

```bash
$ cat bootstrap.sh
#!/usr/bin/env bash
set -x
echo "my hostname is $(hostname)"
```

Then in our `Vagrantfile` we inform vagrant to execute the shell script:

```ruby
# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/focal64"
  config.vm.hostname = "mydevbox"
  config.vm.provision :shell, :path => "bootstrap.sh"
end
```

Since my VM is already running, I will be doing a `reload`:

```bash
$ vagrant reload --provision
...
==> default: Running provisioner: shell...
    default: Running: /var/folders/04/r10yvb8d5dgfvd167jz5z23w0000gn/T/vagrant-shell20210814-70233-1p9dump.sh
    default: ++ hostname
    default: my hostname is mydevbox
    default: + echo 'my hostname is mydevbox'
```

As you can see the shell script from our local directory was executed on our VM, you can use this method to automate installations as well, etc.

## Provisioners: Docker

Vagrant offers a [docker provisioner](https://www.vagrantup.com/docs/provisioning/docker), and for this example we will be hosting a mysql server using docker container in our VM.

Our `Vagrantfile`:

```ruby
# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/focal64"
  config.vm.hostname = "mydevbox"
  config.vm.network "forwarded_port", guest: 3306, host: 3306
  config.vm.provision "docker" do |d|
    d.run "mysql", image: "mysql:8.0",
      args: "-p 3306:3306 -e MYSQL_ROOT_PASSWORD=password"
  end
end
```

Since I don't have port `3306` listening locally, I have mapped port `3306` from my laptop to port `3306` on my VM and I am using the `mysql:8.0` container image from docker hub and passing the arguments which is specific to the container.

The convenient thing about the docker provisioner, is that it will install docker onto the VM for you.

Once the config has been set in your `Vagrantfile` do a reload:

```bash
$ vagrant reload --provision
...
    default: /vagrant => /Users/ruanbekker/workspace/vagrant/devbox
==> default: Running provisioner: docker...
    default: Installing Docker onto machine...
==> default: Starting Docker containers...
==> default: -- Container: mysql
```

From our laptop we should be able to communicate with our mysql server:

```bash
$ nc -vz localhost 3306
found 0 associations
found 1 connections:
     1:	flags=82<CONNECTED,PREFERRED>
	outif lo0
	src 127.0.0.1 port 58745
	dst 127.0.0.1 port 3306
	rank info not available
	TCP aux info available

Connection to localhost port 3306 [tcp/mysql] succeeded!
```

We can also SSH to our VM and verify if the container is running:

```bash
$ vagrant ssh
```

And then list the containers:

```bash
$  docker ps
CONTAINER ID   IMAGE       COMMAND                  CREATED         STATUS         PORTS                                                  NAMES
30a843a486ae   mysql:8.0   "docker-entrypoint.sh    2 minutes ago   Up 2 minutes   0.0.0.0:3306->3306/tcp, :::3306->3306/tcp, 33060/tcp   mysql
```

## Provisioners: Ansible

We can also execute [Ansible](https://www.ansible.com/) playbooks on our VM using the [Ansible Provisioner](https://www.vagrantup.com/docs/provisioning/ansible).

Something to note is that we use `ansible` to execute the playbook on the host, and `ansible_local` to execute the playbook on the VM.

First we will create our [project structure](https://docs.ansible.com/playbooks_best_practices.html#directory-layout) for ansible, so that we have the following in place:

```bash
.
Vagrantfile
provisioning/playbook.yml
provisioning/group_vars/all
```

Create the `provisioning` directory:

```bash
$ mkdir provisioning
```

Then the content for our `provisioning/playbook.yml` playbook:

```yaml
---
- hosts: all
  become: yes
  tasks:
    - name: ensure ntpd is at the latest version
      apt:
        pkg: ntp
        state: "{{ desired_state }}"
      notify:
      - restart ntpd
  handlers:
    - name: restart ntpd
      service:
        name: ntp
        state: restarted
```

Our `provisioning/group_vars/all` file that will contain the variables for the all group:

```yaml
desired_state: "latest"
```

In our `Vagrantfile`:

```ruby
# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/focal64"
  config.vm.hostname = "mydevbox"
  config.vm.provision :ansible do |ansible|
    ansible.playbook = "provisioning/playbook.yml"
  end
end
```

When using ansible with vagrant the inventory is [auto-generated](https://www.vagrantup.com/docs/provisioning/ansible_intro#auto-generated-inventory) when then inventory is not specified. Vagrant will store the inventory on the host at `.vagrant/provisioners/ansible/inventory/vagrant_ansible_inventory`.

To execute playbooks with ansible, we need ansible installed on our host machine, for this demonstration I will be using virtualenv and then install ansible using pip:

```bash
$ python3 -m pip install virtualenv
$ virtualenv -p $(which python3) .venv
$ source .venv/bin/activate
$ pip install ansible
```

Now that we have ansible installed, reload the VM to execute the playbook on our VM:

```bash
$ vagrant reload --provision
...
==> default: Running provisioner: ansible...
    default: Running ansible-playbook...

PLAY [all] *********************************************************************

TASK [Gathering Facts] *********************************************************
ok: [default]

TASK [ensure ntpd is at the latest version] ************************************
ok: [default]

PLAY RECAP *********************************************************************
default                    : ok=2    changed=0    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
```

Pretty neat right?

## Tear Down

To destroy the VM:

```bash
$ vagrant destroy --force
```

## Resources

For more information on vagrant, check out their documentation:

- https://www.vagrantup.com/docs

On provisioning documentation:

- https://www.vagrantup.com/docs/provisioning/shell
- https://www.vagrantup.com/docs/provisioning/docker
- https://www.vagrantup.com/docs/provisioning/ansible_intro

I have a couple of example `Vagrantfile`s available on my github repository:

- https://github.com/ruanbekker/vagrantfiles

## Thank You

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.

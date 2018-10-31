---
layout: post
title: "How to Install Packages on Remote Systems with Ansible"
date: 2018-10-31 01:28:18 -0400
comments: true
categories: ["ansible", "ansible-tutorial", "devops", "linux"] 
---

We will use Ansible to deploy packages to remote systems and in this case all the remote systems are running Debian, therefore we will be using the APT package manager.

## Pre-Requisites:

Ensure that you have installed Ansible and setup the SSH Config for your remote systems, how to do that can be found under the post: [setting up ansible](https://blog.ruanbekker.com/blog/2018/07/08/getting-started-with-ansible-on-ubuntu/)

## Our Inventory

The inventory file that describes our hosts:

```bash inventory.ini
[scaleway]
cluster-node-1
cluster-node-2

[hetzner]
docker-node-1
docker-node-2
docker-node-3
glusterfs-node-1
glusterfs-node-2
elasticsearch-node-1
elasticsearch-node-2

[scaleway:vars]
ansible_python_interpreter=/usr/bin/python3
location=france

[hetzner:vars]
ansible_python_interpreter=/usr/bin/python3
location=germany
```

## Playbook

Our playbook that we will define that we want to deploy packages using apt to all hosts:

```bash packages.yml
---
- hosts: all
  tasks:
  - name: Install Packages
    apt: name={{ item }} state=latest update_cache=yes
    with_items:
      - ntp
      - python
      - tcpdump
      - wget
      - openssl
      - curl
```

## Deploy

Running the playbook to deploy the packages to the remote servers:

```bash
$ ansible-playbook -i inventory.ini packages.yml

PLAY [all] ***********************************************************************************************************************************************************************************************

TASK [Gathering Facts] ***********************************************************************************************************************************************************************************
ok: [glusterfs-node-2]
ok: [glusterfs-node-1]
ok: [docker-node-1]
ok: [docker-node-2]
ok: [docker-node-3]
ok: [elasticsearch-node-1]
ok: [elasticsearch-node-2]
ok: [cluster-node-1]
ok: [cluster-node-2]

TASK [Install Packages] **********************************************************************************************************************************************************************************
changed: [docker-node-1] => (item=[u'ntp', u'python', u'tcpdump', u'wget', u'openssl', u'curl'])
changed: [docker-node-2] => (item=[u'ntp', u'python', u'tcpdump', u'wget', u'openssl', u'curl'])
changed: [docker-node-3] => (item=[u'ntp', u'python', u'tcpdump', u'wget', u'openssl', u'curl'])
changed: [elasticsearch-node-1] => (item=[u'ntp', u'python', u'tcpdump', u'wget', u'openssl', u'curl'])
changed: [glusterfs-node-1] => (item=[u'ntp', u'python', u'tcpdump', u'wget', u'openssl', u'curl'])
changed: [glusterfs-node-2] => (item=[u'ntp', u'python', u'tcpdump', u'wget', u'openssl', u'curl'])
changed: [elasticsearch-node-2] => (item=[u'ntp', u'python', u'tcpdump', u'wget', u'openssl', u'curl'])
ok: [cluster-node-1] => (item=[u'ntp', u'python', u'tcpdump', u'wget', u'openssl', u'curl'])
ok: [cluster-node-2] => (item=[u'ntp', u'python', u'tcpdump', u'wget', u'openssl', u'curl'])

PLAY RECAP ***********************************************************************************************************************************************************************************************
docker-node-1              : ok=2    changed=1    unreachable=0    failed=0
docker-node-2              : ok=2    changed=1    unreachable=0    failed=0
docker-node-3              : ok=2    changed=1    unreachable=0    failed=0
elasticsearch-node-1       : ok=2    changed=1    unreachable=0    failed=0
elasticsearch-node-2       : ok=2    changed=1    unreachable=0    failed=0
glusterfs-node-1           : ok=2    changed=1    unreachable=0    failed=0
glusterfs-node-2           : ok=2    changed=1    unreachable=0    failed=0
cluster-node-1             : ok=2    changed=0    unreachable=0    failed=0
cluster-node-2             : ok=2    changed=0    unreachable=0    failed=0
```

This is it for this post, all posts for this tutorial will be posted under [#ansible-tutorials](http://blog.ruanbekker.com/blog/categories/ansible-tutorial)


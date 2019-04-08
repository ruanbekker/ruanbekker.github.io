---
layout: post
title: "Install Elasticsearch with Ansible Tutorial"
date: 2019-04-06 15:45:09 -0400
comments: true
categories: ["elasticsearch", "ansible", "devops"]
---

![](https://user-images.githubusercontent.com/567298/55700285-f3cdda00-59ce-11e9-9c00-a05b9d469e23.png)

In this tutorial we will install a elasticsearch cluster with ansible (well rather a node)

Our inventory:

```
$ cat inventory.ini
[newes]
esnewnode

[newes:vars]
ansible_python_interpreter=/usr/bin/python3
```

Our playbook to bootstrap our nodes with Python:

```
$ cat bootstrap-python.yml
---
- hosts: newes
  gather_facts: False

  tasks:
  - name: install python
    raw: test -e /usr/bin/python || ( apt update && apt install python -y )
```

Our playbook to provision users:

```
$ cat provision-users.yml
---
# Provisions User on Nodes
# Setup Passwordless SSH from Jumpbox
# Install Packages using APT
- name: bootstrap python
  hosts: newes
  roles:
    - bootstrap-python

- name: setup pre-requisites
  hosts: newes
  roles:
    - create-sudo-user
    - install-modules
    - configure-hosts-file

#- name: setup ruan user on the nodes
#  become: yes
#  become_user: ruan
#  hosts: admin
#  roles:
#    - configure-admin

- name: copy public key to nodes
  become: yes
  become_user: ruan
  hosts: newes
  roles:
    - copy-keys

- name: install elasticsearch
  hosts: newes
  roles:
    - elasticsearch
```

Our roles that will be included in our playbooks from above:

```
$ cat roles/create-sudo-user/tasks/main.yml
---
- name: Create Sudo User
  user: name=ruan
        groups=sudo
        shell=/bin/bash
        generate_ssh_key=no
        state=present

- name: Set Passwordless SSH Access for ruan user
  copy: src=sudoers
        dest=/etc/sudoers.d
        mode=0440
```

Sudoers file for the create sudo role:

```
$ cat roles/create-sudo-user/files/sudoers
ruan ALL=(ALL) NOPASSWD:ALL
```

The role to install all the apt packages:

```
$ cat roles/install-modules/tasks/main.yml
---
- name: Install Packages
  apt: name={{ item }} state=latest update_cache=yes
  with_items:
    - apt-transport-https
    - ntp
    - python
    - tcpdump
    - wget
    - openssl
    - curl
```

Role to configure hosts file:

```
$ cat roles/configure-hosts-file/tasks/main.yml
---
- name: Configure Hosts File
  lineinfile: path=/etc/hosts regexp='.*{{ item }}$' line="{{ hostvars[item].ansible_default_ipv4.address }} {{item}}" state=present
  when: hostvars[item].ansible_default_ipv4.address is defined
  with_items: "{{ groups['newes'] }}"
```

The role to copy the ssh keys:

```
$ cat roles/copy-keys/tasks/main.yml
---
- name: Copy Public Key to Other Hosts
  become: true
  become_user: ruan
  copy:
    src: /tmp/id_rsa.pub
    dest: /tmp/id_rsa.pub
    mode: 0644
- name: Append Public key in authorized_keys file
  authorized_key:
    user: ruan
    state: present
    key: "{{ lookup('file', '/tmp/id_rsa.pub') }}"
```

The role to install elasticsearch:

```
$ cat roles/elasticsearch/tasks/main.yml
---
- name: get apt repo key
  apt_key:
    url: https://artifacts.elastic.co/GPG-KEY-elasticsearch
    state: present

- name: install apt repo
  apt_repository:
    repo: deb https://artifacts.elastic.co/packages/6.x/apt stable main
    state: present
    filename: elastic-6.x.list
    update_cache: yes

- name: install java
  apt:
    name: openjdk-8-jre
    state: present
    update_cache: yes

- name: install elasticsearch
  apt:
    name: elasticsearch
    state: present
    update_cache: yes

- name: reload systemd config
  systemd: daemon_reload=yes

- name: enable service elasticsearch and ensure it is not masked
  systemd:
    name: elasticsearch
    enabled: yes
    masked: no

- name: ensure elasticsearch is running
  systemd: state=started name=elasticsearch
```

## Deploy Elasticsearch

Bootstrap python then deploy elasticsearch:

```
$ ansible-playbook -i inventory.ini -u root bootstrap-python.yml
$ ansible-playbook -i inventory.ini -u root provision-users.yml
```

Test out elasticsearch:

```
$ curl http://127.0.0.1:9200/
{
  "name" : "Z52AEZ7",
  "cluster_name" : "elasticsearch",
  "cluster_uuid" : "fUiYVjsSQpCbo9QKEiuvaA",
  "version" : {
    "number" : "6.3.0",
    "build_flavor" : "default",
    "build_type" : "deb",
    "build_hash" : "424e937",
    "build_date" : "2018-06-11T23:38:03.357887Z",
    "build_snapshot" : false,
    "lucene_version" : "7.3.1",
    "minimum_wire_compatibility_version" : "5.6.0",
    "minimum_index_compatibility_version" : "5.0.0"
  },
  "tagline" : "You Know, for Search"
}
```

---
layout: post
title: "Ansible Playbook for your Macbook Homebrew Packages"
description: "This ansible playbook can be used to install homebrew packages for your macbook"
date: 2022-08-28 19:14:54 -0400
comments: true
categories: ["ansible", "devops", "homebrew"] 
---

![ansible-macbook-homebrew](https://blog.ruanbekker.com/images/ansible-macbook.png)

In this tutorial I will demonstrate how to use Ansible for Homebrew Configuration Management. The aim for using Ansible to manage your homebrew packages helps you to have a consistent list of packages on your macbook.

For me personally, when I get a new laptop it's always a mission to get the same packages installed as what I had before, and ansible solves that for us to have all our packages defined in configuration management.

## Install Ansible

Install ansible with python and pip:

```bash
python3 -m pip install ansible==4.9.0
```

## Ansible Configuration

Create the `ansible.cfg` configuration file:

```
[defaults]
inventory = inventory.ini
deprecation_warnings = False
```

Our `inventory.ini` will define the information about our target host, which will be localhost as we are using ansible to run against our local target which is our macbook:

```
[localhost]
my.laptop  ansible_connection=local

[localhost:vars]
ansible_python_interpreter = /usr/bin/python3
```

## Ansible Playbook

Our playbook `homebrew.yaml` will define the tasks to add the homebrew taps, cask packages and homebrew packages. You can change the packages as you desire, but these are the ones that I use:

```yaml
- hosts: localhost
  name: Macbook Playbook
  gather_facts: False
  vars:
    TFENV_ARCH: amd64
  tasks:
    - name: Ensures taps are present via homebrew
      community.general.homebrew_tap:
        name: "{{ item }}"
        state: present
      with_items:
        - hashicorp/tap

    - name: Ensures packages are present via homebrew cask
      community.general.homebrew_cask:
        name: "{{ item }}"
        state: present
        install_options: 'appdir=/Applications'
      with_items:
        - visual-studio-code
        - multipass
        - spotify

    - name: Ensures packages are present via homebrew
      community.general.homebrew:
        name: "{{ item }}"
        path: "/Applications"
        state: present
      with_items:
        - openssl
        - readline
        - sqlite3
        - xz
        - zlib
        - jq
        - yq
        - wget
        - go
        - kubernetes-cli
        - fzf
        - sshuttle
        - hugo
        - helm
        - kind
        - awscli
        - gnupg
        - kubectx
        - helm
        - stern
        - terraform
        - tfenv
        - pyenv 
        - jsonnet
      ignore_errors: yes
      tags:
        - packages
```

## Deploy Playbook

Now you can run the playbook using:

```bash
ansible-playbook homebrew.yaml
```

## Source Code

The code can be found in my github repository:
- https://github.com/ruanbekker/ansible-macbook-setup

## Thanks

Thanks for reading, feel free to check out my [website](https://ruan.dev/), feel free to subscribe to my [newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog) or follow me at [@ruanbekker](https://twitter.com/ruanbekker) on Twitter.

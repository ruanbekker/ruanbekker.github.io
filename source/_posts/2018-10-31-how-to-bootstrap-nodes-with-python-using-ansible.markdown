---
layout: post
title: "How to Bootstrap Nodes with Python using Ansible"
date: 2018-10-31 01:48:15 -0400
comments: true
categories: ["ansible", "ansible-tutorial", "devops", "linux"] 
---

![](https://res.cloudinary.com/rbekker/image/upload/v1531083331/ansible_tojf8l.png)

As Ansible depends on Python, therefore we can bootstrap our nodes with Python using a Ansible Playbook

## Inventory

The nodes we want to bootstrap:

``` inventory.ini
[new]
node-1
node-2
node-3

[new:vars]
ansible_python_interpreter=/usr/bin/python3
```

## Playbook

Our playbook with what we want to do:

``` bootstrap-python.yml
---
- hosts: all
  gather_facts: False

  tasks:
  - name: install python
    raw: test -e /usr/bin/python || ( apt update && apt install python -y )
```

## Deploy

Deploy with Ansible:

```bash
$ ansible-playbook -i inventory.ini bootstrap-python.yml

PLAY [all] ***********************************************************************************************************************************************************************************************

TASK [install python] ************************************************************************************************************************************************************************************
changed: [node-1]
changed: [node-2]
changed: [node-3]

PLAY RECAP ***********************************************************************************************************************************************************************************************
node-1                     : ok=2    changed=2    unreachable=0    failed=0
node-2                     : ok=2    changed=2    unreachable=0    failed=0
node-3                     : ok=2    changed=2    unreachable=0    failed=0
```

This is it for this post, all posts for this tutorial will be posted under [#ansible-tutorial](http://blog.ruanbekker.com/blog/categories/ansible-tutorial)

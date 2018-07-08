---
layout: post
title: "Getting Started with Ansible on Ubuntu"
date: 2018-07-08 15:56:06 -0400
comments: true
categories: ["devops", "ansible",  "ansible-tutorial", "ubuntu"] 
---

![](https://res.cloudinary.com/rbekker/image/upload/v1531083331/ansible_tojf8l.png)

[Part 1]() - This is a getting started series on Ansible. 

The first post will be on how to setup ansible and how to reach your nodes in order to deploy software to your nodes.

## Install Ansible:

Ansible relies on python, so we will first install the dependencies:

```bash
$ apt update && apt install python python-setuptools -y
$ easy_install pip
$ pip install ansible
```

## Populate the invetory configuration:

Your invetory file will hold your host and variable information. Lets say we have 3 nodes that we want to deploy software to; `node-1`, `node-2` and `node-3`. We will group them under `nodes`. This will be saved under the a new file `inventory.init`:

```bash inventory.ini
[nodes]
node-1
node-2
node-3
```

Next we will populate information about our node names, this will be done under our `~/.ssh/config` configuration:

```bash ~/.ssh/config
Host node-1
  Hostname 10.0.0.2
  User root
  IdentityFile ~/.ssh/id_rsa
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null

Host node-2
  Hostname 10.0.0.3
  User root
  IdentityFile ~/.ssh/id_rsa
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null

Host node-3
  Hostname 10.0.0.4
  User root
  IdentityFile ~/.ssh/id_rsa
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
```

Now we need to generate a ssh key for our node where we will run our ansible commands from:

```bash
$ ssh-keygen -b 2048 -f ~/.ssh/id_rsa -t rsa -q -N ""
```

Now we will copy the contents of `~/.ssh/id_rsa.pub` into our destination nodes `~/.ssh/authorized_keys` or if you have password authentication enabled, we can do `$ ssh-copy-id root@10.0.0.x` etc. Now we should be able to ssh to our nodes to `node-1, node-2` and `node-3`.

## Deploy Python:

As Ansible requires Python, we need to bootstrap our nodes with Python. Since we are able to ssh to our nodes, we will use ansible to deploy Python to our nodes:

```bash
$ ansible -m raw -s -a "apt update && apt install python -y" -i inventory.ini nodes
```

This should succeed, then we can test our connection by running the ping module:

```bash
$ ansible -i inventory.ini nodes -m ping
node-2 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
node-3 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
node-1 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
```

## Run a command on your nodes:

Let's run a cat command on all the nodes:

```bash
$ ansible -i inventory.ini nodes -a "/bin/cat /etc/hostname"
node-3 | SUCCESS | rc=0 >>
node-3

node-1 | SUCCESS | rc=0 >>
node-1

node-2 | SUCCESS | rc=0 >>
node-2
```

## Ansible Playbooks:

Let's run shell commands, the traditional hello world, using the ansible-playbook command. First we need a task definition, which I will name `shell_command-1.yml`:

```bash shell_command.yml
---
# Echo Static String
- hosts: nodes
  tasks:
  - name: echo static value
    shell: /bin/echo "hello world"
    register: echo_static
  - debug: msg="{{echo_static.stdout}}"
```

Now we have defined that our commands will be executed against the host group defined in our inventory.ini. Let's run our ansible playbook command:

```bash
$ ansible-playbook -i inventory.ini shell_command.yml

PLAY [nodes] *************************************************************************************

TASK [Gathering Facts] **********************************************************************************
ok: [node-1]
ok: [node-2]
ok: [node-3]

TASK [echo static value] ********************************************************************************
changed: [node-1]
changed: [node-2]
changed: [node-3]

TASK [debug] ********************************************************************************************
ok: [node-1] => {
    "msg": "hello world"
}
ok: [node-2] => {
    "msg": "hello world"
}
ok: [node-3] => {
    "msg": "hello world"
}

PLAY RECAP **********************************************************************************************
node-1              : ok=3    changed=1    unreachable=0    failed=0
node-2              : ok=3    changed=1    unreachable=0    failed=0
node-3              : ok=3    changed=1    unreachable=0    failed=0
```

Let's define a variable `location_city = Cape Town` in our `inventory.ini` configuration, then we will call the variable key in our task definition:

```bash inventory.ini
[nodes]
node-1
node-2
node-3

[nodes:vars]
location_city="Cape Town"
```

Now our task definition with our variable:

```yml shell_command-2.yml
---
# Echo Variable
- hosts: nodes
  tasks:
  - name: echo variable value
    shell: /bin/echo "{{ location_city }}"
    register: echo
  - debug: msg="{{echo.stdout}}"
```

Running our ansible-playbook:

```bash
$ ansible-playbook -i inventory.ini shell_command.yml

PLAY [nodes] **************************************************************************************************************************************************************************************

TASK [Gathering Facts] ***********************************************************************************************************************************************************************************
ok: [node-1]
ok: [node-2]
ok: [node-3]

TASK [echo variable value] *******************************************************************************************************************************************************************************
changed: [node-1]
changed: [node-2]
changed: [node-3]

TASK [debug] *********************************************************************************************************************************************************************************************
ok: [node-1] => {
    "msg": "Cape Town"
}
ok: [node-2] => {
    "msg": "Cape Town"
}
ok: [node-3] => {
    "msg": "Cape Town"
}

PLAY RECAP ***********************************************************************************************************************************************************************************************
node-1              : ok=3    changed=1    unreachable=0    failed=0
node-2              : ok=3    changed=1    unreachable=0    failed=0
node-3              : ok=3    changed=1    unreachable=0    failed=0
```

This is it for this post, all posts for this tutorial will be posted under [#ansible-tutorials](http://blog.ruanbekker.com/blog/categories/ansible-tutorial)


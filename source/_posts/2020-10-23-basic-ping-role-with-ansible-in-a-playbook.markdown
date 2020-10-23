---
layout: post
title: "Basic Ping Role with Ansible in a Playbook"
date: 2020-10-23 13:13:16 +0000
comments: true
categories: ["ansible", "devops"] 
---

This is a short post on how to create a basic role to reference the ping module in Ansible.

## Directory Structure

This is our directory strucuture:

```
$ tree .
.
├── inventory.ini
├── playbooks
│   └── myplaybook.yml
└── roles
    └── ping
        └── tasks
            └── main.yml

4 directories, 3 files
```

Create the directories:

```
$ mkdir -p playbooks
$ mkdir -p roles/ping/tasks
```

Our `inventory.ini` includes the hosts that we will be using, and in this case I will be defining a group named `rpifleet` with all the host nested under that group and I'm using the user `pi` and my private ssh key `~/.ssh/id_rsa`:

```
$ cat inventory.ini
[rpifleet]
rpi-01 ansible_host=rpi-01.local ansible_user=pi ansible_ssh_private_key_file=~/.ssh/id_rsa ansible_python_interpreter=/usr/bin/python3
rpi-02 ansible_host=rpi-02.local ansible_user=pi ansible_ssh_private_key_file=~/.ssh/id_rsa ansible_python_interpreter=/usr/bin/python3
[rpifleet:vars]
ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'
```

Next our role is a basic role that will reference our ping module, so from our main playbook we will reference the role that we are defining:

```
$ cat roles/ping/tasks/main.yml
---
- name: Test Ping
  action: ping
```

Now that we have defined our `ping` role, we need to include it into our playbook:

```
$ cat playbooks/myplaybook.yml
---
- name: ping raspberry pi fleet
  hosts: rpifleet
  roles:
    - { role: ../roles/ping }
```

You will see due to my playbooks directory being non-default, I defined the path to the role directory.

## Install Ansible

Next we need to install ansible:

```
$ pip install ansible
```

## Run the Ansible Playbook

Now run the playbook which will ping the nodes using ssh. Using the ping module is useful when testing the connection to your nodes:

```
$ ansible-playbook -i inventory.ini playbooks/myplaybook.yml

PLAY [ping raspberry pi fleet] *****************************************************

TASK [Gathering Facts] *************************************************************
ok: [rpi-02]
ok: [rpi-01]

TASK [../roles/ping : Test Ping] ***************************************************
ok: [rpi-02]
ok: [rpi-01]

PLAY RECAP *************************************************************************
rpi-01                     : ok=2    changed=0    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
rpi-02                     : ok=2    changed=0    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
```

## Thank You

Thanks for reading

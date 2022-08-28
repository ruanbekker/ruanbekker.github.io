---
layout: post
title: "Environment Variables with Ansible"
date: 2020-01-24 19:28:16 +0200
comments: true
categories: ["ansible", "devops"] 
---

![](https://user-images.githubusercontent.com/567298/55700285-f3cdda00-59ce-11e9-9c00-a05b9d469e23.png)

This is a quick post on how to use environment variables in ansible

## Inventory

Our `inventory.ini` file looks like this:

```
[localhost]
localhost
```

## Across Tasks

You can set environment variables across tasks, and let your tasks inherit the variables:

```yaml
- hosts: localhost
  vars:
    var_mysecret: secret123

  tasks:
    - name: echo my env var
      environment:
        MYNAME: "{{var_mysecret}}"
      shell: "echo hello $MYNAME > /tmp/bla.txt"
      args:
        creates: /tmp/bla.txt
```

When we run the task:

```bash
$ ansible-playbook -i inventory.ini -u ruan task.yml
```

Check the output:

```bash
$ cat /tmp/bla.txt
hello secret123
```

## Environment Variables Per Task

You can set environment variables per task:

```yaml
- hosts: dev
  tasks:
    - name: echo my env var
      environment:
        MYNAME: "RUAN"
      shell: "echo hello $MYNAME > /tmp/bla2.txt"
      args:
        creates: /tmp/bla2.txt
```

Running the task:

```
$ ansible-playbook -i inventory.ini -u ruan task.yml
```

Checking the output:

```
$ cat /tmp/bla2.txt
hello RUAN
```

## Read More

Read more on environment variables in ansible in their [documentation](https://docs.ansible.com/ansible/latest/plugins/lookup/env.html)

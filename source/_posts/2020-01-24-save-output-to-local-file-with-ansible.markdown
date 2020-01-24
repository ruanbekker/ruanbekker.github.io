---
layout: post
title: "Save Output to Local File with Ansible"
date: 2020-01-24 19:56:01 +0200
comments: true
categories: ["ansible", "devops"]
---

![](https://user-images.githubusercontent.com/567298/55700285-f3cdda00-59ce-11e9-9c00-a05b9d469e23.png)

This playbook demonstrates how you can redirect shell output to a local file

## Inventory

Our `inventory.ini` file:

```
[localhost]
localhost
```

## The Script

Our script: `/tmp/foo`

```bash
#!/usr/bin/env bash
echo "foo"
echo "bar"
```

Apply executable permissions:

```
$ chmod +x /tmp/foo
```

## Playbook

Our playbook: `debug.yml`

```yaml
---
- hosts: localhost
  tasks:
    - shell: /tmp/foo
      register: foo_result
      ignore_errors: True
    - local_action: copy content={{ foo_result.stdout }} dest=file
```

## Running

Running the Ansible Playbook:

```
$ ansible-playbook -i inventory.ini debug.yml

PLAY [localhost] ********************************************************************************************************************************************************************

TASK [shell] ************************************************************************************************************************************************************************
changed: [localhost]

TASK [copy] *************************************************************************************************************************************************************************
changed: [localhost -> localhost]

PLAY RECAP **************************************************************************************************************************************************************************
localhost                  : ok=2    changed=2    unreachable=0    failed=0
```

View the local saved file:

```
$ cat file
foo
bar
```

## Read More

For more content on [Ansible](https://blog.ruanbekker.com/blog/categories/ansible/) check out my [Ansible](https://blog.ruanbekker.com/blog/categories/ansible/) category

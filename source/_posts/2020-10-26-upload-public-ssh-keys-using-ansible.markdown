---
layout: post
title: "Upload Public SSH Keys using Ansible"
date: 2020-10-26 07:44:25 +0000
comments: true
categories: ["ansible", "devops", "ssh"]
---

In this post I will demonstrate how you can use ansible to automate the task of adding one or more ssh public keys to multiple servers authorized_keys file.

This will be focused in a scenario where you have 5 new ssh keys that we would want to copy to our bastion hosts authorized_keys file

## The User Accounts

We have our bastion server named `bastion.mydomain.com` where would like to create the following accounts: `john, bob, sarah, sam, adam` and also upload their personal ssh public keys to those accounts so that they can logon with their ssh private keys.

On my local directory, I have their ssh public keys as:

```
~/workspace/sshkeys/john.pub
~/workspace/sshkeys/bob.pub
~/workspace/sshkeys/sarah.pub
~/workspace/sshkeys/sam.pub
~/workspace/sshkeys/adam.pub
```

They will be referenced in our playbook as `key: "{{ lookup('file', '~/workspace/sshkeys/{{ item }}.pub') }}"` but if they were on github we can reference them as `key: https://github.com/{{ item }}.keys`, more info on that can be found on the [authorized_key_module](https://docs.ansible.com/ansible/2.4/authorized_key_module.html) documentation.

## The Target Server

Our inventory for the target server only includes one host, but we can add as many as we want, but our inventory will look like this:

```
$ cat inventory.ini
[bastion]
bastion-host ansible_host=34.x.x.x ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/ansible.pem ansible_python_interpreter=/usr/bin/python3
[bastion:vars]
ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'
```

Test if the target server is reachable using the user `ubuntu` using our admin accounts ssh key `ansible.pem`:

```
$ ansible -i inventory.ini -m ping bastion
bastion | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
```

## Our Playbook

In this playbook, we will reference the users that we want to create and it will loop through those users, creating them on the target server and also use those names to match to the files on our laptop to match the ssh public keys:

```
$ cat playbook.yml
---
- hosts: bastion
  become: yes
  become_user: root
  become_method: sudo
  tasks:
    - name: create local user account on the target server
      user:
        name: '{{ item }}'
        comment: '{{ item }}'
        shell: /bin/bash
        append: yes
        groups: sudo
        generate_ssh_key: yes
        ssh_key_type: rsa
      with_items:
        - john
        - bob
        - sarah
        - sam
        - adam

    - name: upload ssh public key to users authorized keys file
      authorized_key:
        user: '{{ item }}'
        state: present
        manage_dir: yes
        key: "{{ lookup('file', '~/workspace/sshkeys/{{ item }}.pub') }}"
      with_items:
        - john
        - bob
        - sarah
        - sam
        - adam
```

## Deploy

Run the playbook:

```
$ ansible-playbook -i inventory.ini ssh-setup.yml

PLAY [bastion]

TASK [Gathering Facts]
ok: [bastion-host]

TASK [create local user account on the target server]
changed: [bastion-host] => (item=john)
changed: [bastion-host] => (item=bob)
changed: [bastion-host] => (item=sarah)
changed: [bastion-host] => (item=sam)
changed: [bastion-host] => (item=adam)

TASK [upload ssh public key to users authorized keys file]
changed: [bastion-host] => (item=john)
changed: [bastion-host] => (item=bob)
changed: [bastion-host] => (item=sarah)
changed: [bastion-host] => (item=sam)
changed: [bastion-host] => (item=adam)

PLAY RECAP
bastion-host                   : ok=6    changed=5    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
```

Now when we ask one of the users, adam for example, to authenticate with:

```
$ ssh -i ~/.ssh/path_to_his_private_key.pem adamin@bastion.mydomain.com
```

They should have access to the server.

## Thank You

Thanks for reading, for more information on this module check out their documentation:

- https://docs.ansible.com/ansible/2.4/authorized_key_module.html

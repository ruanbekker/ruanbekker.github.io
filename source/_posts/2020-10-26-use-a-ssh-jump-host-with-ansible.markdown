---
layout: post
title: "Use a SSH Jump Host with Ansible"
date: 2020-10-26 05:25:18 +0000
comments: true
categories: ["ssh", "devops", "ansible"]
---

In this post we will demonstrate how to use a SSH Bastion or Jump Host with Ansible to reach the target server.

In some scenarios, the target server might be in a private range which is only accessible via a bastion host, and that counts the same for ansible as ansible is using SSH to reach to the target servers.

## SSH Config

Our bastion host is configured as `bastion` and the config under `~/.ssh/config` looks like this:

```
Host *
    Port 22
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    ServerAliveInterval 60
    ServerAliveCountMax 30

Host bastion
    HostName bastion.mydomain.com
    User bastion
    IdentityFile ~/.ssh/id_rsa
```

To verify that our config is working, you should be able to use:

```
$ ssh bastion
```

## Using a Bastion with Ansible

In order to reach our target server we need to use the bastion, so to test the SSH connection we can use this SSH one-liner. Our target server has a IP address of `172.31.81.94` and expects us to provide a `ansible.pem` private key and we need to authenticate with the `ubuntu` user:

```
$ ssh -o ProxyCommand="ssh -W %h:%p -q bastion" -i ~/.ssh/ansible.pem ubuntu@172.31.81.94
```

If we can reach our server its time to include it in our playbook.

In our inventory:

```
$ cat inventory.ini
[deployment]
server-a ansible_host=172.31.81.94 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/ansible.pem
[deployment:vars]
ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ProxyCommand="ssh -W %h:%p -q bastion"'
```

And our playbook which will use the ping module:

```
$ cat playbook.yml
- name: Test Ping
  hosts: deployment
  tasks:
  - action: ping
```

Test it out:

```
$ ansible-playbook -i inventory.ini ping.yml

PLAY [Test Ping] ***********************************************************************************************************************************************************

TASK [Gathering Facts] *****************************************************************************************************************************************************
ok: [server-a]

TASK [ping] ****************************************************************************************************************************************************************
ok: [server-a]

PLAY RECAP *****************************************************************************************************************************************************************
server-a                   : ok=2    changed=0    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
```

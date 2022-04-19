---
layout: post
title: "Publish and use your Ansible Role from Git"
date: 2022-04-19 04:35:09 -0400
comments: true
categories: ["devops", "ansible", "git"]
---

In this tutorial we will be creating a ansible role, publish our ansible role to github, then we will install the role locally and create a ansible playbook to use the ansible role.

## Ansible Installation

Create a virtual environment with Python:

```
$ virtualenv .venv -p python3
$ source .venv/bin/activate
```

Install ansible with pip:

```
$ pip install ansible==4.4.0
```

Now that we have ansible installed, we can create our role.

## Initialize Ansible Role

A Ansible Role consists of a couple of files, and using `ansible-galaxy` makes it easy initializing a boilerplate structure to begin with::

```
$ ansible-galaxy init --init-path roles ssh_config
- Role ssh_config was created successfully
```

The role that we created is named `ssh_config` and will be placed under the directory `roles` under our current working directory.

## Define Role Tasks

Create the dummy task under `roles/ssh_config/tasks/main.yml`:

<script src="https://gist.github.com/ruanbekker/4971be45476915ba877bb444a9ff1c0b.js"></script>

Then define the defaults environment values in the file `roles/ssh_config/defaults/main.yml`:

```yaml
---
# defaults file for ssh_config
ssh_port: 22
```

The value of `ssh_port` will default to `22` if we don't define it in our variables.

## Commit to Git

The assumption is made here that you already created a git repository and that your access is sorted. Add the files and commit it to git:

```
$ git add .
$ git commit -m "Your message"
$ git push origin main
```

Now your ansible role should be commited and visible in git.

## SSH Config Client Side

I will be referencing the git source url via SSH, and since I am using my default ssh key, the ssh config isn't really needed, but if you are using a different version control system, with different ports or different ssh keys, the following ssh config snippet may be useful:

```
$ cat ~/.ssh/config
Host github.com
    User git
    Port 22
    IdentityFile ~/.ssh/id_rsa
```

If you won't be using SSH as the source url in your ansible setup for your role, you can skip the SSH setup.

## Installing the Ansible Role from Git

When installing roles, ansible installs them by default under: `~/.ansible/roles`, `/usr/share/ansible/roles` or `/etc/ansible/roles`.

From our previous steps, we still have the ansible role content locally (not under the default installed directory), so by saying installing the role kinda sounds like we are doing double the work. But the intention is that you have your ansible role centralized and versioned on git, and on new servers or workstations where you want to consume the role from, that specific role, won't be present on that source.

To install the role from Git, we need to populate the `requirements.yml` file:

```
$ mkdir ~/my-project
$ cd ~/my-project
```

The requirements file is used to define where our role is located, which version and the type of version control, the `requirements.yml`:

```yaml
---
roles:
  - name: ssh_config
    src: ssh://git@github.com/ruanbekker/ansible-demo-role.git
    version: main
    scm: git
```

For other variations of using the requirements file, you can have a look at their [documentation](https://galaxy.ansible.com/docs/using/installing.html#installing-multiple-roles-from-a-file)

Then install the ansible role from our requirements file (I have used `--force` to overwrite my current one while testing):

```
$ ansible-galaxy install -r requirements.yml --force
Starting galaxy role install process
- changing role ssh_config from main to main
- extracting ssh_config to /Users/ruan/.ansible/roles/ssh_config
- ssh_config (main) was installed successfully
```

## Ansible Playbook

Define the ansible playbook to use the role that we installed from git, in a file called `playbook.yml`:

```yaml
---
- hosts: localhost
  roles:
    - ssh_config
  vars:
    ssh_port: 2202
```

Run the ansible playbook:

```
$ ansible-playbook playbook.yml
PLAY [localhost] *********************************************************************************************

TASK [Gathering Facts] ***************************************************************************************
ok: [localhost]

TASK [ssh_config : Dummy task] *******************************************************************************
ok: [localhost] => {
    "msg": "This is a dummy task changing ssh port to 2202."
}

PLAY RECAP ***************************************************************************************************
localhost                  : ok=2    changed=0    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
```

## Thank You

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)**, read my **[newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.



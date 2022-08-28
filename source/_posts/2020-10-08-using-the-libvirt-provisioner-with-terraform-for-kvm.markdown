---
layout: post
title: "Using the libvirt provisioner with Terraform for KVM"
date: 2020-10-08 00:06:21 +0000
comments: true
categories: ["terraform", "kvm", "libvirt", "ansible"]
---

![terraform-ansible-kvm](https://user-images.githubusercontent.com/567298/95402415-e836d880-090f-11eb-8977-d1e2f842ef34.png)


In this post we will use the [libvirt provisioner](https://github.com/dmacvicar/terraform-provider-libvirt) with Terraform to deploy a KVM Virtual Machine on a Remote KVM Host using SSH and use Ansible to deploy Nginx on our VM.

In my [previous post](https://blog.ruanbekker.com/blog/2020/10/07/setup-a-kvm-host-for-virtualization-on-oneprovider/) I demonstrated how I provisioned my KVM Host and created a dedicated user for Terraform to authenticate to our KVM host to provision VMs.

Once you have KVM installed and your SSH access is sorted, we can start by installing our dependencies.

## Install our Dependencies

First we will install Terraform:

```
$ wget https://releases.hashicorp.com/terraform/0.13.3/terraform_0.13.3_linux_amd64.zip
$ unzip terraform_0.13.3_linux_amd64.zip
$ sudo mv terraform /usr/local/bin/terraform
```

Then we will install Ansible:

```
$ virtualenv -p python3 .venv
$ source .venv/bin/activate
$ pip install ansible
```

Now in order to use the libvirt provisioner, we need to install it where we will run our Terraform deployment:

```
$ cd /tmp/
$ mkdir -p ~/.local/share/terraform/plugins/registry.terraform.io/dmacvicar/libvirt/0.6.2/linux_amd64
$ wget https://github.com/dmacvicar/terraform-provider-libvirt/releases/download/v0.6.2/terraform-provider-libvirt-0.6.2+git.1585292411.8cbe9ad0.Ubuntu_18.04.amd64.tar.gz
$ tar -xvf terraform-provider-libvirt-0.6.2+git.1585292411.8cbe9ad0.Ubuntu_18.04.amd64.tar.gz
$ mv ./terraform-provider-libvirt  ~/.local/share/terraform/plugins/registry.terraform.io/dmacvicar/libvirt/0.6.2/linux_amd64/
```

Our ssh config for our KVM host in `~/.ssh/config`:

```
Host *
    Port 22
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null

Host ams-kvm-remote-host
    HostName ams-kvm.mydomain.com
    User deploys
    IdentityFile ~/.ssh/deploys.pem
```

## Terraform all the things

Create a workspace directory for our demonstration:

```
$ mkdir -p ~/workspace/terraform-kvm-example/
$ cd ~/workspace/terraform-kvm-example/
```

First let's create our `providers.tf`:

```
terraform {
  required_providers {
    libvirt = {
      source  = "dmacvicar/libvirt"
      version = "0.6.2"
    }
  }
}
```

Then our `variables.tf`, just double check where you need to change values to suite your environment:

```
variable "libvirt_disk_path" {
  description = "path for libvirt pool"
  default     = "/opt/kvm/pool1"
}

variable "ubuntu_18_img_url" {
  description = "ubuntu 18.04 image"
  default     = "http://cloud-images.ubuntu.com/releases/bionic/release-20191008/ubuntu-18.04-server-cloudimg-amd64.img"
}

variable "vm_hostname" {
  description = "vm hostname"
  default     = "terraform-kvm-ansible"
}

variable "ssh_username" {
  description = "the ssh user to use"
  default     = "ubuntu"
}

variable "ssh_private_key" {
  description = "the private key to use"
  default     = "~/.ssh/id_rsa"
}
```

Create the `main.tf`, you will notice that we are using ssh to connect to KVM, and because the private range of our VM's are not routable via the internet, I'm using a bastion host to reach them.

The bastion host (ssh config from the pre-requirements section) is the KVM host and you will see that ansible is also using that host as a jump box, to get to the VM. I am also using cloud-init to bootstrap the node with SSH, etc.

The reason why I'm using remote-exec before the ansible deployment, is to ensure that we can establish a command via SSH before Ansible starts.

```
provider "libvirt" {
  uri = "qemu+ssh://deploys@ams-kvm-remote-host/system"
}

resource "libvirt_pool" "ubuntu" {
  name = "ubuntu"
  type = "dir"
  path = var.libvirt_disk_path
}

resource "libvirt_volume" "ubuntu-qcow2" {
  name = "ubuntu-qcow2"
  pool = libvirt_pool.ubuntu.name
  source = var.ubuntu_18_img_url
  format = "qcow2"
}

data "template_file" "user_data" {
  template = file("${path.module}/config/cloud_init.yml")
}

data "template_file" "network_config" {
  template = file("${path.module}/config/network_config.yml")
}

resource "libvirt_cloudinit_disk" "commoninit" {
  name           = "commoninit.iso"
  user_data      = data.template_file.user_data.rendered
  network_config = data.template_file.network_config.rendered
  pool           = libvirt_pool.ubuntu.name
}

resource "libvirt_domain" "domain-ubuntu" {
  name   = var.vm_hostname
  memory = "512"
  vcpu   = 1

  cloudinit = libvirt_cloudinit_disk.commoninit.id

  network_interface {
    network_name   = "default"
    wait_for_lease = true
    hostname       = var.vm_hostname
  }

  console {
    type        = "pty"
    target_port = "0"
    target_type = "serial"
  }

  console {
    type        = "pty"
    target_type = "virtio"
    target_port = "1"
  }

  disk {
    volume_id = libvirt_volume.ubuntu-qcow2.id
  }

  graphics {
    type        = "spice"
    listen_type = "address"
    autoport    = true
  }

  provisioner "remote-exec" {
    inline = [
      "echo 'Hello World'"
    ]

    connection {
      type                = "ssh"
      user                = var.ssh_username
      host                = libvirt_domain.domain-ubuntu.network_interface[0].addresses[0]
      private_key         = file(var.ssh_private_key)
      bastion_host        = "ams-kvm-remote-host"
      bastion_user        = "deploys"
      bastion_private_key = file("~/.ssh/deploys.pem")
      timeout             = "2m"
    }
  }

  provisioner "local-exec" {
    command = <<EOT
      echo "[nginx]" > nginx.ini
      echo "${libvirt_domain.domain-ubuntu.network_interface[0].addresses[0]}" >> nginx.ini
      echo "[nginx:vars]" >> nginx.ini
      echo "ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ProxyCommand=\"ssh -W %h:%p -q ams-kvm-remote-host\"'" >> nginx.ini
      ansible-playbook -u ${var.ssh_username} --private-key ${var.ssh_private_key} -i nginx.ini ansible/playbook.yml
      EOT
  }
}
```

As I've mentioned, Im using cloud-init, so lets setup the network config and cloud init under the `config/` directory:

```
$ mkdir config
```

And our `config/cloud_init.yml`, just make sure that you configure your public ssh key for ssh access in the config:

```
#cloud-config
# vim: syntax=yaml
# examples:
# https://cloudinit.readthedocs.io/en/latest/topics/examples.html
bootcmd:
  - echo 192.168.0.1 gw.homedns.xyz >> /etc/hosts
runcmd:
 - [ ls, -l, / ]
 - [ sh, -xc, "echo $(date) ': hello world!'" ]
ssh_pwauth: true
disable_root: false
chpasswd:
  list: |
     root:password
  expire: false
users:
  - name: ubuntu
    sudo: ALL=(ALL) NOPASSWD:ALL
    groups: users, admin
    home: /home/ubuntu
    shell: /bin/bash
    lock_passwd: false
    ssh-authorized-keys:
      - ssh-rsa AAAA ...your-public-ssh-key-goes-here... user@host
final_message: "The system is finally up, after $UPTIME seconds"
```

And our network config, in `config/network_config.yml`:

```
version: 2
ethernets:
  ens3:
    dhcp4: true
```

Now we will create our Ansible playbook, to deploy nginx to our VM, create the ansible directory:

```
$ mkdir ansible
```

Then create the `ansible/playbook.yml`:

```
---
# https://docs.ansible.com/ansible/latest/collections/ansible/builtin/apt_module.html
# https://docs.ansible.com/ansible/latest/collections/ansible/builtin/systemd_module.html#examples
- hosts: nginx
  become: yes
  become_user: root
  become_method: sudo
  tasks:
    - name: Install nginx
      apt:
        name: nginx
        state: latest
        update_cache: yes

    - name: Enable service nginx and ensure it is not masked
      systemd:
        name: nginx
        enabled: yes
        masked: no

    - name: ensure nginx is started
      systemd:
        state: started
        name: nginx
```

This is optional, but I'm using a `ansible.cfg` file to define my defaults:

```
[defaults]
host_key_checking = False
ansible_port = 22
ansible_user = ubuntu
ansible_ssh_private_key_file = ~/.ssh/id_rsa
ansible_python_interpreter = /usr/bin/python3
```

And lastly, our `outputs.tf` which will display our IP address of our VM:

```
output "ip" {
  value = libvirt_domain.domain-ubuntu.network_interface[0].addresses[0]
}

output "url" {
  value = "http://${libvirt_domain.domain-ubuntu.network_interface[0].addresses[0]}"
}
```

## Deploy our Terraform Deployment

It's time to deploy a KVM instance with Terraform and deploy Nginx to our VM with Ansible using the local-exec provisioner. 

Initialize terraform to download all the plugins:

```
$ terraform init

Initializing the backend...

Initializing provider plugins...
- Finding latest version of hashicorp/template...
- Finding dmacvicar/libvirt versions matching "0.6.2"...
- Installing hashicorp/template v2.1.2...
- Installed hashicorp/template v2.1.2 (signed by HashiCorp)
- Installing dmacvicar/libvirt v0.6.2...
- Installed dmacvicar/libvirt v0.6.2 (unauthenticated)

The following providers do not have any version constraints in configuration,
so the latest version was installed.

To prevent automatic upgrades to new major versions that may contain breaking
changes, we recommend adding version constraints in a required_providers block
in your configuration, with the constraint strings suggested below.

* hashicorp/template: version = "~> 2.1.2"

Terraform has been successfully initialized!
```

Run a plan, to see what will be done:

```
$ terraform plan

...
Plan: 4 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + ip  = (known after apply)
  + url = (known after apply)
...
```

And run a apply to run our deployment:

```
$ terraform apply -auto-approve
...
libvirt_domain.domain-ubuntu (local-exec): PLAY RECAP *********************************************************************
libvirt_domain.domain-ubuntu (local-exec): 192.168.122.213            : ok=4    changed=1    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
libvirt_domain.domain-ubuntu: Creation complete after 2m24s [id=c96def6e-0361-441c-9e1f-5ba5f3fa5aec]

Apply complete! Resources: 4 added, 0 changed, 0 destroyed.

Outputs:

ip = 192.168.122.213
url = http://192.168.122.213
```

You can always get the output afterwards using show or output:

```
$ terraform show -json | jq -r '.values.outputs.ip.value'
192.168.122.213

$ terraform output -json ip | jq -r '.'
192.168.122.213
```

## Test our VM

Hop onto the KVM host, and test out nginx:

```
$ curl -I http://192.168.122.213
HTTP/1.1 200 OK
Server: nginx/1.14.0 (Ubuntu)
Date: Thu, 08 Oct 2020 00:37:43 GMT
Content-Type: text/html
Content-Length: 612
Last-Modified: Thu, 08 Oct 2020 00:33:04 GMT
Connection: keep-alive
ETag: "5f7e5e40-264"
Accept-Ranges: bytes
```

<iframe src="https://giphy.com/embed/3ohzdIuqJoo8QdKlnW" width="480" height="222" frameBorder="0" class="giphy-embed" allowFullScreen></iframe><p><a href="https://giphy.com/gifs/reactionseditor-yes-awesome-3ohzdIuqJoo8QdKlnW">via GIPHY</a></p>


## Thank You

[![Say Thanks!](https://img.shields.io/badge/Say%20Thanks-!-1EAEDB.svg)](https://saythanks.io/to/ruan.ru.bekker@gmail.com) 

Thanks for reading, check out my <strong><a href="" rel="nofollow" target="_blank">website</a></strong> or follow me at <strong><a href="https://twitter.com/ruanbekker" rel="nofollow" target="_blank">@ruanbekker</a></strong> on Twitter.

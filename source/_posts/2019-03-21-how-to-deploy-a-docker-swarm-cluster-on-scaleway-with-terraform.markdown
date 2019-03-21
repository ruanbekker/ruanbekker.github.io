---
layout: post
title: "How to Deploy a Docker Swarm Cluster on Scaleway with Terraform"
date: 2019-03-21 02:15:07 -0400
comments: true
categories: ["docker", "swarm", "scaleway", "terraform", "devops"]
---
![](https://user-images.githubusercontent.com/567298/54737111-09fa2e80-4bb7-11e9-97f4-a94a31fc9a3a.png)

We will deploy a 3 node docker swarm cluster with terraform on scaleway. I have used the base source code from [this](https://github.com/stefanprodan/scaleway-swarm-terraform) repository but tweaked the configuration to my needs.

## Pre-Requisites

Ensure terraform and jq is instaled:

```bash
$ brew install terraform
$ brew install jq
```

## Terraform

You can have a look at the linked source at the top for the source code, but below I will provide each file that will make up our terraform deployment.

Ource `main.tf`

```
provider "scaleway" {
  region = "${var.region}"
}

data "scaleway_bootscript" "debian" {
  architecture = "x86_64"
  name = "x86_64 mainline 4.15.11 rev1"
}

data "scaleway_image" "debian_stretch" {
  architecture = "x86_64"
  name         = "Debian Stretch"
}

data "template_file" "docker_conf" {
  template = "${file("conf/docker.tpl")}"

  vars {
    ip = "${var.docker_api_ip}"
  }
}
```

The `outputs.tf`

```
output "swarm_manager_public_ip" {
  value = "${scaleway_ip.swarm_manager_ip.0.ip}"
}

output "swarm_manager_private_ip" {
  value = "${scaleway_server.swarm_manager.0.private_ip}"
}

output "swarm_workers_public_ip" {
  value = "${concat(scaleway_server.swarm_worker.*.name, scaleway_server.swarm_worker.*.public_ip)}"
}

output "swarm_workers_private_ip" {
  value = "${concat(scaleway_server.swarm_worker.*.name, scaleway_server.swarm_worker.*.private_ip)}"
}

output "workspace" {
  value = "${terraform.workspace}"
}
```

Our `security-groups.tf`

```
resource "scaleway_security_group" "swarm_managers" {
  name        = "swarm_managers"
  description = "Allow HTTP/S and SSH traffic"
}

resource "scaleway_security_group_rule" "ssh_accept" {
  security_group = "${scaleway_security_group.swarm_managers.id}"

  action    = "accept"
  direction = "inbound"
  ip_range  = "0.0.0.0/0"
  protocol  = "TCP"
  port      = 22
}

resource "scaleway_security_group_rule" "http_accept" {
  security_group = "${scaleway_security_group.swarm_managers.id}"

  action    = "accept"
  direction = "inbound"
  ip_range  = "0.0.0.0/0"
  protocol  = "TCP"
  port      = 80
}

resource "scaleway_security_group_rule" "https_accept" {
  security_group = "${scaleway_security_group.swarm_managers.id}"

  action    = "accept"
  direction = "inbound"
  ip_range  = "0.0.0.0/0"
  protocol  = "TCP"
  port      = 443
}

resource "scaleway_security_group" "swarm_workers" {
  name        = "swarm_workers"
  description = "Allow SSH traffic"
}

resource "scaleway_security_group_rule" "ssh_accept_workers" {
  security_group = "${scaleway_security_group.swarm_workers.id}"

  action    = "accept"
  direction = "inbound"
  ip_range  = "0.0.0.0/0"
  protocol  = "TCP"
  port      = 22
}
```

Our `variables.tf`

```
variable "docker_version" {
  default = "18.06.3~ce~3-0~debian"
}

variable "region" {
  default = "ams1"
}

variable "manager_instance_type" {
  default = "START1-M"
}

variable "worker_instance_type" {
  default = "START1-M"
}

variable "worker_instance_count" {
  default = 2
}

variable "docker_api_ip" {
  default = "127.0.0.1"
}
```

Our `managers.tf`

```
resource "scaleway_ip" "swarm_manager_ip" {
  count = 1
}

resource "scaleway_server" "swarm_manager" {
  count          = 1
  name           = "${terraform.workspace}-manager-${count.index + 1}"
  image          = "${data.scaleway_image.debian_stretch.id}"
  type           = "${var.manager_instance_type}"
  bootscript     = "${data.scaleway_bootscript.debian.id}"
  security_group = "${scaleway_security_group.swarm_managers.id}"
  public_ip      = "${element(scaleway_ip.swarm_manager_ip.*.ip, count.index)}"

  volume {
    size_in_gb = 50
    type       = "l_ssd"
  }

  provisioner "remote-exec" {
    script = "scripts/mount-disk.sh"
  }

  connection {
    type = "ssh"
    user = "root"
    private_key = "${file("~/.ssh/id_rsa")}"
  }

  provisioner "remote-exec" {
    inline = [
      "mkdir -p /etc/systemd/system/docker.service.d",
    ]
  }

  provisioner "file" {
    content     = "${data.template_file.docker_conf.rendered}"
    destination = "/etc/systemd/system/docker.service.d/docker.conf"
  }

  provisioner "file" {
    source      = "scripts/install-docker-ce.sh"
    destination = "/tmp/install-docker-ce.sh"
  }

  provisioner "file" {
    source      = "scripts/local-persist-plugin.sh"
    destination = "/tmp/local-persist-plugin.sh"
  }

  provisioner "remote-exec" {
    inline = [
      "chmod +x /tmp/install-docker-ce.sh",
      "/tmp/install-docker-ce.sh ${var.docker_version}",
      "docker swarm init --advertise-addr ${self.private_ip}",
      "chmod +x /tmp/local-persist-plugin.sh",
      "/tmp/local-persist-plugin.sh"
    ]
  }
}
```

Our `workers.tf`

```
resource "scaleway_ip" "swarm_worker_ip" {
  count = "${var.worker_instance_count}"
}

resource "scaleway_server" "swarm_worker" {
  count          = "${var.worker_instance_count}"
  name           = "${terraform.workspace}-worker-${count.index + 1}"
  image          = "${data.scaleway_image.debian_stretch.id}"
  type           = "${var.worker_instance_type}"
  bootscript     = "${data.scaleway_bootscript.debian.id}"
  security_group = "${scaleway_security_group.swarm_workers.id}"
  public_ip      = "${element(scaleway_ip.swarm_worker_ip.*.ip, count.index)}"

  volume {
    size_in_gb = 50
    type       = "l_ssd"
  }

  provisioner "remote-exec" {
    script = "scripts/mount-disk.sh"
  }

  connection {
    type = "ssh"
    user = "root"
    private_key = "${file("~/.ssh/id_rsa")}"
  }

  provisioner "remote-exec" {
    inline = [
      "mkdir -p /etc/systemd/system/docker.service.d",
    ]
  }

  provisioner "file" {
    content     = "${data.template_file.docker_conf.rendered}"
    destination = "/etc/systemd/system/docker.service.d/docker.conf"
  }

  provisioner "file" {
    source      = "scripts/install-docker-ce.sh"
    destination = "/tmp/install-docker-ce.sh"
  }

  provisioner "file" {
    source      = "scripts/local-persist-plugin.sh"
    destination = "/tmp/local-persist-plugin.sh"
  }

  provisioner "remote-exec" {
    inline = [
      "chmod +x /tmp/install-docker-ce.sh",
      "/tmp/install-docker-ce.sh ${var.docker_version}",
      "docker swarm join --token ${data.external.swarm_tokens.result.worker} ${scaleway_server.swarm_manager.0.private_ip}:2377",
      "chmod +x /tmp/local-persist-plugin.sh",
      "/tmp/local-persist-plugin.sh",
    ]
  }

  provisioner "remote-exec" {
    when = "destroy"

    inline = [
      "docker node update --availability drain ${self.name}",
    ]

    on_failure = "continue"

    connection {
      type = "ssh"
      user = "root"
      host = "${scaleway_ip.swarm_manager_ip.0.ip}"
    }
  }

  provisioner "remote-exec" {
    when = "destroy"

    inline = [
      "docker swarm leave",
    ]

    on_failure = "continue"
  }

  provisioner "remote-exec" {
    when = "destroy"

    inline = [
      "docker node rm --force ${self.name}",
    ]

    on_failure = "continue"

    connection {
      type = "ssh"
      user = "root"
      host = "${scaleway_ip.swarm_manager_ip.0.ip}"
    }
  }
}

data "external" "swarm_tokens" {
  program = ["./scripts/fetch-tokens.sh"]

  query = {
    host = "${scaleway_ip.swarm_manager_ip.0.ip}"
  }

  depends_on = ["scaleway_server.swarm_manager"]
}
```

Our config for the docker daemon: `conf/docker.tpl`

```
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd -H fd:// \
  -H tcp://${ip}:2375 \
  --storage-driver=overlay2 \
  --dns 8.8.4.4 --dns 8.8.8.8 \
  --log-driver json-file \
  --log-opt max-size=50m --log-opt max-file=10 \
  --experimental=true \
  --metrics-addr 172.17.0.1:9323
```

Our script to mount our additional disk: `scripts/mount-disk.sh`

```bash
#!/bin/bash
apt update
apt install xfsprogs attr -y
mkfs -t xfs /dev/vdb
echo "/dev/vdb /mnt xfs defaults 0 0" >> /etc/fstab
mount -a
```

Our script to install docker: `scripts/install-docker-ce.sh`

```bash
#!/usr/bin/env bash

DOCKER_VERSION=$1
DEBIAN_FRONTEND=noninteractive apt-get -qq update
apt-get -qq install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"

apt-get -q update -y
apt-get -q install -y docker-ce=$DOCKER_VERSION containerd.io
```

Our script that retrieves the swarm tokens: `scripts/fetch-tokens.sh`

```bash
#!/usr/bin/env bash

# Processing JSON in shell scripts
# https://www.terraform.io/docs/providers/external/data_source.html#processing-json-in-shell-scripts

set -e

# Extract "host" argument from the input into HOST shell variable
eval "$(jq -r '@sh "HOST=\(.host)"')"

MANAGER=$(ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@$HOST docker swarm join-token manager -q)
WORKER=$(ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@$HOST docker swarm join-token worker -q)

# produce a json object containing the tokens
jq -n --arg manager "$MANAGER" --arg worker "$WORKER" '{"manager":$manager,"worker":$worker}'
```

Our script to install the [local-persist docker volume](https://github.com/CWSpear/local-persist) plugin: `scripts/local-persist-plugin.sh`

```
#!/usr/bin/env bash
set -e
curl -fsSL https://raw.githubusercontent.com/CWSpear/local-persist/master/scripts/install.sh | bash
```

## Deploy your Swarm

Note that we will be deploying 3x SMART1-M servers with Debian Stretch. At this moment the image id is the one of debian stretch but may change in the future. If you want to change the distro, update the install script, and the terraform files.

[Generate API Token on Scaleway](https://www.scaleway.com/docs/generate-an-api-token/) then export it to your current shell:

```bash
export SCALEWAY_ORGANIZATION="<organization-id>"
export SCALEWAY_TOKEN="<secret>"
```

Make sure that your ssh private key is the intended one as in the config, in my example: `~/.ssh/id_rsa` and that they are allowed in your servers `authorized_keys` file

Create a new workspace:

```bash
$ terraform new workspace swarm
```

Pull down the providers and initialize:

```bash
$ terraform init
```

Deploy!

```bash
$ terraform apply
...
...
scaleway_server.swarm_worker[0]: Creation complete after 4m55s (ID: xx-xx-xx-xx-xx)

Apply complete! Resources: 14 added, 0 changed, 0 destroyed.
Outputs:

swarm_manager_private_ip = 10.21.x.x
swarm_manager_public_ip = 51.xx.xx.xx
swarm_workers_private_ip = [
    swarm-worker-1,
    swarm-worker-2,
    10.20.xx.xx,
    10.20.xx.xx,
]
swarm_workers_public_ip = [
    swarm-worker-1,
    swarm-worker-2,
    51.xx.xx.xx,
    51.xx.xx.xx,
]
workspace = swarm
```

Once your deployment is done you will be prompted with the public/private ip addresses of your nodes as seen above, you can also manually retrieve them:

```
$ terraform terraform output
```

Or for a specific node, such as the manager:

```
$ terraform terraform output swarm-manager
51.xx.xx.xx
```

Go ahead and ssh to your manager nodes and list the swarm nodes, boom, easy right.

```
$ docker node ls
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS      ENGINE VERSION
2696o0vrt93x8qf2gblbfc8pf *   swarm-manager       Ready               Active              Leader              18.09.3
72ava7rrp2acnyadisg52n7ym     swarm-worker-1      Ready               Active                                  18.09.3
sy2otqn20qe9jc2v9io3a21jm     swarm-worker-2      Ready               Active                                  18.09.3
```

When you want to destroy the environment:

```
$ terraform destroy -force
```

## References:

Big thanks goes to [@stefanprodan](https://github.com/stefanprodan) 

* https://www.terraform.io/docs/index.html
* https://docs.docker.com/engine/swarm/

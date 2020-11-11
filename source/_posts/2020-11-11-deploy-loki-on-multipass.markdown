---
layout: post
title: "Deploy Loki on Multipass"
date: 2020-11-11 14:19:05 +0000
comments: true
categories: ["loki", "multipass", "docker"] 
---

![](https://sysadmins.co.za/content/images/size/w1600/2020/11/loki-banner-2.png)

In this post I will demonstrate how to deploy Grafana Labs's **Loki** on **Multipass** using cloud-init so that you can run your own dev environment and run a couple of queries to get you started.

## About

If you haven't heard of [Multipass](https://multipass.run/), it allows you to run Ubuntu VMs on your Mac or Windows workstation.

If you haven't heard of [Loki](https://grafana.com/oss/loki/), as described by Grafana Labs: *"Loki is a horizontally-scalable, highly-available, multi-tenant log aggregation system inspired by Prometheus."*

## Install Multipass

Head over to [multipass.run](https://multipass.run/) to get the installer for your operating system, and if you are curious about Multipass, I wrote a beginners guide on Multipass which can be **[found here](https://sysadmins.co.za/getting-started-with-multipass-vms/)**

## Cloud Init for Loki

We will be making use of **[cloud-init](https://cloudinit.readthedocs.io/en/latest/)** to bootstrap **[Loki v2.0.0](https://github.com/grafana/loki/releases/tag/v2.0.0)** to our multipass instance.

V2.0.0 is the current release of the time of writing, so depending on the time when you read this, have a look at the [Loki Releases](https://github.com/grafana/loki/releases) page for the latest version and adjust the cloud-init.yml according to the version if it differs from the one I'm mentioning.

(Optional) If you want to use SSH to your Multipass VM, you can use your existing SSH key or generate a new one, if you want to create a new key, you can [follow this post](https://sysadmins.co.za/getting-started-with-multipass-vms/)

Copy your public key, in my case `~/.ssh/id_rsa.pub` and paste it under the ssh `authorized_keys` section.

Our `cloud-init.yml` has a couple of sections, but to break it down it will do the following:

* We provide it our public ssh key so that we can ssh with our private key
* Updates the index repository
* Installs the packages, unzip and wget
* Creates the loki systemd unit file and places it under /etc/systemd/system/
* When the vm boots it will create the user loki and creates the loki etc directory
* Once that completes, we are downloading the loki, logcli and promtail binaries from github

```yaml
#cloud-config
ssh_authorized_keys:
  - ssh-rsa AAAA...Ha9 your-comment

package_update: true

packages:
 - unzip
 - wget

write_files:
  - content: |-
      [Unit]
      Description=Loki
      User=loki
      Group=loki
      Wants=network-online.target
      After=network-online.target
      [Service]
      Type=simple
      Restart=on-failure
      ExecStart=/usr/local/bin/loki -config.file /etc/loki/loki-local-config.yaml
      [Install]
      WantedBy=multi-user.target

    owner: root:root
    path: /etc/systemd/system/loki.service
    permissions: '0644'

bootcmd:
  - useradd --no-create-home --shell /bin/false loki
  - mkdir /etc/loki
  - chown -R loki:loki /etc/loki

runcmd:
 - for app in loki logcli promtail; do wget "https://github.com/grafana/loki/releases/download/v2.0.0/${app}-linux-amd64.zip"; done
 - for app in loki logcli promtail; do unzip "${app}-linux-amd64.zip"; done
 - for app in loki logcli promtail; do mv "${app}-linux-amd64" /usr/local/bin/${app}; done
 - for app in loki logcli promtail; do rm -f "${app}-linux-amd64.zip"; done
 - wget https://raw.githubusercontent.com/grafana/loki/v2.0.0/cmd/loki/loki-local-config.yaml
 - mv ./loki-local-config.yaml /etc/loki/loki-local-config.yaml
 - chown loki:loki /etc/loki/loki-local-config.yaml
 - systemctl daemon-reload
 - systemctl start loki
 - sleep 5
 - echo "this is a test" | promtail --stdin --client.url http://localhost:3100/loki/api/v1/push --client.external-labels=app=cli -server.disable
```

You will notice that the VM will have `loki`, `logcli` and `promtail` available on it, so you will have an environment to use all of them together.

As you can see once we start loki, we are piping `this is a test` to Loki using Promtail, so that we can verify that the data is visible in Loki. That step is not required, but just added it to this demo. 

## Deploy Loki on Multipass

We will provision a Multipass VM using the Ubuntu Focal distribution and spec our VM with 1 CPU, 512MB of Memory and 1GB of disk and then bootstrap our installation of Loki using cloud-init:

```bash
$ multipass launch focal \
  --name loki \
  --cpus 1 \
  --mem 512m \
  --disk 1G \
  --cloud-init cloud-init.yml

Creating: loki
Waiting for initialization to complete 
Launched: loki
```

We can validate if our Multipass VM is running:

```bash
$ multipass list
Name                    State             IPv4             Image
loki                    Running           192.168.64.19    Ubuntu 20.04 LTS
```

## Test Loki inside the VM

First we will exec into the VM (or SSH), then we will test out Loki inside the VM since we already have logcli available:

```bash
$ multipass exec loki -- bash
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.

ubuntu@loki:~$
```

Remembered in our cloud-init, we instructed this command to run:

```bash
echo "this is a test" | promtail --stdin --client.url http://localhost:3100/loki/api/v1/push --client.external-labels=app=cli -server.disable
```

So if we use logcli, we can inspect our visible labels:

```
$ logcli --quiet labels
__name__
app
hostname
job
```

And as we expect, we will see the app label from the `--client.external-labels=app=cli` argument that we passed. We can also look at the values for a given label:

```bash
$ logcli --quiet labels app
cli
```

Now let's query our logs using the label selector: `{app="cli"}`:

```bash
$ logcli --quiet --output raw query '{app="cli"}'
this is a test
```

If we remove the extra arguments, we will see more verbose output like the following:

```bash
$ logcli query '{app="cli"}'

http://localhost:3100/loki/api/v1/query_range?direction=BACKWARD&end=1605092055756745122&limit=30&query=%7Bapp%3D%22cli%22%7D&start=1605088455756745122
Common labels: {app="cli", hostname="loki", job="stdin"}
2020-11-11T12:45:20+02:00 {} this is a test
http://localhost:3100/loki/api/v1/query_range?direction=BACKWARD&end=1605091520778438972&limit=30&query=%7Bapp%3D%22cli%22%7D&start=1605088455756745122
Common labels: {app="cli", hostname="loki", job="stdin"}
```

We can pipe some more output to Loki:

```bash
$ echo "this is another test" | promtail --stdin --client.url http://localhost:3100/loki/api/v1/push --client.external-labels=app=cli -server.disable
```

And querying our logs:

```bash
$ logcli --quiet --output raw query '{app="cli"}'
this is another test
this is a test
```

## Testing Loki Outside our VM

Let's exit the VM and test Loki from our local workstation, first you will need to get the logcli for your OS, head over to the [releases](https://github.com/grafana/loki/releases) page and get the binary of your choice.

I will be demonstrating using a mac:

```bash
$ wget https://github.com/grafana/loki/releases/download/v2.0.0/logcli-darwin-amd64.zip
$ unzip logcli-darwin-amd64.zip
$ sudo mv logcli-darwin-amd64 /usr/local/bin/logcli
$ rm -f logcli-darwin-amd64.zip
```

Now we need to tell logcli where our Loki server resides, so let's get the IP address of Loki:

```bash
$ multipass info --all --format json | jq -r '.info.loki.ipv4[]'
192.168.64.19
```

We can either set the Loki host as an environment variable:

```bash
$ export LOKI_ADDR=http://192.168.64.19
```

or you can specify it using the `--addr` argument:

```bash
$ logcli --addr="http://192.168.64.19:3100"
```

For the sake of simplicity and not having to type the `--addr` the whole time, I will be setting the Loki address as an environment variable:

```bash
$ export LOKI_ADDR="http://$(multipass info --all --format json | jq -r '.info.loki.ipv4[]'):3100"
```

And when we inspect our labels using logcli, we can see that we are getting our labels from Loki on our Multipass VM:

```bash
$ logcli labels
http://192.168.64.19:3100/loki/api/v1/labels?end=1605093229877731000&start=1605089629877731000
__name__
app
hostname
job
```

## Write Logs to Loki using the Loki Docker Driver

We have used promtail before to pipe logs to Loki and in this example we will be making use of the Loki Docker Logging Plugin to write data to Loki.

If you have docker installed, install the Loki plugin:

```bash
$ docker plugin install \
  grafana/loki-docker-driver:latest \
  --alias loki \
  --grant-all-permissions
```

Now we will use a docker container to echo stdout to the loki docker driver, which will send the output to Loki.

Let's alias a command loki_echo that we will use to send our output to the docker container:

```bash
$ alias 'loki_echo=docker run --rm -it --log-driver loki --log-opt loki-url="http://192.168.64.19:3100/loki/api/v1/push" --log-opt loki-external-labels="app=echo-container" busybox echo'
```

So every time we run `loki_echo {string}` we will run a docker container from the busybox image and pass the `{string}` as an argument to the echo command inside the container, which will be sent to the loki log driver and land up in Loki.

Let's push 100 log events to Loki:

```bash
$ count=0
$ while [ ${count} != 100 ]
  do 
    for color in red blue white silver green;
    do 
      loki_echo "there are ${RANDOM} items of ${color} available";
      count=$((count+1))
    done
  done

there are 26890 items of green available
there are 14856 items of red available
there are 31162 items of blue available
there are 23993 items of white available
there are 22310 items of silver available
there are 10700 items of green available
there are 14077 items of red available
there are 20642 items of blue available
there are 31576 items of white available
there are 26053 items of silver available
there are 2973 items of green available
there are 2203 items of red available
there are 8557 items of blue available
...
```

We can verify how many log events we have with:

```
$ logcli query '{app="echo-container"}' --quiet --limit 200 --output raw | wc -l
100
```

To see how many logs we have with the line "blue" in it:

```bash
$ logcli query '{app="echo-container"} |= "blue"' --quiet --limit 200 --output raw | wc -l
20
```

Let's look for logs with blue or green and limit the results to 5:

```bash
$ logcli query '{app="echo-container"} |~ "items of (blue|green)"' --quiet --limit 5 --output raw
there are 28985 items of green available
there are 10289 items of blue available
there are 12316 items of green available
there are 23775 items of blue available
there are 20 items of green available
```

## Teardown

If you followed along, you can terminate your Multipass VM with:

```bash
$ multipass delete --purge loki
```

You can get the example code in my **[multipassfiles github repository](https://github.com/ruanbekker/multipassfiles/tree/master/loki)**

## Thanks

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.



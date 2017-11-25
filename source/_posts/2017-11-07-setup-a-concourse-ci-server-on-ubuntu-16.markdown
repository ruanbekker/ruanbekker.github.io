---
layout: post
title: "Setup a Concourse-CI Server on Ubuntu 16"
date: 2017-11-07 17:55:46 -0500
comments: true
categories: ["devops", "ci", "concourse", "automation", "ubuntu"] 
---

![](https://i.snag.gy/gzkdu9.jpg?nocache=1511644783495)

Concourse is a Pipeline Based Continious Integration system written in Go

## Resources:

- https://concourse.ci/
- https://github.com/concourse/concourse
- https://concourse.ci/hello-world.html
- https://github.com/starkandwayne/concourse-tutorial

## What is Concourse CI:

Concourse CI is a Continious Integration Platform. Concourse enables you to construct pipelines with a yaml configuration that can consist out of 3 core concepts, tasks, resources, and jobs that compose them. For more information about this have a look at their [docs](https://concourse.ci/concepts.html)

## What will we be doing today

We will setup a Concourse Server on Ubuntu 16.04 and run the traditional `Hello, World` pipeline

## Setup the Server:

Concourse needs `PostgresSQL 9.3+`

```bash
$ apt update && apt upgrade -y
$ apt install postgresql postgresql-contrib -y
$ systemctl enable postgresql
```

Create the Database and User for Concourse on Postgres:

```bash
$ sudo -u postgres createuser concourse
$ sudo -u postgres createdb --owner=concourse atc
```

Download the Concourse and Fly Cli Binaries:

```bash
$ wget https://github.com/concourse/concourse/releases/download/v3.6.0/concourse_linux_amd64
$ wget https://github.com/concourse/concourse/releases/download/v3.6.0/fly_linux_amd64
$ chmod +x concourse_linux_amd64 fly_linux_amd64
$ mv concourse_linux_amd64 /usr/bin/concourse
$ mv fly_linux_amd64 /usr/bin/fly
```

Create the Encryption Keys:

```bash
$ mkdir /etc/concourse
$ ssh-keygen -t rsa -q -N '' -f /etc/concourse/tsa_host_key
$ ssh-keygen -t rsa -q -N '' -f /etc/concourse/worker_key
$ ssh-keygen -t rsa -q -N '' -f /etc/concourse/session_signing_key
$ cp /etc/concourse/worker_key.pub /etc/concourse/authorized_worker_keys
```

Concourse Web Process Configuration:

```bash
$ cat /etc/concourse/web_environment

CONCOURSE_SESSION_SIGNING_KEY=/etc/concourse/session_signing_key
CONCOURSE_TSA_HOST_KEY=/etc/concourse/tsa_host_key
CONCOURSE_TSA_AUTHORIZED_KEYS=/etc/concourse/authorized_worker_keys
CONCOURSE_POSTGRES_SOCKET=/var/run/postgresql

CONCOURSE_BASIC_AUTH_USERNAME=admin
CONCOURSE_BASIC_AUTH_PASSWORD=secret
CONCOURSE_EXTERNAL_URL=http://10.20.30.40:8080
```

Concourse Worker Process Configuration:

```bash
$ cat /etc/concourse/worker_environment

CONCOURSE_WORK_DIR=/var/lib/concourse
CONCOURSE_TSA_WORKER_PRIVATE_KEY=/etc/concourse/worker_key
CONCOURSE_TSA_PUBLIC_KEY=/etc/concourse/tsa_host_key.pub
CONCOURSE_TSA_HOST=127.0.0.1
```

Create a Concourse user:

```bash
$ sudo adduser --system --group concourse
$ sudo chown -R concourse:concourse /etc/concourse
$ sudo chmod 600 /etc/concourse/*_environment
```

Create SystemD Unit Files, first for the Web Service:

```bash
$ cat /etc/systemd/system/concourse-web.service

[Unit]
Description=Concourse CI web process (ATC and TSA)
After=postgresql.service

[Service]
User=concourse
Restart=on-failure
EnvironmentFile=/etc/concourse/web_environment
ExecStart=/usr/bin/concourse web

[Install]
WantedBy=multi-user.target
```

Then the SystemD Unit File for the Worker Service:

```bash
$ cat /etc/systemd/system/concourse-worker.service

[Unit]
Description=Concourse CI worker process
After=concourse-web.service

[Service]
User=root
Restart=on-failure
EnvironmentFile=/etc/concourse/worker_environment
ExecStart=/usr/bin/concourse worker

[Install]
WantedBy=multi-user.target
```

Start and Enable the Services:

```bash
$ systemctl start concourse-web concourse-worker
$ systemctl enable concourse-web concourse-worker
$ systemctl status concourse-web concourse-worker

$ systemctl is-active concourse-worker concourse-web
active
active
```

The listening ports should more or less look like the following:

```bash
$ netstat -tulpn

Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 127.0.0.1:7777          0.0.0.0:*               LISTEN      4530/concourse
tcp        0      0 127.0.0.1:7788          0.0.0.0:*               LISTEN      4530/concourse
tcp        0      0 127.0.0.1:8079          0.0.0.0:*               LISTEN      4525/concourse
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      1283/sshd
tcp        0      0 127.0.0.1:5432          0.0.0.0:*               LISTEN      4047/postgres
tcp6       0      0 :::36159                :::*                    LISTEN      4525/concourse
tcp6       0      0 :::46829                :::*                    LISTEN      4525/concourse
tcp6       0      0 :::2222                 :::*                    LISTEN      4525/concourse
tcp6       0      0 :::8080                 :::*                    LISTEN      4525/concourse
tcp6       0      0 :::22                   :::*                    LISTEN      1283/sshd
udp        0      0 0.0.0.0:68              0.0.0.0:*                           918/dhclient
udp        0      0 0.0.0.0:42165           0.0.0.0:*                           4530/concourse
```

## Client Side:

I will be using a the Fly cli from a Mac, so first we need to download the fly-cli for Mac:

```bash
$ wget https://github.com/concourse/concourse/releases/download/v3.6.0/fly_darwin_amd64
$ chmod +x fly_darwin_amd64
$ alias fly='./fly_darwin_amd64'
```

Next, we need to setup our Concourse Target by Authenticating against our Concourse Endpoint, lets setup our target with the name `ci`:

```bash
$ fly -t ci login -c http://10.20.30.40:8080
logging in to team 'main'

username: admin
password:

target saved
```

Lets list our targets:

```bash
$ fly targets
name  url                        team  expiry
ci    http://10.20.30.40:8080    main  Wed, 08 Nov 2017 15:32:59 UTC
```

Listing Registered Workers:

```bash
$ fly -t ci workers
name              containers  platform  tags  team  state    version
ip-172-31-12-134  0           linux     none  none  running  1.2
```

Listing Active Containers:

```bash
$ fly -t ci containers
handle                                worker            pipeline     job            build #  build id  type   name                  attempt
```

## Hello World Pipeline:

Let's create a basic pipeline, that will print out `Hello, World!`:

Our `hello-world.yml`

```yml
jobs:
- name: my-job
  plan:
  - task: say-hello
    config:
      platform: linux
      image_resource:
        type: docker-image
        source:
          repository: alpine
          tag: edge
      run:
        path: /bin/sh
        args:
        - -c
        - |
          echo "============="
          echo "Hello, World!"
          echo "============="
```

Applying the configuration to our pipeline:

```bash
$ fly -t ci set-pipeline -p yeeehaa -c hello-world.yml
jobs:
  job my-job has been added:
    name: my-job
    plan:
    - task: say-hello
      config:
        platform: linux
        image_resource:
          type: docker-image
          source:
            repository: alpine
            tag: edge
        run:
          path: /bin/sh
          args:
          - -c
          - |
            echo "============="
            echo "Hello, World!"
            echo "============="

apply configuration? [yN]: y
pipeline created!
you can view your pipeline here: http://10.20.30.40:8080/teams/main/pipelines/yeeehaa

the pipeline is currently paused. to unpause, either:
  - run the unpause-pipeline command
  - click play next to the pipeline in the web ui
```

We can browse to the WebUI to unpause the pipeline, but since I like to do everything on cli as far as possible, I will unpause the pipeline via cli:

```bash
$ fly -t ci unpause-pipeline -p yeeehaa
unpaused 'yeeehaa'
```

Now our Pipeline is unpaused, but since we did not specify any triggers, we need to manually trigger the pipeline to run, you can either via the WebUI, select your pipeline which in this case will be named `yeeehaa` and then select the job, which will be `my-job` then hit the `+` sign, which will trigger the pipeline.

I will be using the cli:

```bash
$ fly -t ci trigger-job --job yeeehaa/my-job
started yeeehaa/my-job #1
```

Via the WebUI on `http://10.20.30.40:8080/teams/main/pipelines/yeeehaa/jobs/my-job/builds/1` you should see the `Hello, World!` output, or via the cli, we also have the option to see the output, so let's trigger it again, but this time passing the `--watch` flag:

```bash
$ fly -t ci trigger-job --job yeeehaa/my-job --watch
started yeeehaa/my-job #2

initializing
running /bin/sh -c echo "============="
echo "Hello, World!"
echo "============="

=============
Hello, World!
=============
succeeded
```

Listing our Workers and Containers again:

```bash
$ fly -t ci workers
name              containers  platform  tags  team  state    version
ip-172-31-12-134  2           linux     none  none  running  1.2

$ fly -t ci containers
handle                                worker            pipeline     job         build #  build id  type   name           attempt
36982955-54fd-4c1b-57b8-216486c58db8  ip-172-31-12-134  yeeehaa      my-job      2        729       task   say-hello      n/a
```



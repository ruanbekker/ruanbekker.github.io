---
layout: post
title: "Deploy Docker Swarm using Ansible"
date: 2018-06-14 06:05:46 -0400
comments: true
categories: ["docker", "swarm", "ansible", "devops"]
---

![](https://user-images.githubusercontent.com/567298/53351889-85572000-392a-11e9-9720-464e9318206e.jpg)

In this setup we will use Ansible to Deploy Docker Swarm.

With this setup, I have a client node, which will be my jump box, as it will be used to ssh with the docker user to my swarm nodes with passwordless ssh access.

The repository for the source code can be found on my [Github Repository](https://github.com/ruanbekker/ansible-docker-swarm)

<script id="mNCC" language="javascript">
    medianet_width = "728";
    medianet_height = "90";
    medianet_crid = "218284798";
    medianet_versionId = "3111299"; 
  </script>
<script src="//contextual.media.net/nmedianet.js?cid=8CUD78FSV"></script>

## Pre-Check

Hosts file: 

```
$ cat /etc/hosts
10.0.8.2 client
192.168.1.10 swarm-manager
192.168.1.11 swarm-worker-1
192.168.1.12 swarm-worker-2
```

SSH Config:

```
$ cat ~/.ssh/config 
Host client
  Hostname client
  User root
  IdentityFile /tmp/key.pem
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null

Host swarm-manager
  Hostname swarm-manager
  User root
  IdentityFile /tmp/key.pem
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null

Host swarm-worker-1
  Hostname swarm-worker-1
  User root
  IdentityFile /tmp/key.pem
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null

Host swarm-worker-2
  Hostname swarm-worker-2
  User root
  IdentityFile /tmp/key.pem
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
```

Install Ansible:

```
$ apt install python-setuptools -y
$ easy_install pip
$ pip install ansible
```

Ensure passwordless ssh is working:

```
$ ansible -i inventory.ini -u root -m ping all
client | SUCCESS => {
    "changed": false, 
    "ping": "pong"
}
swarm-manager | SUCCESS => {
    "changed": false, 
    "ping": "pong"
}
swarm-worker-2 | SUCCESS => {
    "changed": false, 
    "ping": "pong"
}
swarm-worker-1 | SUCCESS => {
    "changed": false, 
    "ping": "pong"
}
```

## Deploy Docker Swarm

```
$ ansible-playbook -i inventory.ini -u root deploy-swarm.yml 
PLAY RECAP 

client                     : ok=11   changed=3    unreachable=0    failed=0   
swarm-manager              : ok=18   changed=4    unreachable=0    failed=0   
swarm-worker-1             : ok=15   changed=1    unreachable=0    failed=0   
swarm-worker-2             : ok=15   changed=1    unreachable=0    failed=0   
```

SSH to the Swarm Manager and List the Nodes:

```
$ docker node ls
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS      ENGINE VERSION
0ead0jshzkpyrw7livudrzq9o *   swarm-manager       Ready               Active              Leader              18.03.1-ce
iwyp6t3wcjdww0r797kwwkvvy     swarm-worker-1      Ready               Active                                  18.03.1-ce
ytcc86ixi0kuuw5mq5xxqamt1     swarm-worker-2      Ready               Active                                  18.03.1-ce
```

## Test Application on Swarm

Create a Nginx Demo Service:

```
$ docker network create --driver overlay appnet
$ docker service create --name nginx --publish 80:80 --network appnet --replicas 6 nginx
$ docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE               PORTS
k3vwvhmiqbfk        nginx               replicated          6/6                 nginx:latest        *:80->80/tcp

$ docker service ps nginx
ID                  NAME                IMAGE               NODE                DESIRED STATE       CURRENT STATE            ERROR               PORTS
tspsypgis3qe        nginx.1             nginx:latest        swarm-manager       Running             Running 34 seconds ago                       
g2f0ytwb2jjg        nginx.2             nginx:latest        swarm-worker-1      Running             Running 34 seconds ago                       
clcmew8bcvom        nginx.3             nginx:latest        swarm-manager       Running             Running 34 seconds ago                       
q293r8zwu692        nginx.4             nginx:latest        swarm-worker-2      Running             Running 34 seconds ago                       
sv7bqa5e08zw        nginx.5             nginx:latest        swarm-worker-1      Running             Running 34 seconds ago                       
r7qg9nk0a9o2        nginx.6             nginx:latest        swarm-worker-2      Running             Running 34 seconds ago   
```

Test the Application:

```
$ curl -i http://192.168.1.10
HTTP/1.1 200 OK
Server: nginx/1.15.0
Date: Thu, 14 Jun 2018 10:01:34 GMT
Content-Type: text/html
Content-Length: 612
Last-Modified: Tue, 05 Jun 2018 12:00:18 GMT
Connection: keep-alive
ETag: "5b167b52-264"
Accept-Ranges: bytes
```

Delete the Service:

```

$ docker service rm nginx
nginx
```

## Delete the Swarm:

```
$ ansible-playbook -i inventory.ini -u root delete-swarm.yml 

PLAY RECAP 
swarm-manager              : ok=2    changed=1    unreachable=0    failed=0   
swarm-worker-1             : ok=2    changed=1    unreachable=0    failed=0   
swarm-worker-2             : ok=2    changed=1    unreachable=0    failed=0   
```

Ensure the Nodes is removed from the Swarm, SSH to your Swarm Manager:

```
$ docker node ls
Error response from daemon: This node is not a swarm manager. Use "docker swarm init" or "docker swarm join" to connect this node to swarm and try again.
```



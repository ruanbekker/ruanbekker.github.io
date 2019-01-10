---
layout: post
title: "Setup a 3 Node Docker Swarm Cluster on Ubuntu 16.04"
date: 2019-01-10 09:52:07 -0500
comments: true
categories: ["docker", "swarm", "ubuntu", "clustering", "cluster"]
---

![](http://obj-cache.cloud.ruanbekker.com/docker-logo.png)

Docker Swarm is a Clustering and Orchestration Framework for the Docker ecosystem. Have a look at their [official documentation](https://docs.docker.com/engine/swarm/) for detailed information.

In this Tutorial we will Setup a 3 Node Docker Swarm Cluster and to Demonstrate How Easy it is to Deploy a Web Application with 2 Replicas from a Docker Image.

## Overview of What we will be Doing

- Install Docker on 3 Servers with Ubuntu 16.04
- Initialize the Swarm and Join the Worker Nodes
- Create a Nginx Service with 2 Replicas
- Do some Inspection: View some info on the Service

##  Prerequisites

3 Fresh Deployed Ubuntu 16.04 Servers. ( 1GB Memory Servers will be good for development )

## What is Docker

Docker is a Open Source Technology that allows you to create lightweight, isolated, reproducible application instances which is called Containers. Docker is built on top of the LXC technology, so it uses Linux Containers and as mentioned, it's lightweight compared to a traditional VM.

A Container is isolated and uses the Kernel of the Docker host, it also utilizes Kernel features such as cgroups and namespaces in order to make them isolated.

## Installing Docker Community Edition

Remove any older versions of Docker that might be present and install the dependencies:

```bash
$ sudo apt remove docker docker-engine -y
$ sudo apt install linux-image-extra-$(uname -r) linux-image-extra-virtual python-setuptools -y
$ sudo apt install apt-transport-https ca-certificates curl software-properties-common -y
```

Get the needed repository to setup Docker Community Edition:

```bash
$ curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
$ sudo apt-key fingerprint 0EBFCD88
$ sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
```

Update the repository index and Install Docker Community Edition:

```bash
$ sudo apt update
$ sudo apt install docker-ce -y
$ sudo easy_install pip
$ sudo pip install docker-compose
```

Enable Docker on Startup and Start the Docker Engine:

```bash
$ sudo systemctl enable docker
$ sudo systemctl restart docker
```

If you would like to execute your docker commands without sudo, add your user to the docker group:

```bash
$ sudo usermod -aG docker $(whoami)
```

Test your Setup by Running a Hello World Container. You will see that if the image is not in the local docker image cache, it will pull the image from docker hub (or the respective docker registry), then once the image is saved locally, docker will then instantiate the container from that image:


```bash
$ docker run hello-world
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
78445dd45222: Pull complete
Digest: sha256:c5515758d4c5e1e838e9cd307f6c6a0d620b5e07e6f927b07d05f6d12a1ac8d7
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.
```

## DNS Configuration

If you have a DNS Server you can configure the A Records for these hosts on DNS, but for simplicity, I will add the noted IP Addresses from the previous step into my `/etc/hosts` file so we can resolve names to IP's

Open up the the hosts file:

```bash
$ sudo vim /etc/hosts
```

In my example, my IP Addresses:

```
192.0.2.41  manager
192.0.2.42  worker-1
192.0.2.43  worker-2
```

Repeat the above steps on the other 2 Servers and make note of the IP Addresses of each node. You should be able to ping and reach the nodes that was configured. Make sure to allow all traffic between these nodes.

## Initialize the Swarm:

Now we will initialize the swarm on the manager node and as we have more than one network interface, we will specify the --advertise-addr option:

```bash
$ docker swarm init --advertise-addr 192.0.2.41
Swarm initialized: current node (siqyf3yricsvjkzvej00a9b8h) is now a manager.

    To add a worker to this swarm, run the following command:

    docker swarm join \
    --token SWMTKN-1-0eith07xkcg93lzftuhjmxaxwfa6mbkjsmjzb3d3sx9cobc2zp-97s6xzdt27y2gk3kpm0cgo6y2 \
    192.0.2.41:2377

    To add a manager to this swarm, run 'docker swarm join-token manager' and follow the instructions.
```

From the response above, we received the join token that allows the workers to register with the manager node. If its a scenario where you want to have more than one manager node, you can run `docker swarm join-token manager` to receive the join token for additional manager.

Let's add the two worker nodes to the manager:

```bash
$ [worker-1] docker swarm join --token SWMTKN-1-0eith07xkcg93lzftuhjmxaxwfa6mbkjsmjzb3d3sx9cobc2zp-97s6xzdt27y2gk3kpm0cgo6y2 192.0.2.41:2377
This node joined a swarm as a worker.
```

```bash
$ [worker-2] docker swarm join --token SWMTKN-1-0eith07xkcg93lzftuhjmxaxwfa6mbkjsmjzb3d3sx9cobc2zp-97s6xzdt27y2gk3kpm0cgo6y2 192.0.2.41:2377
This node joined a swarm as a worker.
```

To see the node status, so that we can determine if the nodes are active/available etc, from the manager node, list all the nodes in the swarm:

```bash
[manager] $ docker node ls
ID                           HOSTNAME  STATUS  AVAILABILITY  MANAGER STATUS
j14mte3v1jhtbm3pb2qrpgwp6    worker-1  Ready   Active 
siqyf3yricsvjkzvej00a9b8h *  master    Ready   Active        Leader
srl5yzme5hxnzxal2t1efmwje    worker-2  Ready   Active
```

## Reobtaining the Join Tokens 

If at any time, you lost your join token, it can be retrieved by running the following for the manager token:

```bash
$ docker swarm join-token manager -q SWMTKN-1-67chzvi4epx28ii18gizcia8idfar5hokojz660igeavnrltf0-09ijujbnnh4v960b8xel58pmj
```

And the following to retrieve the worker token:

```bash
$ docker swarm join-token worker -q SWMTKN-1-67chzvi4epx28ii18gizcia8idfar5hokojz660igeavnrltf0-acs21nn28v17uwhw0oqg5ibwx
```

Swarm Services in Docker uses a declarative model which means that you define the desired state of the service, and rely on Docker to maintain this state. More information on this can be found on their [Documentation](https://docs.docker.com/engine/swarm/how-swarm-mode-works/services/) 

At this moment, we will see that we have no services running in our swarm:

```bash
[manager] $ docker service ls
ID  NAME  MODE  REPLICAS  IMAGE
```

## Deploying our First Service

Now onto the creation of a standard nginx service with 2 replicas, which means that there will be 2 containers of nginx running in our swarm.

But first, we need to create a overlay network, which is a network driver that creates a distributed network among multiple Docker daemon hosts. Swarm takes care of the routing automatically, which is routed via the port mappings. So you can have that your container sits on worker-2, when you hit your manager node on the published port, it will route the request to the desired application that resides on the respective container.

To create a overlay network called mynet:

```bash
[manager] $ docker network create --driver overlay mynet
```

Now onto creating the Service. If any of these containers fail, they will handled by the manager node and will be spawned again to have the desired number that we set on the replica option:

```bash
[manager] $ docker service create --name my-web --publish 8080:80 --replicas 2 --network mynet nginx
```

Let's have a look at our nginx service:

```bash
[manager] $ docker service ls
ID            NAME    MODE        REPLICAS  IMAGE
1okycpshfusq  my-web  replicated  2/2       nginx:latest
```

After we see that the replica count is 2/2 our service is ready.

To see on which nodes our containers are running that makes up our service:

```bash
[manager] $ docker service ps my-web
ID            NAME      IMAGE         NODE      DESIRED STATE  CURRENT STATE           ERROR  PORTS
k0qqrh8s0c2d  my-web.1  nginx:latest  worker-1  Running        Running 30 seconds ago
nku9wer6tmll  my-web.2  nginx:latest  worker-2  Running        Running 30 seconds ago
```

From the above output, we can see that worker-1 and worker-2 are serving our containers for our service. We can also retrieve more information of our service by using the inspect option, which will give you a detailed response in json format of the service:

```bash
[manager] $ docker service inspect my-web
```

We can get the Endpoint Port info by using inspect and using the --format parameter to filter the output:

```bash
[manager] $ docker service inspect --format="{{json .Endpoint.Ports}}" my-web  | python -m json.tool
```

From the output we will find the PublishedPort is the Port that we Expose, which will be the listener. Our TargetPort will be the port that is listening on the container:

```json
[
    {
        "Protocol": "tcp",
        "PublishMode": "ingress",
        "PublishedPort": 8080,
        "TargetPort": 80
    }
]
```

Now that we went through the inspection of our service, its time to test our base nginx service.

## Testing Nginx in our Swarm

Make a request against your docker node manager address on the port that was exposed, in this case 8080:

```bash
$ curl -I http://docker-node-manager-ip:8080

HTTP/1.1 200 OK
Server: nginx/1.15.5
Date: Thu, 10 Jan 2019 14:48:40 GMT
Content-Type: text/html
Content-Length: 612
Last-Modified: Tue, 02 Oct 2018 14:49:27 GMT
Connection: keep-alive
ETag: "5bb38577-264"
Accept-Ranges: bytes
```

Now we have successfull setup a 3 node docker swarm cluster and deployed a basic nginx service to our swarm. Please have a look at my other [Docker Swarm Tutorials](https://blog.ruanbekker.com/blog/categories/docker/) for other content.

## Thank You

Please feel free to show support by, **sharing** this post, making a **donation**, **subscribing** or **reach out to me** if you want me to demo and write up on any specific tech topic.

<center>
<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
<input type="hidden" name="cmd" value="_s-xclick" />
<input type="hidden" name="hosted_button_id" value="W7CBGYTCWGANQ" />
<input type="image" src="https://user-images.githubusercontent.com/567298/49853901-461c3700-fdf1-11e8-9d80-8a424a3173af.png" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
</form>
</center>

<br>

Ad space:

<script type="text/javascript">
  ( function() {
    if (window.CHITIKA === undefined) { window.CHITIKA = { 'units' : [] }; };
    var unit = {"calltype":"async[2]","publisher":"rbekker87","width":728,"height":90,"sid":"Chitika Default"};
    var placement_id = window.CHITIKA.units.length;
    window.CHITIKA.units.push(unit);
    document.write('<div id="chitikaAdBlock-' + placement_id + '"></div>');
}());
</script>
<script type="text/javascript" src="//cdn.chitika.net/getads.js" async></script>

<p>

Thanks for reading!

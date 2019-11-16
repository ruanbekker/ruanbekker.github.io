---
layout: post
title: "How To Setup a AWS EKS Kubernetes Cluster"
date: 2019-11-16 22:31:36 +0200
description: "Ruan Bekker shows you how to deploy a Kubernetes Cluster on Amazon Web Services with their EKS offering"
comments: true
categories: ["aws", "kubernetes", "eks"] 
---

![kubernetes-eks-aws-cluster](https://user-images.githubusercontent.com/567298/68999066-b8c84900-08c3-11ea-9669-5c859590296c.png)

[![Say Thanks!](https://img.shields.io/badge/Say%20Thanks-!-1EAEDB.svg)](https://saythanks.io/to/ruanbekker) [![Slack Status](https://linux-hackers-slack.herokuapp.com/badge.svg)](https://linux-hackers-slack.herokuapp.com/) [![Chat on Slack](https://img.shields.io/badge/chat-on_slack-orange.svg)](https://linux-hackers.slack.com/) [![GitHub followers](https://img.shields.io/github/followers/ruanbekker.svg?label=Follow&style=social)](https://github.com/ruanbekker)

<a href="https://twitter.com/ruanbekker?ref_src=twsrc%5Etfw" class="twitter-follow-button" data-show-count="false">Follow @ruanbekker</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

This will be a tutorial split up in two posts, where I will show you how to provision a EKS Cluster (Elastic Kubernetes Service) on AWS and in the next post, how to deploy a web application to your cluster.

## And then came EKS

As some of you may know, I'm a massive AWS fan boy, and since AWS released their managed Kubernetes service, I was quite excited to test it out. A couple of months passed and I got the opportunity to test out on-the-job as we moved to Kubernetes.

A couple of moths has passed, and serving multiple production workloads on EKS, and I am really impressed with the service.

Amazon provides a vanilla Kubernetes version, they manage the master nodes and they have a extra component called the cloud controller that runs on the master nodes, which is the aws native component that talks to other aws services (as far as I can recall)

## What are we doing today

We will cover this in this post:

| **Topic**                                                    |
|------------------------------------------------------------- |
| Deploy a EKS Cluster                                         |
| View the resources to see what was provisioned on AWS        |
| Interact with Kubernetes using kubectl                       |
| Terminate a Node and verify that the ASG replaces the node   |
| Scale down your worker nodes                                 |
| Run a pod on your cluster                                    |

In the [next post]() we will deploy a web service to our EKS cluster.

## Install Pre-Requirements

We require `awscli`, `eksctl` and `kubectl` before we continue. I will be installing this on MacOS, but you can have a look at the following links if you are using a different operating system:

- [Install awscli](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)
- [Install eksctl](https://docs.aws.amazon.com/eks/latest/userguide/getting-started-eksctl.html)
- [Install kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)

Install awscli:

```
$ pip install awscli
```

Install kubectl:

```
$ brew update
$ brew install kubernetes-cli
```

Install eksctl:

```
$ brew tap weaveworks/tap
$ brew install weaveworks/tap/eksctl
```

## Deploy EKS

Create a SSH key if you would like to SSH to your worker nodes:

```
$ ssh-keygen -b 2048 -f ~/.ssh/eks -t rsa -q -N ""
```

Import your public key to EC2:

```
$ aws --profile dev --region eu-west-1 ec2 import-key-pair --key-name "eks" --public-key-material file://~/.ssh/eks.pub
```

Provision your cluster using eksctl. This will deploy two cloudformation stacks, one for the kubernetes cluster, and one for the node group.

I am creating a kubernetes cluster with 3 nodes of instance type (t2.small) and using version 1.14:

```
$ eksctl --profile dev --region eu-west-1 create cluster --name my-eks-cluster --version 1.14 --nodes 3 --node-type t2.small --ssh-public-key eks

[ℹ]  eksctl version 0.9.0
[ℹ]  using region eu-west-1
[ℹ]  setting availability zones to [eu-west-1a eu-west-1b eu-west-1c]
[ℹ]  subnets for eu-west-1a - public:192.168.0.0/19 private:192.168.96.0/19
[ℹ]  subnets for eu-west-1b - public:192.168.32.0/19 private:192.168.128.0/19
[ℹ]  subnets for eu-west-1c - public:192.168.64.0/19 private:192.168.160.0/19
[ℹ]  nodegroup "ng-f27f560e" will use "ami-059c6874350e63ca9" [AmazonLinux2/1.14]
[ℹ]  using Kubernetes version 1.14
[ℹ]  creating EKS cluster "my-eks-cluster" in "eu-west-1" region
[ℹ]  will create 2 separate CloudFormation stacks for cluster itself and the initial nodegroup
[ℹ]  if you encounter any issues, check CloudFormation console or try 'eksctl utils describe-stacks --region=eu-west-1 --cluster=my-eks-cluster'
[ℹ]  CloudWatch logging will not be enabled for cluster "my-eks-cluster" in "eu-west-1"
[ℹ]  you can enable it with 'eksctl utils update-cluster-logging --region=eu-west-1 --cluster=my-eks-cluster'
[ℹ]  Kubernetes API endpoint access will use default of {publicAccess=true, privateAccess=false} for cluster "my-eks-cluster" in "eu-west-1"
[ℹ]  2 sequential tasks: { create cluster control plane "my-eks-cluster", create nodegroup "ng-f27f560e" }
[ℹ]  building cluster stack "eksctl-my-eks-cluster-cluster"
[ℹ]  deploying stack "eksctl-my-eks-cluster-cluster"
[ℹ]  building nodegroup stack "eksctl-my-eks-cluster-nodegroup-ng-f27f560e"
[ℹ]  --nodes-min=3 was set automatically for nodegroup ng-f27f560e
[ℹ]  --nodes-max=3 was set automatically for nodegroup ng-f27f560e
[ℹ]  deploying stack "eksctl-my-eks-cluster-nodegroup-ng-f27f560e"
[+]  all EKS cluster resources for "my-eks-cluster" have been created
[+]  saved kubeconfig as "/Users/ruan/.kube/config"
[ℹ]  adding identity "arn:aws:iam::000000000000:role/eksctl-my-eks-cluster-nodegroup-n-NodeInstanceRole-SNVIW5C3J3SM" to auth ConfigMap
[ℹ]  nodegroup "ng-f27f560e" has 0 node(s)
[ℹ]  waiting for at least 3 node(s) to become ready in "ng-f27f560e"
[ℹ]  nodegroup "ng-f27f560e" has 3 node(s)
[ℹ]  node "ip-192-168-42-186.eu-west-1.compute.internal" is ready
[ℹ]  node "ip-192-168-75-87.eu-west-1.compute.internal" is ready
[ℹ]  node "ip-192-168-8-167.eu-west-1.compute.internal" is ready
[ℹ]  kubectl command should work with "/Users/ruan/.kube/config", try 'kubectl get nodes'
[+]  EKS cluster "my-eks-cluster" in "eu-west-1" region is ready
```

Now that our EKS cluster has been provisioned, let's browse through our AWS Management Console to understand what was provisioned.

## View the Provisioned Resources

If we have a look at the Cloudformation stacks, we can see the two stacks that I mentioned previously:

<img width="1057" alt="image" src="https://user-images.githubusercontent.com/567298/68996480-58c1aa80-08a3-11ea-95c1-0fcf0bc1863b.png">

Navigating to our EC2 Instances dashboard, we can see the three worker nodes that we provisioned. Remember that AWS manages the master nodes and we cant see them.

<img width="1106" alt="image" src="https://user-images.githubusercontent.com/567298/68996520-ea311c80-08a3-11ea-8ea3-e9e481e4ba6f.png">

We have a ASG (Auto Scaling Group) associated with our worker nodes, nodegroup. We can make use of autoscaling and also have desired state, so we will test this out later where we will delete a worker node and verify if it gets replaced:

<img width="1113" alt="image" src="https://user-images.githubusercontent.com/567298/68996551-2e242180-08a4-11ea-8df6-7b962b9aa03a.png">

## Navigate using Kubectl:

Eksctl already applied the kubeconfig to `~/.kube/config`, so we can start using kubectl. Let's start by viewing the nodes:

```
$ kubectl get nodes
NAME                                           STATUS   ROLES    AGE     VERSION
ip-192-168-42-186.eu-west-1.compute.internal   Ready    <none>   8m50s   v1.14.7-eks-1861c5
ip-192-168-75-87.eu-west-1.compute.internal    Ready    <none>   8m55s   v1.14.7-eks-1861c5
ip-192-168-8-167.eu-west-1.compute.internal    Ready    <none>   8m54s   v1.14.7-eks-1861c5
```

Viewing our pods from our `kube-system` namespace (we dont have any pods in our default namespace at the moment):

```
$ kubectl get pods --namespace kube-system
NAME                       READY   STATUS    RESTARTS   AGE
aws-node-btfbk             1/1     Running   0          11m
aws-node-c6ktk             1/1     Running   0          11m
aws-node-wf8mc             1/1     Running   0          11m
coredns-759d6fc95f-ljxzf   1/1     Running   0          17m
coredns-759d6fc95f-s6lg6   1/1     Running   0          17m
kube-proxy-db46b           1/1     Running   0          11m
kube-proxy-ft4mc           1/1     Running   0          11m
kube-proxy-s5q2w           1/1     Running   0          11m
```

And our services from all our namespaces:

```
$ kubectl get services --all-namespaces
NAMESPACE     NAME         TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)         AGE
default       kubernetes   ClusterIP   10.100.0.1    <none>        443/TCP         19m
kube-system   kube-dns     ClusterIP   10.100.0.10   <none>        53/UDP,53/TCP   19m
```

## Testing the ASG

Let's view our current nodes in our cluster, then select the first node, delete it and verify if the ASG replaces that node.

First, view the nodes and select one node's address:

```
$ kubectl get nodes
NAME                                           STATUS   ROLES    AGE   VERSION
ip-192-168-42-186.eu-west-1.compute.internal   Ready    <none>   37m   v1.14.7-eks-1861c5
ip-192-168-75-87.eu-west-1.compute.internal    Ready    <none>   37m   v1.14.7-eks-1861c5
ip-192-168-8-167.eu-west-1.compute.internal    Ready    <none>   37m   v1.14.7-eks-1861c5
```

Use the awscli to lookup the EC2 instance id, as we will need this id to delete the node:

```
$ aws --profile dev ec2 describe-instances --query 'Reservations[*].Instances[?PrivateDnsName==`ip-192-168-42-186.eu-west-1.compute.internal`].[InstanceId][]' --output text
i-0d016de17a46d5178
```

Now that we have the EC2 instance id, delete the node:

```
$ aws --profile dev ec2 terminate-instances --instance-id i-0d016de17a46d51782
{
    "TerminatingInstances": [
        {
            "CurrentState": {
                "Code": 32,
                "Name": "shutting-down"
            },
            "InstanceId": "i-0d016de17a46d5178",
            "PreviousState": {
                "Code": 16,
                "Name": "running"
            }
        }
    ]
}
```

Now that we have deleted the EC2 instance, view the nodes and you will see the node has been terminated:

```
$ kubectl get nodes
NAME                                          STATUS   ROLES    AGE   VERSION
ip-192-168-75-87.eu-west-1.compute.internal   Ready    <none>   41m   v1.14.7-eks-1861c5
ip-192-168-8-167.eu-west-1.compute.internal   Ready    <none>   41m   v1.14.7-eks-1861c5
```

Allow about a minute so that the ASG can replace the node, and when you list again you will see that the ASG replaced the node :

```
$ kubectl get nodes
NAME                                          STATUS   ROLES    AGE   VERSION
ip-192-168-42-61.eu-west-1.compute.internal   Ready    <none>   50s   v1.14.7-eks-1861c5
ip-192-168-75-87.eu-west-1.compute.internal   Ready    <none>   42m   v1.14.7-eks-1861c5
ip-192-168-8-167.eu-west-1.compute.internal   Ready    <none>   42m   v1.14.7-eks-1861c5
```

## Run a Pod

Run a busybox pod on your EKS cluster:

```
$ kubectl run --rm -it --generator run-pod/v1 my-busybox-pod --image busybox -- /bin/sh
```

You will be dropped into a shell:

```
/ # busybox | head -1
BusyBox v1.31.1 (2019-10-28 18:40:01 UTC) multi-call binary.
```

And exit the shell:

```
/ # exit
Session ended, resume using 'kubectl attach my-busybox-pod -c my-busybox-pod -i -t' command when the pod is running
pod "my-busybox-pod" deleted
```

## Scaling Nodes

While I will not be covering auto-scaling in this post, we can manually scale the worker node count. Let's scale it down to 1 node.

First we need to get the EKS cluster name:

```
$ eksctl --profile dev --region eu-west-1 get clusters
NAME		REGION
my-eks-cluster	eu-west-1
```

Then we need the node group id:

```
$ eksctl --profile dev --region eu-west-1 get nodegroup --cluster my-eks-cluster
CLUSTER		NODEGROUP	CREATED			MIN SIZE	MAX SIZE	DESIRED CAPACITY	INSTANCE TYPE	IMAGE ID
my-eks-cluster	ng-f27f560e	2019-11-16T16:55:41Z	3		3		3			t2.small	ami-059c6874350e63ca9
```

Now that we have the node group id, we can scale the node count:

```
$ eksctl --profile dev --region eu-west-1 scale nodegroup --cluster my-eks-cluster --nodes 1 ng-f27f560e

[ℹ]  scaling nodegroup stack "eksctl-my-eks-cluster-nodegroup-ng-f27f560e" in cluster eksctl-my-eks-cluster-cluster
[ℹ]  scaling nodegroup, desired capacity from 3 to 1, min size from 3 to 1
```

Now when we use kubectl to view the nodes, we will see we only have 1 worker node:

```
$ kubectl get nodes
NAME                                          STATUS   ROLES    AGE   VERSION
ip-192-168-8-167.eu-west-1.compute.internal   Ready    <none>   73m   v1.14.7-eks-1861c5
```

## Clean Up

If you want to follow along deploying a web application to your EKS cluster before we terminate the cluster, have a look at [Part 2 - EKS Tutorial]() before continuing.

Once you are ready to terminate your EKS cluster, you can go ahead and terminate the cluster:

```
$ eksctl --profile dev --region eu-west-1 delete cluster --name my-eks-cluster

[ℹ]  eksctl version 0.9.0
[ℹ]  using region eu-west-1
[ℹ]  deleting EKS cluster "my-eks-cluster"
[+]  kubeconfig has been updated
[ℹ]  cleaning up LoadBalancer services
[ℹ]  2 sequential tasks: { delete nodegroup "ng-f27f560e", delete cluster control plane "my-eks-cluster" [async] }
[ℹ]  will delete stack "eksctl-my-eks-cluster-nodegroup-ng-f27f560e"
[ℹ]  waiting for stack "eksctl-my-eks-cluster-nodegroup-ng-f27f560e" to get deleted
[ℹ]  will delete stack "eksctl-my-eks-cluster-cluster"
[+]  all cluster resources were deleted
```

## Further Reading on Kubernetes

This is one amazing resource that covers a lot of kubernetes topics and will help you throughout your EKS journey:
* [EKSWorkshop](https://eksworkshop.com/introduction/)

## Thank You

Let me know what you think. If you liked my content, feel free to checkout my content on **[ruan.dev](https://ruan.dev/)** or follow me on twitter at **[@ruanbekker](https://twitter.com/ruanbekker)**

<center><script type='text/javascript' src='https://ko-fi.com/widgets/widget_2.js'></script><script type='text/javascript'>kofiwidget2.init('Buy Me a Coffee', '#46b798', 'A6423ZIQ');kofiwidget2.draw();</script></center>

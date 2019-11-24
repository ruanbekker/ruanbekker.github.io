---
layout: post
title: "How to Setup VPC Peering on AWS"
date: 2019-11-23 09:09:40 +0200
comments: true
categories: ["aws", "networks", "vpc"]
---

[![Say Thanks!](https://img.shields.io/badge/Say%20Thanks-!-1EAEDB.svg)](https://saythanks.io/to/ruanbekker) [![Slack Status](https://linux-hackers-slack.herokuapp.com/badge.svg)](https://linux-hackers-slack.herokuapp.com/) [![Chat on Slack](https://img.shields.io/badge/chat-on_slack-orange.svg)](https://linux-hackers.slack.com/) [![GitHub followers](https://img.shields.io/github/followers/ruanbekker.svg?label=Follow&style=social)](https://github.com/ruanbekker)

<a href="https://twitter.com/ruanbekker?ref_src=twsrc%5Etfw" class="twitter-follow-button" data-show-count="false">Follow @ruanbekker</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

In this tutorial I will demonstrate how to create a VPC Peering Connection between Two AWS Accounts and how to route traffic between them and then show you how we create Two EC2 Instances and demonstrate how to SSH to each other via it's Private IP Address.

## Scenario Information

We will have Two AWS Accounts in this demonstration, a "Green AWS Account" and a "Blue AWS Account". 

In this scenario, we will have two teams, both teams manage their own account and in this scenario the two teams need to be able to communicate to each other. To keep it simple, each team has a EC2 instance and the two EC2 instances need to be able to communicate with each other.

Therefore we will setup a VPC Peering Connection between the two accounts. Both accounts will be operating in the eu-west-2 (London) region.

```
Account, CIDR
green: 10.1.0.0/16
blue:  10.2.0.0/16
```

## Getting Started

This will be our **Green** AWS Account:

<img width="1291" alt="140424C7-6FD5-4D74-AD26-AA1077D3DA92" src="https://user-images.githubusercontent.com/567298/69486624-55579180-0e56-11ea-897c-55607680fb58.png">

This will be our **Blue** AWS Account: 

![AAFBF715-897D-4D54-BDF2-9A5282A60165](https://user-images.githubusercontent.com/567298/69486632-61435380-0e56-11ea-86d1-3af018fe5fe3.png)

## Creating the VPCs

From our **green** account, head over to VPC and create a new VPC with a CIDR of `10.1.0.0/16`:

<img width="1291" alt="55FB3F87-9F73-4CDD-845B-8748700B0981" src="https://user-images.githubusercontent.com/567298/69486652-d6af2400-0e56-11ea-9f4d-9331001625f4.png">

Then head over to the **blue** account, head over to VPC and create a new VPC with CIDR of `10.2.0.0/16`:

![854DC039-7F83-4E6F-BD28-6843BE417EEB](https://user-images.githubusercontent.com/567298/69486659-f1819880-0e56-11ea-8c3c-5aff2f84e2aa.png)

So in summary we have the following resources:

```
Green: vpc-0af4b247a1353b78b | 10.1.0.0/16
Blue: vpc-031c4ce3f56660c30 | 10.2.0.0/16
```

## Creating the Subnets

Now we need to create subnets for the VPC's that we created. We will create the following subnets in our VPC, each subnet in its own availability zone:

```
10.1.0.0/20 (az-2a)
10.1.16.0/20 (az-2b)
10.1.32.0/20 (az-2c)
```

Let's go ahead and do this, head over to your **green** account, from the VPC section select "Subnets":

<img width="1292" alt="BBB38DDB-D9CF-4BD4-AEA0-C30B6998F016" src="https://user-images.githubusercontent.com/567298/69486747-92705380-0e57-11ea-86da-5cafd9c22701.png">

Go ahead and create a subnet where you will need to specify the VPC that you created, slect the first CIDR block, in my case 10.1.0.0/20 and select the first AZ:

<img width="1292" alt="BB1627EE-A92D-4274-BF97-40AE4E01A9A4" src="https://user-images.githubusercontent.com/567298/69486786-0d396e80-0e58-11ea-9860-7febe6e65f7d.png">

Do this for the other two subnets as well and then when you are done, it may look more or less like this:

<img width="1290" alt="051767FD-2D52-48BD-B495-01ACB431B358" src="https://user-images.githubusercontent.com/567298/69487635-3660fb80-0e66-11ea-8b59-71364414d3ae.png">

Repeat this process that you have three subnets for your **blue** account as well:

![881A973C-7C9A-423C-B6F4-555CE78E0A16](https://user-images.githubusercontent.com/567298/69486798-3823c280-0e58-11ea-8991-6518d986de31.png)

## Setup VPC Peering Connection

Now that we've created our VPC's and subnets for each VPC we want to peer our two VPC's with each other so that we have a direct connection between our VPC's so that our EC2 instances from our **green** account is able to connect with our EC2 instances in our **blue** account.

Head over to your **green** account's VPC section and select "Peering Connections":

<img width="1292" alt="21972956-D24A-4C45-94C5-10A6FC742D98" src="https://user-images.githubusercontent.com/567298/69486833-c8620780-0e58-11ea-8638-de60804bdb65.png">

Create a new peering connection, we will first need to name our peering connection, select the source VPC which will be our green account's VPC, since the VPC that we want to peer with is in another account, get the AWS Account ID from the **blue** account, and select "Another account" and provide the account id that we want to peer with, select the AWS Region and provide the VPC ID of the **blue** account:

<img width="1291" alt="1BDCB500-7BF0-4C5F-B171-9E09463A956A" src="https://user-images.githubusercontent.com/567298/69487659-817b0e80-0e66-11ea-83b6-4ec7c941804f.png">

Once you create the peering connection, you will find the peering request details:

<img width="1291" alt="C74BAE40-9C78-45FE-BE7F-3AC495E93A41" src="https://user-images.githubusercontent.com/567298/69486874-9c935180-0e59-11ea-99a2-a54bd5982ab1.png">

Now let's head over to our **blue** Account, head over to VPC, select Peering connections and you will find the peering request from our **green** account:

![05DB8A16-6CF4-48F1-920C-20AE7492E381](https://user-images.githubusercontent.com/567298/69486892-dbc1a280-0e59-11ea-983d-b7814257c323.png)

From the top, hit "Actions" and accept the request:

![0FF04F44-F5B7-4AAF-9D66-89396EC2AA06](https://user-images.githubusercontent.com/567298/69486900-014eac00-0e5a-11ea-9cc2-025ef35ad921.png)

You should see that the VPC Peering connection has been established:

![2D1D101F-3574-4A40-A1A6-F2F875B29158](https://user-images.githubusercontent.com/567298/69486904-14617c00-0e5a-11ea-8459-ab1bdf6141b0.png)

From the **blue** account you should see that the VPC Peering Connection is active:

![A2070A8B-6247-4D75-BFF8-D5AE152EFA42](https://user-images.githubusercontent.com/567298/69486911-2a6f3c80-0e5a-11ea-833c-bea298c55326.png)

If you head back to the **green** account, you will see under Peering Connections that the connection has been established:

<img width="1290" alt="1A50F913-9C6E-4F6D-A61C-5954617EBE5B" src="https://user-images.githubusercontent.com/567298/69486921-64d8d980-0e5a-11ea-86fa-cd37b44cbfdb.png">


We have now successfully created our VPC peering connection and the two VPC's from different accounts has been peered. Now we would like to launch our EC2 instances in our VPC, we will connect to our EC2 instance in our **green** account via the internet and then SSH to our EC2 instance in our **blue** account via the VPC peering connection via the Private IP Address.

## Setup Internet Gateway

In order to connect to a Public Elastic IP, we first need to create a Internet Gateway on our VPC and add a route to route all public traffic via our Internet Gateway. This allows our resources in that VPC to be able to connect to the Internet.

Head over to "Internet Gateways", and create a new Internet Gateway:

<img width="1283" alt="9750329C-E89E-425E-9DCC-D420D092C5E6" src="https://user-images.githubusercontent.com/567298/69486997-5212d480-0e5b-11ea-9455-0c3d94f4d6e9.png">

Our IGW (Internet Gateway) will now be in a detached state, we now need to attach our IGW to our VPC. Hit "Actions", then select "Attach to VPC", and select your VPC:

<img width="1281" alt="0BF7CB7A-C40A-483C-8083-410DBFFBA171" src="https://user-images.githubusercontent.com/567298/69487007-91412580-0e5b-11ea-8d3f-4ca7dff0976d.png">

You should now see that your IGW has been attached to your VPC:

<img width="1073" alt="B6C3094F-233C-4A6C-A6FC-C5FD7727FBBD" src="https://user-images.githubusercontent.com/567298/69487019-b6ce2f00-0e5b-11ea-903a-cb576ab29f11.png">

Now that we have created an IGW and associated it to our VPC, we now need to configure our routing table so that it knows how to route non-local traffic via the IGW.

## Configure Routing Table

Head over to VPC, select your VPC, select the "Route Tables" section from the left and you should see the following when you select the "Routes" section:

<img width="1286" alt="FF7E141E-2C8D-4D87-BE67-513AB44784F2" src="https://user-images.githubusercontent.com/567298/69487055-55f32680-0e5c-11ea-8ce9-81de2bf5eab5.png">

Select "Edit Routes" and add a route with the destination `0.0.0.0/0` select the Internet Gateway as a target and it will filter through your available IGW's and select the IGW that you created earlier, then select save. (If your blue account needs internet access, repeat these steps on the blue account as well.)

<img width="1274" alt="E223A267-1A4F-4DA4-B23A-37CE6EDAFEF5" src="https://user-images.githubusercontent.com/567298/69487097-ea5d8900-0e5c-11ea-97f6-66cd6604035f.png">

While we are at our routing tables configuration, we should also inform our VPC how to reach the subnet from the VPC from the other account. So that our **Green** App (10.1.0.0/16) can reach our **blue** app (10.2.0.0/16) via the Peering Connection.

We do this by adding a route to our routing table. From the **green** account's VPC's routing table add a new route with the destination of `10.2.0.0/16`, select "Peering Connection" as the target and it should resolve to the peering connection resource that we created, then select save:

<img width="1271" alt="B5E8CF35-0C06-4261-9668-6C091BA19E2A" src="https://user-images.githubusercontent.com/567298/69487275-a3bd5e00-0e5f-11ea-8d4f-a2d270b3e57b.png">

Now our **green** Account knows how to route traffic to our **blue** account and also knows which network traffic to route. But we also need to route traffic back. Head over to your **blue** Account and add a route `10.1.0.0/16` to the peering connection so that we can route traffic back to our **green** Account:

![885DCDE3-ACA5-4136-851D-3DF9D2D9D62D](https://user-images.githubusercontent.com/567298/69487287-e41cdc00-0e5f-11ea-86cd-b9c9f6d77ad5.png)

## Launch EC2 Instances

Now we want to launch a EC2 instance in each account and ensure to launch them into the VPC's that we created, I will also be creating two new SSH keys (blue-keypair + green-keypair) And I have created a Security Group that allows ICMP and SSH from anywhere, this is purely for demonstration (always review the sources that you want to allow). 

For our **green** account:

<img width="1284" alt="C60E3DAD-DD12-4670-97CD-AC524269C20E" src="https://user-images.githubusercontent.com/567298/69487311-4ece1780-0e60-11ea-9b66-b00568184790.png">

For our **blue** account:

![1BFBF8B9-D090-4883-8E2B-92F29B19AEDE](https://user-images.githubusercontent.com/567298/69487313-57265280-0e60-11ea-8814-fcdf4465967c.png)

Once the EC2 instances are deployed, you should see something like this. For my **green** account:

<img width="1278" alt="image" src="https://user-images.githubusercontent.com/567298/69487370-2bf03300-0e61-11ea-89a5-c9fcef4ee50a.png">

And for my **blue** account:

![74F20740-17EE-46C9-9A51-D3ACAB8937B5](https://user-images.githubusercontent.com/567298/69487324-7ae99880-0e60-11ea-9d46-fb4ebcb14e07.png)

## Public IP Addressing

Now that our EC2 instances are provisioned, we will be connecting to our **green** EC2 instances using a Public IP, therefore we need to create a Elastic IP. From EC2, select Elastic IPs and allocate a New Address:

<img width="1283" alt="C4B9AC94-7AFC-465D-8D51-0497ABA475B3" src="https://user-images.githubusercontent.com/567298/69487353-d9167b80-0e60-11ea-85dd-26c94b227494.png">

Select the IP, hit "Actions" and select "Associate Address", then select the EC2 instance to which you want to associate the Elastic IP to:

<img width="771" alt="E3AA99D6-CD59-4530-B818-422E1D584932" src="https://user-images.githubusercontent.com/567298/69487364-fc412b00-0e60-11ea-88b4-f1b0b7ad83dc.png">

You should know see that the EC2 instance has a Public IP assigned to it:

<img width="1048" alt="FE545350-0A45-453C-9855-4F65CC0783C6" src="https://user-images.githubusercontent.com/567298/69487694-d7e84d00-0e66-11ea-8cec-ad8142f01b9b.png">

## Test Network Connectivity 

From the downloaded SSH keypairs:

```
$ ls | grep keyp
blue-keypair.pem.txt
green-keypair.pem.txt
```

Apply the correct permissions to our keypairs so that we can use them to SSH:

```
$ chmod 0400 blue-keypair.pem.txt green-keypair.pem.txt
```

We will want to add both SSH keys to our agent so we can include them when we SSH:

```
$ eval $(ssh-agent -t 36000)
Agent pid 6613
```

Add both keys to your ssh-agent:

```
$ ssh-add blue-keypair.pem.txt
Identity added: blue-keypair.pem.txt (blue-keypair.pem.txt)

$ ssh-add green-keypair.pem.txt
Identity added: green-keypair.pem.txt (green-keypair.pem.txt)
```

SSH to our **Green** EC2 instance:

```
$ ssh -A ec2-user@3.11.6.171

       __|  __|_  )
       _|  (     /   Amazon Linux 2 AMI
      ___|\___|___|

https://aws.amazon.com/amazon-linux-2/
[ec2-user@ip-10-1-1-190 ~]$
```

Now lets ping our **Blue** EC2 Instance which will be accessible via our VPC Peering Connection:

```
[ec2-user@ip-10-1-1-190 ~]$ ping 10.2.1.167
PING 10.2.1.167 (10.2.1.167) 56(84) bytes of data.
64 bytes from 10.2.1.167: icmp_seq=1 ttl=255 time=0.754 ms
64 bytes from 10.2.1.167: icmp_seq=2 ttl=255 time=0.854 ms
```

And since we've allowed SSH traffic, we should be able to SSH to our instance via its Private IP Address:

```
[ec2-user@ip-10-1-1-190 ~]$ ssh 10.2.1.167

       __|  __|_  )
       _|  (     /   Amazon Linux 2 AMI
      ___|\___|___|

https://aws.amazon.com/amazon-linux-2/
[ec2-user@ip-10-2-1-167 ~]$
```

Now we have successfully created a VPC Peering Connection between Two AWS Accounts and demonstrated how to communicate to and from resources in those VPC's.

## Thank You

Let me know what you think. If you liked my content, feel free to checkout my content on **[ruan.dev](https://ruan.dev/)** or follow me on twitter at **[@ruanbekker](https://twitter.com/ruanbekker)**

<center><script type='text/javascript' src='https://ko-fi.com/widgets/widget_2.js'></script><script type='text/javascript'>kofiwidget2.init('Buy Me a Coffee', '#46b798', 'A6423ZIQ');kofiwidget2.draw();</script></center>

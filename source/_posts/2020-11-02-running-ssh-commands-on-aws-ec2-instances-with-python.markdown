---
layout: post
title: "Running SSH Commands on AWS EC2 Instances with Python"
date: 2020-11-02 09:55:43 +0000
comments: true
categories: ["python", "aws", "ec2", "ssh"]
---

In this quick post I will demonstrate how to discover a EC2 Instance's Private IP Address using the AWS API by using Tags then use Paramiko in Python to SSH to the EC2 instance and run SSH commands on the target instance.

Install the required dependencies:

```
$ virtualenv -p python3 .venv
$ source .venve/bin/activate
$ pip install boto3 paramiko
```

I have my development profile for aws configured under `dev` as can seen below:

```
$ aws --profile dev configure list
      Name                    Value             Type    Location
      ----                    -----             ----    --------
   profile                      dev           manual    --profile
access_key     ****************xxxx      assume-role
secret_key     ****************xxxx      assume-role
    region                eu-west-1      config-file    ~/.aws/config
```

First we need to discover the private ip address from the api by referencing tags, and in this example we will use the `Name` tag:

```
import boto3
ec2 = boto3.Session(profile_name='dev', region_name='eu-west-1').client('ec2')

target_instances = ec2.describe_instances(
    Filters=[{'Name':'tag:Name','Values':['my-demo-ec2-instance']}]
)

ec2_instances = []
for each_instance in target_instances['Reservations']:
    for found_instance in each_instance['Instances']:
        ec2_instances.append(found_instance['PrivateIpAddress'])

# ec2_instances
# ['172.31.2.89']
```

So we are instantiating a ec2 instance with our configured dev profile, then we describe all our instances using the tag key `Name` and value `my-demo-ec2-instance` and then access the private ip address and append it to our `ec2_instances` list.

Next we want to define the commands that we want to run on the target ec2 instance:

```
commands = [
    "echo hi",
    "whoami",
    "hostname"
]
```

In my case I only have 1 ec2 instance with the name `my-demo-ec2-instance`, but if you have more you can just loop through the list and perform the actions. 

Next we want to establish the SSH connection:

```
k = paramiko.RSAKey.from_private_key_file("/Users/ruan/.ssh/id_rsa")
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(hostname=ec2_instances[0], username="ruan", pkey=k, allow_agent=False, look_for_keys=False)
```

Once our SSH connection has established, we can loop through our commands and execute them:

```
for command in commands:
    print("running command: {}".format(command))
    stdin , stdout, stderr = c.exec_command(command)
    print(stdout.read())
    print(stderr.read())
```

Which will output the folling:

```
running command: echo hi
b'hi\n'
b''
running command: whoami
b'ruan\n'
b''
running command: hostname
b'ip-172-31-2-89\n'
b''
```

And then close the SSH connection:

```
c.close()
```

And the full script will look like this:

```python
import boto3
ssh_username = "ruan"
ssh_key_file = "/Users/ruan/.ssh/id_rsa"

ec2 = boto3.Session(profile_name='dev', region_name='eu-west-1').client('ec2')

target_instances = ec2.describe_instances(
    Filters=[{'Name':'tag:Name','Values':['my-demo-ec2-instance']}]
)

ec2_instances = []
for each_instance in target_instances['Reservations']:
    for found_instance in each_instance['Instances']:
        ec2_instances.append(found_instance['PrivateIpAddress'])

commands = [
    "echo hi",
    "whoami",
    "hostname"
]

k = paramiko.RSAKey.from_private_key_file(ssh_key_file)
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(hostname=ec2_instances[0], username=ssh_username, pkey=k, allow_agent=False, look_for_keys=False)

for command in commands:
    print("running command: {}".format(command))
    stdin , stdout, stderr = c.exec_command(command)
    print(stdout.read())
    print(stderr.read())

c.close()
```



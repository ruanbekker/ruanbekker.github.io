---
layout: post
title: "SSH using AWS SSM Session Manager"
date: 2021-03-10 00:52:54 -0500
comments: true
categories: ["aws", "ssh", "devops", "ssm"] 
---

You can use SSM Session Manager to connect to your EC2 instances, as long as your EC2 instance has the associated IAM Role which includes the AmazonSSMManagedInstanceCore managed policy.

## AWS EC2 Console

Head over to "Connect" and select "Session Manager":

![image](https://user-images.githubusercontent.com/567298/103775580-e8da2a80-5036-11eb-9e00-0fd9b4d9d467.png)

You should get a shell:

![image](https://user-images.githubusercontent.com/567298/103775597-f2639280-5036-11eb-8101-768f1c81108a.png)

## AWS CLI

You can also use the CLI:

```
aws --profile prod ssm start-session --target i-0ebba722b102179b6
```

If you get this error:

![image](https://user-images.githubusercontent.com/567298/103775625-ff808180-5036-11eb-88dc-be8fde3586ad.png)

Head over to:

https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html

Install the session manager plugin, for Mac:

```
$ curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/mac/sessionmanager-bundle.zip" -o "sessionmanager-bundle.zip"
$ unzip sessionmanager-bundle.zip
$ sudo ./sessionmanager-bundle/install -i /usr/local/sessionmanagerplugin -b /usr/local/bin/session-manager-plugin
$ rm -rf sessionmanager-bundle
```

After installation:

```
$ aws --profile prod ssm start-session --target i-0ebba722b102179b6
Starting session with SessionId: ruan.bekker-0b07cbbe261885ad3

sh-4.2$ sudo su - ec2-user
Last login: Wed Jan  6 12:55:03 UTC 2021 on pts/0
[ec2-user@ip-172-31-23-246 ~]$
```

Note: when you are using ssm session manager you don’t require security groups or a direct routable network to your instance.

## Bash Functions FTW

You can implement this into a bash function:

```
$ cat ~/.functions.aws
aws-ssh(){
  instance_name=${1}
  instance_id=$(aws --profile prod ec2 describe-instances --filter "Name=tag:Name,Values=${instance_name}" --query "Reservations[].Instances[?State.Name == 'running'].InstanceId[]" --output text)
  aws --profile prod ssm start-session --target ${instance_id}
}

$ aws-ssh ssm-session-manager-ssh-test2
Starting session with SessionId: ruan.bekker-04daf56c5f3668790
sh-4.2$
```

If you have your own SSH key, you can use this ~/.ssh/config:

```
# AWS SSM Session Manager
Host i-*
    ProxyCommand sh -c "aws --profile prod ssm start-session --target %h --document-name AWS-StartSSHSession --parameters 'portNumber=%p'"
```

```
$ ssh -i ~/.ssh/infra.pem ec2-user@i-0ebba722b102179b6
Warning: Permanently added 'i-0ebba722b102179b6' (ECDSA) to the list of known hosts.
Last login: Wed Jan  6 13:04:03 2021

       __|  __|_  )
       _|  (     /   Amazon Linux 2 AMI
      ___|\___|___|

https://aws.amazon.com/amazon-linux-2/
[ec2-user@ip-172-31-23-246 ~]$
```

## Related:

* https://aws.amazon.com/blogs/mt/amazon-ec2-instance-port-forwarding-with-aws-systems-manager/
* https://aws.amazon.com/blogs/aws/new-port-forwarding-using-aws-system-manager-sessions-manager/

## Thanks

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.

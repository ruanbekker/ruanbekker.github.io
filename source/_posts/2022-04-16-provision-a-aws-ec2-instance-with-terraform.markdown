---
layout: post
title: "Provision a AWS EC2 Instance with Terraform"
date: 2022-04-16 19:04:08 -0400
comments: true
categories: ["devops", "terraform", "aws"] 
---

In this tutorial I will demonstrate how to use Terraform (a Infrastructure as Code Tool), to provision a AWS EC2 Instance and the source code that we will be using in this tutorial will be published to my [terraformfiles guthub repository](https://github.com/ruanbekker/terraformfiles).

## Requirements

To follow along this tutorial, you will need an AWS Account and Terraform installed

## Terraform

To install Terraform for your operating system, you can follow [Terraform Installation Documentation](https://learn.hashicorp.com/tutorials/terraform/install-cli), I am using Mac OSx, so for me it will be:

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

To verify the installation, we can run `terraform version` and my output shows:

```
Terraform v1.1.8
on darwin_amd64
```

## Terraform Project Structure

Create the directory:

```bash
mkdir terraform-aws-ec2
cd terraform-aws-ec2
```

Create the following files: `main.tf`, `providers.tf`, `variables.tf`, `outputs.tf`, `locals.tf` and `terraform.tfvars`:

```bash
touch main.tf providers.tf variables.tf outputs.tf locals.tf terraform.tfvars
```

## Define Terraform Configuration Code

First we need to define the aws provider, which we will do in `providers.tf`:

```
terraform {
  required_providers {
    aws = {
      version = "~> 3.27"
      source = "hashicorp/aws"
    }
  }
}

provider "aws" {
  region  = "eu-west-1"
  profile = "default"
  shared_credentials_file = "~/.aws/credentials"
}
```

You will notice that I am defining my profile name `default` from the `~/.aws/credentials` credential provider in order for terraform to authenticate with AWS.

Next I am defining the `main.tf` which will be the file where we define our aws resources:

```
data "aws_ami" "latest_ubuntu" {
  most_recent = true
  owners = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-*-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

}

data "aws_iam_policy_document" "assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

data "aws_iam_policy" "ec2_read_only_access" {
  arn = "arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess"
}

resource "aws_iam_role" "ec2_access_role" {
  name               = "${local.project_name}-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json
}

resource "aws_iam_policy_attachment" "readonly_role_policy_attach" {
  name       = "${local.project_name}-ec2-role-attachment"
  roles      = [aws_iam_role.ec2_access_role.name]
  policy_arn = data.aws_iam_policy.ec2_read_only_access.arn
}

resource "aws_iam_instance_profile" "instance_profile" {
  name  = "${local.project_name}-ec2-instance-profile"
  role = aws_iam_role.ec2_access_role.name
}

resource "aws_security_group" "ec2" {
    name        = "${local.project_name}-ec2-sg"
    description = "${local.project_name}-ec2-sg"
    vpc_id      = var.vpc_id

    tags = merge(
      var.default_tags,
      {
       Name = "${local.project_name}-ec2-sg"
      },
    )
}

resource "aws_security_group_rule" "ssh" {
    description       = "allows public ssh access to ec2"
    security_group_id = aws_security_group.ec2.id
    type              = "ingress"
    protocol          = "tcp"
    from_port         = 22
    to_port           = 22
    cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "egress" {
    description       = "allows egress"
    security_group_id = aws_security_group.ec2.id
    type              = "egress"
    protocol          = "-1"
    from_port         = 0
    to_port           = 0
    cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_instance" "ec2" {
  ami                         = data.aws_ami.latest_ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  key_name                    = var.ssh_keyname
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  associate_public_ip_address = true
  monitoring                  = true
  iam_instance_profile        = aws_iam_instance_profile.instance_profile.name
  
  lifecycle {
    ignore_changes            = [subnet_id, ami]
  }
  
  root_block_device {
      volume_type           = "gp2"
      volume_size           = var.ebs_root_size_in_gb
      encrypted             = false
      delete_on_termination = true
  }

  tags = merge(
    var.default_tags,
    {
     Name = "${local.project_name}"
    },
  )

}
```

A couple of things are defined here:

- A data resource to fetch the latest Ubuntu 20.04 AMI
- The IAM Role and Policy that we will use to associate to our EC2 Instance Profile
- The EC2 Security Group
- The EC2 Instance
- The VPC ID and Subnet ID are required variables which we will set in `terraform.tfvars`

The next file will be our `variables.tf` file where we will define all our variable definitions:

```
variable "default_tags" {
  default = {
    Environment = "test"
    Owner       = "ruan.bekker"
    Project     = "terraform-blogpost"
    CostCenter  = "engineering"
    ManagedBy   = "terraform"
  }
}

variable "aws_region" {
  type        = string
  default     = "eu-west-1"
  description = "the region to use in aws"
}

variable "vpc_id" {
  type        = string
  description = "the vpc to use"
}

variable "ssh_keyname" {
  type        = string
  description = "ssh key to use"
}

variable "subnet_id" {
  type        = string
  description = "the subnet id where the ec2 instance needs to be placed in"
}

variable "instance_type" {
  type        = string
  default     = "t3.nano"
  description = "the instance type to use"
}

variable "project_id" {
  type        = string
  default     = "terraform-blogpost"
  description = "the project name"
}

variable "ebs_root_size_in_gb" {
  type        = number
  default     = 10
  description = "the size in GB for the root disk"
}

variable "environment_name" {
   type    = string
   default = "dev"
   description = "the environment this resource will go to (assumption being made theres one account)"
}
```

The next file is our `locals.tf` which just concatenates our project id and environment name:

```
locals {
  project_name = "${var.project_id}-${var.environment_name}"
}
```

Then our `outputs.tf` for the values that terraform should output:

```
output "id" {
  description = "The ec2 instance id"
  value       = aws_instance.ec2.id
  sensitive   = false
}

output "ip" {
  description = "The ec2 instance public ip address"
  value       = aws_instance.ec2.public_ip
  sensitive   = false
}

output "subnet_id" {
  description = "the subnet id which will be used"
  value       = var.subnet_id
  sensitive   = false
}
```

Then lastly our `terraform.tfvars`, which you will need to supply your own values to match your AWS Account:

```
# required
vpc = "vpc-063d7xxxxxxxxxxxx"
keyname = "ireland-key"
subnetid = "subnet-04b3xxxxxxxxxxxxx"
```

## Deploy EC2 Instance

Now that all our configuration is in place, we need to intialize terraform by downloading the providers:

```bash
terraform init
```

Once the terraform init has completed, we can run a `terraform plan` which will show us what terraform will do. Since the `terraform.tfvars` are the default file for variables, we don't have to specify the name of the file, but since I want to be excplicit, I will include it (should you want to change the file name):

```bash
terraform plan -var-file="terraform.tfvars"
```

Now it's a good time to review what terraform wants to action by viewing the plan output, once you are happy you can deploy the changes by running a `terraform apply`:

```bash
terraform apply -var-file="terraform.tfvars"
```

Optional: You can override variables by either updating the `terraform.tfvars` or you can append them with terraform apply `-var-file="terraform.tfvars" -var="ssh_key=default_key"`, a successful output should show something like this:

```bash
Outputs:
id = "i-0dgacxxxxxxxxxxxx"
ip = "18.26.xxx.92"
subnet = "subnet-04b3xxxxxxxxxxxxx"
```

## Access your EC2 Instance

You can access the instance by SSH'ing to the IP that was returned by the output as well as the SSH key name that you provided, or you can make use of the `terraform output` to access the output value:

```bash
ssh -i ~/.ssh/id_rsa ubuntu@$(terraform output -raw ip)
```

## Cleanup

To delete the infrastructure that Terraform provisioned:

```bash
terraform destroy
```

## Thank You

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)**, read my **[newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.



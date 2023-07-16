---
layout: post
title: "How to use the AWS Terraform Provider"
date: 2023-07-15 20:01:13 -0400
comments: true
categories: ["aws", "terraform", "devops"] 
---

In this post we will be using the AWS Terraform provider, from how to install Terraform, create a AWS IAM User, configure the AWS Provider and deploy a EC2 instance using Terraform.

## AWS IAM User

In order to authenticate against AWS’s APIs, we need to create a AWS IAM User and create Access Keys for Terraform to use to authenticate.

From https://aws.amazon.com/ logon to your account, then search for IAM:

![aws-iam-search-result](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/c53d15d3-1af2-4e15-aafb-229cc4274bf5)

Select IAM, then select “Users” on the left hand side and select “Create User”, then provide the username for your AWS IAM User:

![aws-iam-user-creation-wizard](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/35f74a94-98d3-44c4-9651-a504780e5a6e)

Now we need to assign permissions to our new AWS IAM User. For this scenario I will be assigning a IAM Policy directly to the user and I will be selecting the “AdministratorAccess” policy. Keep in mind that this allows admin access to your whole AWS account:

![permissions-for-your-aws-iam-user](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/779f2dac-0da9-4751-8e89-2ff33c088ae8)

Once you select the policy, select “Next” and select “Create User”. Once the user has been created, select “Users” on the left hand side, search for your user that we created, in my case “medium-terraform”.

Select the user and click on “Security credentials”. If you scroll down to the “Access keys” section, you will notice we don’t have any access keys for this user:

![aws-iam-access-keys](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/45b5eb1f-999f-4e81-b439-9e8cd90f83a3)

In order to allow Terraform access to our AWS Account, we need to create access keys that Terraform will use, and because we assigned full admin access to the user, Terraform will be able to manage resources in our AWS Account.

Click “Create access key”, then select the “CLI” option and select the confirmation at the bottom:

![aws-iam-access-keys-wizard](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/22b13879-6256-4de8-ab5f-aecece3be432)

Select “Next” and then select “Create access key”. I am providing a screenshot of the Access Key and Secret Access Key that has been provided, but by the time this post has been published, the key will be deleted.

![retrieve-aws-iam-access-keys](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/a7a4124f-dc9c-4700-b0ed-d21d7df4fa6c)

Store your Access Key and Secret Access Key in a secure place and treat this like your passwords. If someone gets access to these keys they can manage your whole AWS Account.

I will be using the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) to configure my Access Key and Secret Access Key, as I will configure Terraform later to read my Access Keys from the Credential Provider config.

First we need to configure the AWS CLI by passing the profile name, which I have chosen `medium` for this demonstration:

```bash
aws --profile medium configure
```

We will be asked to provide the access key, secret access key, aws region and the default output:

```bash
AWS Access Key ID [None]: AKIATPRT2G4SGXLAC3HJ
AWS Secret Access Key [None]: KODnR[............]nYTYbd
Default region name [None]: eu-west-1
Default output format [None]: json
```

To verify if everything works as expected we can use the following command to verify:

```bash
aws --profile medium sts get-caller-identity
```

The response should look something similar to the following:

```json
{
    "UserId": "AIDATPRT2G4SOAO5Y7S5Z",
    "Account": "000000000000",
    "Arn": "arn:aws:iam::000000000000:user/medium-terraform"
}
```

## Terraform

Now that we have our AWS IAM User configured, we can install Terraform, if you don’t have Terraform installed yet, you can follow their [Installation Documentation](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli).

Once you have Terraform installed, we can setup our workspace where we will ultimately deploy a EC2 instance, but before we get there we need to create our project directory and change to that directory:

```bash
mkdir ~/terraform-demo
cd ~/terraform-demo
```

Then we will create 4 files with `.tf` extensions:

```bash
touch main.tf
touch outputs.tf
touch providers.tf
touch variables.tf
```

We will define our Terraform definitions on how we want our desired infrastructure to look like. We will get to the content in the files soon.

I personally love Terraform’s documentation as they are rich in examples and really easy to use.

Head over to the [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs) documentation and you scroll a bit down, you can see the [Authentication and Configuration](https://registry.terraform.io/providers/hashicorp/aws/latest/docs#authentication-and-configuration) section where they outline the order in how Terraform will look for credentials and we will be making use of the shared credentials file as that is where our access key and secret access key is stored.

If you look at the top right corner of the Terraform AWS Provider documentation, they show you how to use the AWS Provider:

![terraform-aws-provider-docs](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/03a55c32-bb1c-4f48-a441-c09918c824db)

We can copy that code snippet and paste it into our `providers.tf` file and configure the aws provider section with the `medium` profile that we’ve created earlier.

This will tell Terraform where to look for credentials in order to authenticate with AWS.

Open `providers.tf` with your editor of choice:

```bash
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "5.8.0"
    }
  }
}

provider "aws" {
  shared_credentials_files = ["~/.aws/credentials"]
  profile                  = "medium"
  region                   = "eu-west-1"
}
```

Then we can open `main.tf` and populate the following to define the EC2 instance that we want to provision:

```bash
data "aws_ami" "latest_ubuntu" {
  most_recent = true
  owners = ["099720109477"]
  
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-*-server-*"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

resource "aws_instance" "ec2" {
  ami           = data.aws_ami.latest_ubuntu.id
  instance_type = var.instance_type
  tags = {
    Name = "${var.instance_name}-ec2-instance"
  }
}
```

In the above example we are filtering for the latest Ubuntu 22.04 64bit AMI then we are defining a EC2 instance and specifying the AMI ID that we filtered from our data source.

Note that we haven’t specified a SSH Keypair, as we are just focusing on how to provision a EC2 instance.

As you can see we are also referencing variables, which we need to define in `variables.tf` :

```bash
variable "instance_name" {
  description = "Instance Name for EC2."
  type        = string
  default     = "test"
}

variable "instance_type" {
  description = "Instance Type for EC2."
  type        = string
  default     = "t2.micro"
}
```

And then lastly we need to define our `outputs.tf` which will be used to output the instance id and ip address:

```bash
output "instance_id" {
  value = aws_instance.ec2.id
}

output "ip" {
  value = aws_instance.ec2.public_ip
}
```

## Deploy our EC2 with Terraform

Now that our infrastructure has been defined as code, we can first initialise terraform which will initialise the backend and download all the providers that has been defined:

```bash
terraform init
```

Once that has done we can run a “plan” which will show us what Terraform will deploy:

```bash
terraform plan
```

Now terraform will show us the difference in what we have defined, and what is actually in AWS, as we know its a new account with zero infrastructure, the diff should show us that it needs to create a EC2 instance.

The response from the `terraform plan` shows us the following:

```bash
Terraform used the selected providers to generate the following execution plan. Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

  # aws_instance.ec2 will be created
  + resource "aws_instance" "ec2" {
      + ami                                  = "ami-0f56955469757e5aa"
      + arn                                  = (known after apply)
      + id                                   = (known after apply)
      + instance_type                        = "t2.micro"
      + key_name                             = (known after apply)
      + private_ip                           = (known after apply)
      + public_ip                            = (known after apply)
      + security_groups                      = (known after apply)
      + subnet_id                            = (known after apply)
      + tags                                 = {
          + "Name" = "test-ec2-instance"
        }
      + tags_all                             = {
          + "Name" = "test-ec2-instance"
        }
      + vpc_security_group_ids               = (known after apply)
    }

Plan: 1 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + instance_id = (known after apply)
  + ip          = (known after apply)
```

As you can see terraform has looked up the AMI ID using the data source, and we can see that terraform will provision 1 resource which is a EC2 instance. Once we hare happy with the plan, we can run a apply which will show us the same but this time prompt us if we want to proceed:

```bash
Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes

aws_instance.ec2: Creating...
aws_instance.ec2: Still creating... [10s elapsed]
aws_instance.ec2: Still creating... [20s elapsed]
aws_instance.ec2: Still creating... [30s elapsed]
aws_instance.ec2: Creation complete after 35s [id=i-005c08b899229fff0]

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.

Outputs:

instance_id = "i-005c08b899229fff0"
ip = "34.253.196.167"
```

And now we can see our EC2 instance was provisioned and our outputs returned the instance id as well as the public ip address.

We can also confirm this by looking at the AWS EC2 Console:

![aws-ec2-instances-in-console](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/82b4d742-1c45-4d21-8766-10a5c0d074a1)

Note that Terraform Configuration is idempotent, so when we run a terraform apply again, terraform will check what we have defined as what we want our desired infrastructure to be like, and what we actually have in our AWS Account, and since we haven’t made any changes there should be no changes.

We can run a terraform apply to validate that:

```bash
terraform apply
```

And we can see the response shows:

```bash
data.aws_vpc.selected: Reading...
data.aws_ami.latest_ubuntu: Reading...
data.aws_ami.latest_ubuntu: Read complete after 1s [id=ami-0f56955469757e5aa]
data.aws_vpc.selected: Read complete after 1s [id=vpc-063d7ac3124053dfa]
data.aws_subnet.selected: Reading...
data.aws_subnet.selected: Read complete after 1s [id=subnet-0b7acd7593611c1bb]
aws_instance.ec2: Refreshing state... [id=i-005c08b899229fff0]

Apply complete! Resources: 0 added, 0 changed, 0 destroyed.
```

## Cleanup

Destroy the infrastructure that we provisioned:

```bash
terraform destroy
```

It will show us what terraform will destroy, then upon confirming we should see the following output:

```bash
Plan: 0 to add, 0 to change, 1 to destroy.

Changes to Outputs:
  - instance_id = "i-005c08b899229fff0" -> null
  - ip          = "34.253.196.167" -> null

Do you really want to destroy all resources?
  Terraform will destroy all your managed infrastructure, as shown above.
  There is no undo. Only 'yes' will be accepted to confirm.

  Enter a value: yes

aws_instance.ec2: Destroying... [id=i-005c08b899229fff0]
aws_instance.ec2: Still destroying... [id=i-005c08b899229fff0, 10s elapsed]
aws_instance.ec2: Still destroying... [id=i-005c08b899229fff0, 20s elapsed]
aws_instance.ec2: Still destroying... [id=i-005c08b899229fff0, 30s elapsed]
aws_instance.ec2: Destruction complete after 31s

Destroy complete! Resources: 1 destroyed.
```

If you followed along and you also want to clean up the AWS IAM user, head over to the AWS IAM Console and delete the “medium-terraform” IAM User.

## Thank You

I hope you enjoyed this post, I will be posting more terraform related content.

Should you want to reach out to me, you can follow me on Twitter at [@ruanbekker](https://twitter.com/ruanbekker) or check out my website at https://ruan.dev



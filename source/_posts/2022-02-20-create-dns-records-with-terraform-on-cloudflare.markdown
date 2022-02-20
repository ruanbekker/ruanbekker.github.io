---
layout: post
title: "Create DNS Records with Terraform on Cloudflare"
date: 2022-02-20 13:11:06 -0500
comments: true
categories: ["terraform", "cloudflare", "devops", "linux"] 
---

In this tutorial we will use **Terraform** to create DNS records on **Cloudflare**.

## Installing Terraform

I will be installing terraform for linux, but you can follow terraform's documentation if you are using a different operating system:
- https://learn.hashicorp.com/tutorials/terraform/install-cli

```bash
> curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
> sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
> sudo apt update && sudo apt install terraform -y
```
Verify that terraform was installed:

```bash
> terraform version
Terraform v1.1.6
on linux_amd64
```

## Cloudflare Authentication

We need to create an API Token in order to authenticate terraform to make the required API calls to create the DNS Record.

They have a great post on this, which you can follow below:
- https://developers.cloudflare.com/api/tokens/create

You will need access to "Edit DNS Zones" and also include the Domain that you would like to edit.

Ensure that you save the API Token in a safe place.

## Terraform Code

First we will create a project directory:

```bash
> mkdir terraform-cloudflare-dns
> cd terraform-cloudflare-dns
```

First we will create the `providers.tf` which we define our provider and the required parameters for the provider:

```hcl
terraform {
  required_providers {
    cloudflare = {
      source = "cloudflare/cloudflare"
      version = "~> 3.0"
    }
  }
}

provider "cloudflare" {
  email   = var.cloudflare_email
  api_token = var.cloudflare_api_token
}
```

As you can see, we are referencing `email` and `api_token` as variables, therefore we need to define those variables in `variables.tf`:

```hcl
variable "cloudflare_email" {
  type        = string
  description = "clouflare email address"
}

variable "cloudflare_api_token" {
  type        = string
  description = "cloudflare api token"
}
```

In our `main.tf`, we are first using a data resource to query cloudflare for our domain `rbkr.xyz` and then access the attribute `id` which we will be using in our `cloudflare_record` resource so that it knows which domain to add the DNS record for.

Then we are going to create the A record `foobar` and provide the value of `127.0.0.1`:

```hcl
data "cloudflare_zone" "this" {
  name = "rbkr.xyz"
}

resource "cloudflare_record" "foobar" {
  zone_id = data.cloudflare_zone.this.id
  name    = "foobar"
  value   = "127.0.0.1"
  type    = "A"
  proxied = false
}
```

Then we are defining our outputs in `outputs.tf`:

```hcl
output "record" {
  value = cloudflare_record.foobar.hostname
}

output "metadata" {
  value       = cloudflare_record.foobar.metadata
  sensitive   = true
}
```

## Creating the Record

Once our configuration code is in place we can run a `init` which will download the providers:

```bash
> terraform init
```

Once that is done, we can run a `plan` so we can see what will be deployed, but since our `variables.tf` has no `default` values, we will either have to define this in `terraform.tfvars` or use it in-line.

I will be using it in-line for this demonstration:

```bash
> terraform plan -var "cloudflare_email=$EMAIL" -var "cloudflare_api_token=$API_TOKEN"
```

Once you are happy, you can run a `apply` which will deploy the changes:

```bash
> terraform apply -var "cloudflare_email=$EMAIL" -var "cloudflare_api_token=$API_TOKEN"

Terraform used the selected providers to generate the following execution plan. Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

  # cloudflare_record.foobar will be created
  + resource "cloudflare_record" "foobar" {
      + allow_overwrite = false
      + created_on      = (known after apply)
      + hostname        = (known after apply)
      + id              = (known after apply)
      + metadata        = (known after apply)
      + modified_on     = (known after apply)
      + name            = "foobar"
      + proxiable       = (known after apply)
      + proxied         = false
      + ttl             = (known after apply)
      + type            = "A"
      + value           = "127.0.0.1"
      + zone_id         = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    }

Plan: 1 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + metadata = (sensitive value)
  + record   = (known after apply)

Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes

cloudflare_record.foobar: Creating...
cloudflare_record.foobar: Creation complete after 4s [id=xxxxxxxxxxxxxxxxxxxxx]

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.

Outputs:

metadata = <sensitive>
record = "foobar.rbkr.xyz"
```

## Test DNS

We can now test if this is working as expected with a dns utility like dig:

```bash
> dig foobar.rbkr.xyz

; <<>> DiG 9.10.6 <<>> foobar.rbkr.xyz
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 20800
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;foobar.rbkr.xyz.       IN      A

;; ANSWER SECTION:
foobar.rbkr.xyz. 300    IN      A       127.0.0.1

;; Query time: 262 msec
;; SERVER: 172.31.0.2#53(172.31.0.2)
;; WHEN: Wed Feb 02 13:57:59 SAST 2022
;; MSG SIZE  rcvd: 68
```

## Thank You

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.

---
layout: post
title: "Persisting Terraform Remote State in Gitlab"
date: 2023-03-05 01:43:54 -0500
comments: true
categories: ["terraform", "devops", "gitlab"]
---

![terraform-state-gitlab](https://user-images.githubusercontent.com/567298/222946002-7cd88466-c584-4ea0-b190-54b1c3052865.png)

In this tutorial we will demonstrate how to persist your terraform state in gitlab managed terraform state, using the terraform http backend.

For detailed information about this consult [their documentation](https://docs.gitlab.com/ee/user/infrastructure/iac/terraform_state.html)

## What are we doing?

We will create a terraform pipeline which will run the plan step automatically and a manual step to run the apply step.

During these steps and different pipelines we need to persist our terraform state remotely so that new pipelines can read from our state what we last stored.

Gitlab offers a [remote backend](https://docs.gitlab.com/ee/user/infrastructure/iac/terraform_state.html) for our terraform state which we can use, and we will use a basic example of using the random resource.

## Prerequisites

If you don't see the "Infrastructure" menu on your left, you need to enable it at "Settings", "General", "Visibility", "Project features", "Permissions" and under "Operations", turn on the toggle.

For more information on this see their [documentation](https://docs.gitlab.com/ee/user/infrastructure/iac/terraform_state.html#prerequisites)

## Authentication

For this demonstration I created a token which is only scoped for this one project, for this we need a to create a token under, "Settings", "Access Tokens":

![image](https://user-images.githubusercontent.com/567298/222896148-6b0121fe-fceb-470e-a096-5db03ae0eab9.png)

Select the `api` under scope:

![image](https://user-images.githubusercontent.com/567298/222896298-fee26e1f-6bcf-4d7c-80eb-ed48ded33bf2.png)

Store the token name and token value as `TF_USERNAME` and `TF_PASSWORD` as a CICD variable under "Settings", "CI/CD", "Variables".

## Terraform Code

We will use a basic `random_uuid` resource for this demonstration, our `main.tf`:

```
resource "random_uuid" "uuid" {}

output "uuid" {
  value       = random_uuid.uuid.result
  sensitive   = false
}
```

Our `providers.tf`, you will notice the `backend "http" {}` is what is required for our gitlab remote state:

```
terraform {
  required_providers {
    random = {
      source = "hashicorp/random"
      version = "3.4.3"
    }
  }
  backend "http" {}
  required_version = "~> 1.3.6"
}

provider "random" {}
```

Push that up to gitlab for now.

## Gitlab Pipeline

Our `.gitlab-ci.yml` consists of a plan step and a apply step which is a manual step as we first want to review our plan step before we apply.

Our pipeline will only run on the default branch, which in my case is main:

```yaml
image:
  name: hashicorp/terraform:1.3.6
  entrypoint: [""]

cache:
  paths:
    - .terraform

workflow:
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - when: never

variables:
  TF_ADDRESS: "https://gitlab.com/api/v4/projects/${CI_PROJECT_ID}/terraform/state/default-terraform.tfstate"

stages:
  - plan
  - apply

.terraform_init: &terraform_init
  - terraform init
      -backend-config=address=${TF_ADDRESS}
      -backend-config=lock_address=${TF_ADDRESS}/lock
      -backend-config=unlock_address=${TF_ADDRESS}/lock
      -backend-config=username=${TF_USERNAME}
      -backend-config=password=${TF_PASSWORD}
      -backend-config=lock_method=POST
      -backend-config=unlock_method=DELETE
      -backend-config=retry_wait_min=5

terraform:plan:
  stage: plan
  artifacts:
    paths:
      - '**/*.tfplan'
      - '**/.terraform.lock.hcl'
  before_script:
    - *terraform_init
  script:
    - terraform validate
    - terraform plan -input=false -out default.tfplan

terraform:apply:
  stage: apply
  artifacts:
    paths:
      - '**/*.tfplan'
      - '**/.terraform.lock.hcl'
  before_script:
    - *terraform_init
  script:
    - terraform apply -input=false -auto-approve default.tfplan
  when: manual
```

Where the magic happens is in the `terraform init` step, that is where we will initialize the terraform state in gitlab, and as you can see we are taking the `TF_ADDRESS` variable to define the path of our state and in this case our state file will be named `default-terraform.tfstate`.

If it was a case where you are deploying multiple environments, you can use something like `${ENVIRONMENT}-terraform.tfstate`.

When we run our pipeline, we can look at our plan step:

![image](https://user-images.githubusercontent.com/567298/222947389-9d9d8d4f-a114-44b5-b183-a2b126ba82b8.png)

Once we are happy with this we can run the manual step and do the apply step, then our pipeline should look like this:

![image](https://user-images.githubusercontent.com/567298/222930015-6445a5da-7887-47a6-989e-f33a33b9451a.png)

When we inspect our terraform state in the infrastructure menu, we can see the state file was created:

![image](https://user-images.githubusercontent.com/567298/222901200-2cd0a0f9-6e81-438f-bc74-286778b648d4.png)

## Thank You

Thanks for reading, feel free to check out my [website](https://ruan.dev/), feel free to subscribe to my [newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog) or follow me at [@ruanbekker](https://twitter.com/ruanbekker) on Twitter.

- Linktree: https://go.ruan.dev/links
- Patreon: https://go.ruan.dev/patreon

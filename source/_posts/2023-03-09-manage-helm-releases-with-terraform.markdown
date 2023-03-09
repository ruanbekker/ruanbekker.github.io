---
layout: post
title: "Manage Helm Releases with Terraform"
date: 2023-03-09 16:15:47 -0500
comments: true
categories: ["terraform", "helm", "kubernetes", "devops"] 
---

![helm-releases-with-terraform](https://user-images.githubusercontent.com/567298/224163430-34e18f11-2182-4d2b-b7ab-f4683c187719.png)

In this post we will use terraform to deploy a helm release to kubernetes.

## Kubernetes

For this demonstration I will be using [kind](https://kind.sigs.k8s.io/) to deploy a local Kubernetes cluster to the operating system that I am running this on, which will be Ubuntu Linux. For a more in-depth tutorial on Kind, you can see my post on [Kind for Local Kubernetes Clusters](https://blog.ruanbekker.com/blog/2022/09/20/kind-for-local-kubernetes-clusters/).

## Installing the Pre-Requirements

We will be installing terraform, docker, kind and kubectl on Linux.

Install terraform:

```bash
wget https://releases.hashicorp.com/terraform/1.3.0/terraform_1.3.0_linux_amd64.zip
unzip terraform_1.3.0_linux_amd64.zip
rm terraform_1.3.0_linux_amd64.zip
mv terraform /usr/bin/terraform
```

Verify that terraform has been installed:

```bash
terraform -version
```

Which in my case returns:

```bash
Terraform v1.3.0
on linux_amd64
```

Install Docker on Linux (be careful to curl pipe bash - trust the scripts that you are running):

```bash
curl https://get.docker.com | bash
```

Then running `docker ps` should return:

```bash
CONTAINER ID   IMAGE        COMMAND         CREATED          STATUS          PORTS       NAMES
```

Install kind on Linux:

```bash
apt update
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.17.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

Then to verify that kind was installed with `kind --version` should return:

```bash
kind version 0.17.0
```

Create a kubernetes cluster using kind:

```bash
kind create cluster --name rbkr --image kindest/node:v1.24.0
```

Now install [kubectl](https://kubernetes.io/docs/tasks/tools/):

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

Then to verify that kubectl was installed:

```bash
kubectl version --client
```

Which in my case returns:

```bash
Client Version: version.Info{Major:"1", Minor:"26", GitVersion:"v1.26.1", GitCommit:"8f94681cd294aa8cfd3407b8191f6c70214973a4", GitTreeState:"clean", BuildDate:"2023-01-18T15:58:16Z", GoVersion:"go1.19.5", Compiler:"gc", Platform:"linux/amd64"}
Kustomize Version: v4.5.7
```

Now we can test if kubectl can communicate with the kubernetes api server:

```bash
kubectl get nodes
```

In my case it returns:

```bash
NAME                 STATUS   ROLES           AGE     VERSION
rbkr-control-plane   Ready    control-plane   6m20s   v1.24.0
```

## Terraform

Now that our pre-requirements are sorted we can configure terraform to communicate with kubernetes. For that to happen, we need to consult the [terraform kubernetes provider](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs)'s documentation.

As per their documentation they provide us with this snippet:

```
terraform {
  required_providers {
    kubernetes = {
      source = "hashicorp/kubernetes"
      version = "2.18.0"
    }
  }
}

provider "kubernetes" {
  # Configuration options
}
```

And from their [main](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs) page, it gives us a couple of options to configure the provider and the easiest is probably to read the `~/.kube/config` configuration file.

But in cases where you have multiple configurations in your kube config file, this might not be ideal, and I like to be precise, so I will extract the client certificate, client key and cluster ca certificate and endpoint from our `~/.kube/config` file.

If we run `cat ~/.kube/config` we will see something like this:

```yaml
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRU......FURS0tLS0tCg==
    server: https://127.0.0.1:40305
  name: kind-rbkr
contexts:
- context:
    cluster: kind-rbkr
    user: kind-rbkr
  name: kind-rbkr
current-context: kind-rbkr
kind: Config
preferences: {}
users:
- name: kind-rbkr
  user:
    client-certificate-data: LS0tLS1CRX......FURS0tLS0tCg==
    client-key-data: LS0tLS1CRUejhKWUk2N2.....S0tCg==
```

First we will create a directory for our certificates:

```bash
mkdir ~/certs
```

I have truncated my kube config for readability, but for our first file `certs/client-cert.pem` we will copy the value of `client-certificate-data:`, which will look something like this:

```bash
cat certs/client-cert.pem
LS0tLS1CRX......FURS0tLS0tCg==
```

Then we will copy the contents of `client-key-data:` into `certs/client-key.pem` and then lastly the content of `certificate-authority-data:` into `certs/cluster-ca-cert.pem`.

So then we should have the following files inside our `certs/` directory:

```bash
tree certs/
certs/
├── client-cert.pem
├── client-key.pem
└── cluster-ca-cert.pem

0 directories, 3 files
```

Now make them read only:

```bash
chmod 400 ~/certs/*
```

Now that we have that we can start writing our terraform configuration. In `providers.tf`:

```
terraform {
  required_providers {
    kubernetes = {
      source = "hashicorp/kubernetes"
      version = "2.18.0"
    }
  }
}

provider "kubernetes" {
  host                   = "https://127.0.0.1:40305"
  client_certificate     = base64decode(file("~/certs/client-cert.pem"))
  client_key             = base64decode(file("~/certs/client-key.pem"))
  cluster_ca_certificate = base64decode(file("~/certs/cluster-ca-cert.pem"))
}
```

Your host might look different to mine, but you can find your host endpoint in `~/.kube/config`.

For a simple test we can list all our namespaces to ensure that our configuration is working. In a file called `namespaces.tf`, we can populate the following:

```
data "kubernetes_all_namespaces" "allns" {}

output "all-ns" {
  value = data.kubernetes_all_namespaces.allns.namespaces
}
```

Now we need to initialize terraform so that it can download the providers:

```bash
terraform init
```

Then we can run a plan which will reveal our namespaces:

```bash
terraform plan

data.kubernetes_all_namespaces.allns: Reading...
data.kubernetes_all_namespaces.allns: Read complete after 0s [id=a0ff7e83ffd7b2d9953abcac9f14370e842bdc8f126db1b65a18fd09faa3347b]

Changes to Outputs:
  + all-ns = [
      + "default",
      + "kube-node-lease",
      + "kube-public",
      + "kube-system",
      + "local-path-storage",
    ]
```

We can now remove our `namespaces.tf` as our test worked:

```bash
rm namespaces.tf
```

## Helm Releases with Terraform

We will need two things, we need to consult the [terraform helm release provider](https://registry.terraform.io/providers/hashicorp/helm/latest/docs/resources/release) documentation and we also need to consult the helm chart documentation which we are interested in.

In my previous post I wrote about [Everything you need to know about Helm](https://blog.ruanbekker.com/blog/2023/01/24/everything-you-need-to-know-about-helm/) and I used the [Bitnami Nginx Helm Chart](https://artifacthub.io/packages/helm/bitnami/nginx), so we will use that one again.

As we are working with helm releases, we need to configure the helm provider, I will just extend my configuration from my previous provider config in `providers.tf`:

```
terraform {
  required_providers {
    kubernetes = {
      source = "hashicorp/kubernetes"
      version = "2.18.0"
    }
    helm = {
      source = "hashicorp/helm"
      version = "2.9.0"
    }
  }
}

provider "kubernetes" {
  host                   = "https://127.0.0.1:40305"
  client_certificate     = base64decode(file("~/certs/client-cert.pem"))
  client_key             = base64decode(file("~/certs/client-key.pem"))
  cluster_ca_certificate = base64decode(file("~/certs/cluster-ca-cert.pem"))
}

provider "helm" {
  kubernetes {
    host                   = "https://127.0.0.1:40305"
    client_certificate     = base64decode(file("~/certs/client-cert.pem"))
    client_key             = base64decode(file("~/certs/client-key.pem"))
    cluster_ca_certificate = base64decode(file("~/certs/cluster-ca-cert.pem"))
  }
}
```

We will create three terraform files:

```bash
touch {main,outputs,variables}.tf
```

And our values yaml in `helm-chart/nginx/values.yaml`:

```bash
mkdir -p helm-chart/nginx
```

Then you can copy the values file from [https://artifacthub.io/packages/helm/bitnami/nginx?modal=values](https://artifacthub.io/packages/helm/bitnami/nginx?modal=values) into `helm-chart/nginx/values.yaml`. 

In our `main.tf` I will use two ways to override values in our `values.yaml` using `set` and `templatefile`. The reason for the templatefile, is when we want to fetch a value and want to replace the content with our values file, it could be used when we retrieve a value from a data source as an example. In my example im just using a variable.

We will have the following:

```
resource "helm_release" "nginx" {
  name             = var.release_name
  version          = var.chart_version
  namespace        = var.namespace
  create_namespace = var.create_namespace
  chart            = var.chart_name
  repository       = var.chart_repository_url
  dependency_update = true
  reuse_values      = true
  force_update      = true
  atomic              = var.atomic

  set {
    name  = "image.tag"
    value = "1.23.3-debian-11-r3"
  }

  set {
    name  = "service.type"
    value = "ClusterIP"
  }

  values = [
    templatefile("${path.module}/helm-chart/nginx/values.yaml", {
      NAME_OVERRIDE   = var.release_name
    }
  )]

}
```

As you can see we are referencing a `NAME_OVERRIDE` in our `values.yaml`, I have cleaned up the values file to the following:

```yaml
nameOverride: "${NAME_OVERRIDE}"

## ref: https://hub.docker.com/r/bitnami/nginx/tags/
image:
  registry: docker.io
  repository: bitnami/nginx
  tag: 1.23.3-debian-11-r3
```

The `NAME_OVERRIDE` must be in a `${}` format.

In our `variables.tf` we will have the following:

```
variable "release_name" {
  type        = string
  default     = "nginx"
  description = "The name of our release."
}

variable "chart_repository_url" {
  type        = string
  default     = "https://charts.bitnami.com/bitnami"
  description = "The chart repository url."
}

variable "chart_name" {
  type        = string
  default     = "nginx"
  description = "The name of of our chart that we want to install from the repository."
}

variable "chart_version" {
  type        = string
  default     = "13.2.20"
  description = "The version of our chart."
}

variable "namespace" {
  type        = string
  default     = "apps"
  description = "The namespace where our release should be deployed into."
}

variable "create_namespace" {
  type        = bool
  default     = true
  description = "If it should create the namespace if it doesnt exist."
}

variable "atomic" {
  type        = bool
  default     = false
  description = "If it should wait until release is deployed."
}
```

And lastly our `outputs.tf`:

```
output "metadata" {
  value = helm_release.nginx.metadata
}
```

Now that we have all our configuration ready, we can initialize terraform:

```bash
terraform init
```

Then we can run a plan to see what terraform wants to deploy:

```bash
terraform plan
```

The plan output shows the following:

```bash
Terraform used the selected providers to generate the following execution plan. Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

  # helm_release.nginx will be created
  + resource "helm_release" "nginx" {
      + atomic                     = false
      + chart                      = "nginx"
      + cleanup_on_fail            = false
      + create_namespace           = true
      + dependency_update          = false
      + disable_crd_hooks          = false
      + disable_openapi_validation = false
      + disable_webhooks           = false
      + force_update               = false
      + id                         = (known after apply)
      + lint                       = false
      + manifest                   = (known after apply)
      + max_history                = 0
      + metadata                   = (known after apply)
      + name                       = "nginx"
      + namespace                  = "apps"
      + pass_credentials           = false
      + recreate_pods              = false
      + render_subchart_notes      = true
      + replace                    = false
      + repository                 = "https://charts.bitnami.com/bitnami"
      + reset_values               = false
      + reuse_values               = false
      + skip_crds                  = false
      + status                     = "deployed"
      + timeout                    = 300
      + values                     = [
          + <<-EOT
                nameOverride: "nginx"

                ## ref: https://hub.docker.com/r/bitnami/nginx/tags/
                image:
                  registry: docker.io
                  repository: bitnami/nginx
                  tag: 1.23.3-debian-11-r3
            EOT,
        ]
      + verify                     = false
      + version                    = "13.2.20"
      + wait                       = false
      + wait_for_jobs              = false

      + set {
          + name  = "image.tag"
          + value = "1.23.3-debian-11-r3"
        }
    }

Plan: 1 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + metadata = (known after apply)
```

Once we are happy with our plan, we can run a apply:

```bash
terraform apply 

Plan: 1 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + metadata = (known after apply)

Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes

helm_release.nginx: Creating...
helm_release.nginx: Still creating... [10s elapsed]

metadata = tolist([
  {
    "app_version" = "1.23.3"
    "chart" = "nginx"
    "name" = "nginx"
    "namespace" = "apps"
    "revision" = 1
    "values" = "{\"image\":{\"registry\":\"docker.io\",\"repository\":\"bitnami/nginx\",\"tag\":\"1.23.3-debian-11-r3\"},\"nameOverride\":\"nginx\"}"
    "version" = "13.2.20"
  },
])
```

Then we can verify if the pod is running:

```bash
kubectl get pods -n apps
NAME                    READY   STATUS    RESTARTS   AGE
nginx-59bdc6465-xdbfh   1/1     Running   0          2m35s
```

## Importing Helm Releases into Terraform State

If you have an existing helm release that was deployed with helm and you want to transfer the ownership to terraform, you first need to write the terraform code, then import the resources into terraform state using:

```bash
terraform import helm_release.nginx apps/nginx
```

Where the last argument is `<namespace>/<release-name>`. Once that is imported you can run terraform plan and apply.

If you want to discover all helm releases managed by helm you can use:

```bash
kubectl get all -A -l app.kubernetes.io/managed-by=Helm
```

## Thank You

Thanks for reading, feel free to check out my [website](https://ruan.dev/), feel free to subscribe to my [newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog) or follow me at [@ruanbekker](https://twitter.com/ruanbekker) on Twitter.

- Linktree: https://go.ruan.dev/links
- Patreon: https://go.ruan.dev/patreon

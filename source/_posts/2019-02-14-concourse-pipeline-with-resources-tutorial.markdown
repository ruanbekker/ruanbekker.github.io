---
layout: post
title: "Concourse Pipeline with Resources Tutorial"
date: 2019-02-14 15:58:10 -0500
comments: true
categories: ["concourse", "pipelines", "ci", "devops", "automation"]
---

![](https://i.snag.gy/gzkdu9.jpg?nocache=1511644783495)

In Concourse, Resources refer to external resource types such as `s3`, `github` etc. 

So for example, we can run a pipeline which pulls data from github, such as cloning a repository, so in other words the data that was cloned from the github repository is within the container where your tasks will be executed.

## Concourse Github Resourse Example

In this tutorial we will use the github resource type, in conjunction with a task that will execute a script, where the script will be inside the github repository.

Our pipeline as `pipeline.yml`:

```yaml
resources:
- name: concourse-tutorial
  type: git
  source:
    uri: https://github.com/ruanbekker/concourse-tutorial.git
    branch: master

jobs:
- name: job-hello-world
  public: true
  plan:
  - get: concourse-tutorial
  - task: hello-world
    file: concourse-tutorial/00-basic-tasks/task_hello_world.yml
```

You can head over to [hello-world](https://raw.githubusercontent.com/ruanbekker/concourse-tutorial/master/00-basic-tasks/task_hello_world.yml) task on github to see the task, but all it does is running a `uname -a`

So our job has a task that will call the action defined in our `task_hello_world.yml` which retrieves it from the `get` step, as you can see it's the `concourse-tutorial` resource, which is defined under the resources section as a git resource type.

Set the pipeline:

```bash
$ fly -t ci sp -c pipeline.yml -p 04-hello-world

apply configuration? [yN]: y
pipeline created!
```

Unpause the pipeline:

```bash
$ fly -t ci up -p 04-hello-world
unpaused '04-hello-world'
```

Trigger the job (trigger is off; default)

```bash
$ fly -t ci tj -j 04-hello-world/job-hello-world --watch
started 04-hello-world/job-hello-world #4

initializing
running uname -a
Linux 6a91b808-c488-4e3c-7b51-404f73405c31 4.9.0-8-amd64 #1 SMP Debian 4.9.110-3+deb9u4 (2018-08-21) x86_64 GNU/Linux
succeeded
```

So this job cloned the github repository, called the task file which calls the bash script from th github repository to run `uname -a` 

For my other content on concourse, have a look at the [concourse](https://blog.ruanbekker.com/blog/categories/concourse/) category.

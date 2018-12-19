---
layout: post
title: "Setup a Basic CI Pipeline on Gitlab"
date: 2018-12-19 05:43:00 -0500
comments: true
categories: ["devops", "cicd", "pipelines", "gitlab"]
---

![](https://user-images.githubusercontent.com/567298/50217968-0629f680-0393-11e9-8387-ad69937eb891.png)

In this tutorial we will setup a Basic CI (Continuous Integration) Pipeline on Gitlab. 

If you would like to read more on [Continuous Integration / Continuous Deliver (CI/CD)](https://www.atlassian.com/continuous-delivery/continuous-integration). 

## What will we be doing?

The aim for this is every time there is a commit made to the master branch, that the jobs defined by the `.gitlab-ci.yml` will be executed and will only pass if exit code 0 has been returned on the scripts. 

The jobs gets executed on [gitlab runners](https://docs.gitlab.com/ee/ci/yaml/) which is hosted with Giltab. Important to note is that every job runs independently from each other. 

## Our Basic Pipeline

In this pipeline we will have 2 basic jobs, each job execute a set of scripts:

Build:

```
$ echo "this is building" 
$ hostname
$ mkdir builds
$ touch builds/data.txt
$ echo "true" > builds/data.txt
```

Test:

```
$ echo "this is testing"
$ hostname
$ test -f builds/data.txt
$ grep "true" builds/data.txt
```

## Setup the Pipeline:

From a newly created repository which i've cloned to my workspace, create the config:

```
$ touch .gitlab-ci.yml
```

The config for above yaml file:

```yaml
stages:
  - build
  - test

build:
  stage: build
  script:
    - echo "this is building" 
    - hostname
    - mkdir builds
    - touch builds/data.txt
    - echo "false" > builds/data.txt
  artifacts:
    paths:
      - builds/

test:
  stage: test
  script:
    - echo "this is testing"
    - hostname
    - test -f builds/data.txt
    - grep "true" builds/data.txt
```

## Config Explained

- We define 2 stages for this pipeline: build and test
- We provide context of each job, the stage, the script (commands that will be executed in the lifecycle of the runner) and artifacts (artifacts will be the content that will be transferred, as each job runs in a different runner/container)

Note that I deliberately made a mistake so that my pipeline can fail. I populated the content "false" into the `builds/data.txt` file from the build job and grep for the word "true" on the test job, so this job will fail.

## Push to Github

Save the content to the config file, add, commit and push to master:

```bash
$ git add .gitlab-ci.yml
$ git commit -m "add gitlab-ci config"
$ git push origin master
```

## Gitlab Pipelines

From the Gitlab UI, if you head over to CI/CD -> Pipelines, you should see your pipeline running:

![](https://user-images.githubusercontent.com/567298/50216548-c103c580-038e-11e9-959b-ffdcf6038305.png)

When you select the Pipeline ID, you should be presented with the jobs available in your pipeline:

![](https://user-images.githubusercontent.com/567298/50216698-2ce62e00-038f-11e9-8cb5-8b67dc6e6e3d.png)

Select Jobs, and you should see an overview of your jobs. At this moment we can see that the build job has completed, and that the test job is busy running:

![](https://user-images.githubusercontent.com/567298/50216644-0922e800-038f-11e9-81d8-d40dd6ff0862.png)

Shortly thereafter the status of the test job should change to failed, select the Job ID and you should see the output:

![](https://user-images.githubusercontent.com/567298/50216833-89e1e400-038f-11e9-896f-9d36aad1c55d.png)

From the above output it gives you a link to create a new issue, which is quite handy.

## Fix the Pipeline Config

Let's go ahead and change the content in the `.gitlab-ci.yml` config and push to master:

```bash
$ vim .gitlab-ci.yml
```

Change line 12 from `- echo "false" > builds/data.txt` to `- echo "true" > builds/data.txt`, the full content of the file:

```yaml
stages:
  - build
  - test

build:
  stage: build
  script:
    - echo "this is building" 
    - hostname
    - mkdir builds
    - touch builds/data.txt
    - echo "true" > builds/data.txt
  artifacts:
    paths:
      - builds/

test:
  stage: test
  script:
    - echo "this is testing"
    - hostname
    - test -f builds/data.txt
    - grep "true" builds/data.txt
```

Commit and push to master:

```bash
$ git add .gitlab-ci.yml
$ git commit -m "change content in script"
$ git push origin master
```

When you head over to Pipelines, you will see that the pipeline is busy running, and on the right the commit that we just made:

![](https://user-images.githubusercontent.com/567298/50217143-91ee5380-0390-11e9-8b08-08626984f176.png)

## Great Success

Select the Pipeline ID, then select Jobs, you should see both jobs succeeded:

![](https://user-images.githubusercontent.com/567298/50217299-f9a49e80-0390-11e9-871d-78423f0651c7.png)

Select the Job ID of the test job, and from the output you will see that the job succeeded:

![](https://user-images.githubusercontent.com/567298/50217268-eb568280-0390-11e9-972c-58f23ce39741.png)

From this output you can also confirm from both jobs, that each job ran in a different runner as the hostnames that was returned to stdout was different.

## Resources

This was a really basic example to demonstrate Gitlab CI. Some relevant resources to this post:

- [Gitlab CI/CD Docs](https://docs.gitlab.com/ee/ci/)
- [Full CI/CD Example with Gitlab and Heroku](https://hackernoon.com/setting-up-ci-cd-on-gitlab-step-by-step-guide-part-1-826385728223)

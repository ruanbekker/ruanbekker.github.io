---
layout: post
title: "Concourse Pipeline to Build a Docker Image Automatically on Git Commit"
description: "Automatically Build and Push a Docker Image to Docker Hub using Concourse whenever a Git Commit is Published"
date: 2019-03-27 17:50:54 -0400
comments: true
categories: ["docker", "ci", "cicd", "concourse", "devops", "git", "pipelines"]
---

![](https://i.snag.gy/gzkdu9.jpg?nocache=1511644783495)

In this tutorial we will build a ci pipeline using concourse to build and push a image to dockerhub automatically, whenever a new git commit is made to the master branch.

## Our Project Setup

Our Directory Tree:

```bash
$ find .
./Dockerfile
./ci
./ci/pipeline.yml
./README.md
./docker-tunnel
```

The project used in this example is not important, but you can check it out at [https://github.com/ruanbekker/docker-remote-tunnel](https://github.com/ruanbekker/docker-remote-tunnel)

## Our Pipeline

A visual to see how the pipeline will look like in concourse:

![](https://user-images.githubusercontent.com/567298/55114996-1832d800-50ec-11e9-85ef-bc283711fbde.png)

Our pipeline definition will consist of 3 resources, `github repo`, `dockerhub image` and a `slack resource` to inform use whether a build has completed. 

Then we are specifying that the job should be triggered on a git commit for the master branch, build and push to our dockerhub repo.

Our pipeline definition `ci/pipeline.yml`:

```yaml
resources:
- name: git-repo
  type: git
  source:
    uri: git@github.com:ruanbekker/docker-remote-tunnel.git
    branch: master
    private_key: ((github_private_key))

- name: docker-remote-tunnel-image
  type: docker-image
  source:
    repository: ruanbekker/docker-remote-tunnel
    tag: test
    username: ((dockerhub_user))
    password: ((dockerhub_password))

- name: slack-alert
  type: slack-notification
  source:
    url: ((slack_notification_url))

resource_types:
  - name: slack-notification
    type: docker-image
    source:
      repository: cfcommunity/slack-notification-resource
      tag: v1.3.0

jobs:
- name: build-cached-image
  plan:
  - get: git-repo
    trigger: true
  - task: build-cached-image-workspace
    config:
      platform: linux
      image_resource:
        type: docker-image
        source:
          repository: rbekker87/build-tools

      outputs:
      - name: workspace
      inputs:
      - name: git-repo

      run:
        path: /bin/sh
        args:
        - -c
        - |
          output_dir=workspace

          cat << EOF > "${output_dir}/Dockerfile"
          FROM alpine

          ADD git-repo /tmp/git-repo
          RUN mv /tmp/git-repo/docker-tunnel /usr/bin/docker-tunnel
          RUN apk --no-cache add screen docker openssl openssh-client apache2-utils
          RUN /usr/bin/docker-tunnel -h
          RUN rm -rf /tmp/git-repo
          EOF

          cp -R ./git-repo "${output_dir}/git-repo"

  - put: docker-remote-tunnel-image
    params:
      build: workspace

    on_failure:
      put: slack-alert
      params:
        channel: '#system_events'
        username: 'concourse'
        icon_emoji: ':concourse:'
        silent: true
        text: |
            *$BUILD_PIPELINE_NAME/$BUILD_JOB_NAME* ($BUILD_NAME) FAILED to build image
            https://ci.domain.com/teams/$BUILD_TEAM_NAME/pipelines/$BUILD_PIPELINE_NAME/jobs/$BUILD_JOB_NAME/builds/$BUILD_NAME
    on_success:
      put: slack-alert
      params:
        channel: '#system_events'
        username: 'concourse'
        icon_emoji: ':concourse:'
        silent: true
        text: |
            *$BUILD_PIPELINE_NAME/$BUILD_JOB_NAME* ($BUILD_NAME) SUCCESS - Image has been published
            https://ci.domain.com/teams/$BUILD_TEAM_NAME/pipelines/$BUILD_PIPELINE_NAME/jobs/$BUILD_JOB_NAME/builds/$BUILD_NAME

- name: test
  plan:
  - get: docker-remote-tunnel-image
    passed: [build-cached-image]
    trigger: true
  - get: git-repo
    passed: [build-cached-image]
  - task: run-tests
    image: docker-remote-tunnel-image
    config:
      platform: linux
      inputs:
      - name: git-repo
      run:
        dir: git-repo
        path: sh
        args:
        - /usr/bin/docker-tunnel
        - --help

    on_failure:
      put: slack-alert
      params:
        channel: '#system_events'
        username: 'concourse'
        icon_emoji: ':concourse:'
        silent: true
        text: |
            *$BUILD_PIPELINE_NAME/$BUILD_JOB_NAME* ($BUILD_NAME) FAILED - Testing image failure
            https://ci.domain.com/teams/$BUILD_TEAM_NAME/pipelines/$BUILD_PIPELINE_NAME/jobs/$BUILD_JOB_NAME/builds/$BUILD_NAME
    on_success:
      put: slack-alert
      params:
        channel: '#system_events'
        username: 'concourse'
        icon_emoji: ':concourse:'
        silent: true
        text: |
            *$BUILD_PIPELINE_NAME/$BUILD_JOB_NAME* ($BUILD_NAME) SUCCESS - Testing image Succeeded
            https://ci.domain.com/teams/$BUILD_TEAM_NAME/pipelines/$BUILD_PIPELINE_NAME/jobs/$BUILD_JOB_NAME/builds/$BUILD_NAME
```

Note that our secret information is templatized and saved in our local `credentials.yml` which should never be stored in version control:

```yaml
slack_notification_url: https://api.slack.com/aaa/bbb/ccc
dockerhub_user: myuser
dockerhub_password: mypasswd
github_private_key: |-
        -----BEGIN RSA PRIVATE KEY-----
        some-secret-data
        -----END RSA PRIVATE KEY------
```

## Set the Pipeline:

Now that we have our pipeline definition, credentials and application code (stored in version control), go ahead and set the pipeline, which will save the pipeline configuration in concourse:

```bash
# pipeline name: my-docker-app-pipeline
$ fly -t scw sp -n main -c pipeline.yml -p my-docker-app-pipeline -l credentials.yml
```

Now the pipeline is saved on concourse but in a paused state, go ahead and unpause the pipeline:

```bash
$ fly -t scw up -p my-docker-app-pipeline
```

## Test your Pipeline

Make a commit to master and head over to concourse and look at it go:

![](https://user-images.githubusercontent.com/567298/55116018-a5772c00-50ee-11e9-861e-a5ddc74550e2.png)

Thanks for reading, make sure to check out my other posts on [#concourse](https://blog.ruanbekker.com/blog/categories/concourse)

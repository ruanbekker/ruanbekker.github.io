---
layout: post
title: "Using Concourse CI to Deploy to Docker Swarm"
date: 2019-05-04 17:11:17 -0400
comments: true
categories: ["concourse", "cicd", "devops", "docker", "swarm"] 
---

![](https://i.snag.gy/gzkdu9.jpg?nocache=1511644783495)

In this tutorial we will use Concourse to Deploy our application to Docker Swarm.

## The Flow

* Our application code resides on Github
* The pipeline triggers when a commit is pushed to the master branch
* The pipeline will automatically deploy to the staging environment
* The pipeline requires a manual trigger to deploy to prod
* Note: Staging and Prod on the same swarm for demonstration

The code for this tutorial is available on my **[github repository](https://github.com/ruanbekker/concourse-swarm-app-demo)**

## Application Structure

The application structure for our code looks like this:

![](https://user-images.githubusercontent.com/567298/57184912-1d412f00-6ec3-11e9-85e9-6517d83e96e8.png)

## Pipeline Walktrough

Our `ci/pipeline.yml`

```yaml
resources:
  - name: main-repo
    type: git
    source:
      uri: git@github.com:ruanbekker/concourse-swarm-app-demo.git
      branch: master
      private_key: ((github_private_key))

  - name: main-repo-staging
    type: git
    source:
      uri: git@github.com:ruanbekker/concourse-swarm-app-demo.git
      branch: master
      private_key: ((github_private_key))
      paths:
        - config/staging/*

  - name: main-repo-prod
    type: git
    source:
      uri: git@github.com:ruanbekker/concourse-swarm-app-demo.git
      branch: master
      private_key: ((github_private_key))
      paths:
        - config/prod/*

  - name: slack-alert
    type: slack-notification
    source:
      url: ((slack_notification_url))

  - name: version-staging
    type: semver
    source:
      driver: git
      uri: git@github.com:ruanbekker/concourse-swarm-app-demo.git
      private_key: ((github_private_key))
      file: version-staging
      branch: version-staging

  - name: version-prod
    type: semver
    source:
      driver: git
      uri: git@github.com:ruanbekker/concourse-swarm-app-demo.git
      private_key: ((github_private_key))
      file: version-prod
      branch: version-prod

resource_types:
  - name: slack-notification
    type: docker-image
    source:
      repository: cfcommunity/slack-notification-resource
      tag: v1.3.0

jobs:
  - name: bump-staging-version
    plan:
    - get: main-repo-staging
      trigger: true
    - get: version-staging
    - put: version-staging
      params:
        bump: major

  - name: bump-prod-version
    plan:
    - get: main-repo-prod
      trigger: true
    - get: version-prod
    - put: version-prod
      params:
        bump: major

  - name: deploy-staging
    plan:
    - get: main-repo-staging
    - get: main-repo
    - get: version-staging
      passed:
      - bump-staging-version
      trigger: true
    - task: deploy-staging
      params:
        DOCKER_SWARM_HOSTNAME: ((docker_swarm_staging_host))
        DOCKER_SWARM_KEY: ((docker_swarm_key))
        DOCKER_HUB_USER: ((docker_hub_user))
        DOCKER_HUB_PASSWORD: ((docker_hub_password))
        SERVICE_NAME: app-staging
        SWARM: staging
        ENVIRONMENT: staging
        AWS_ACCESS_KEY_ID: ((aws_access_key_id))
        AWS_SECRET_ACCESS_KEY: ((aws_secret_access_key))
        AWS_DEFAULT_REGION: ((aws_region))
      config:
        platform: linux
        image_resource:
          type: docker-image
          source:
            repository: rbekker87/build-tools
            tag: latest
            username: ((docker_hub_user))
            password: ((docker_hub_password))
        inputs:
        - name: main-repo-staging
        - name: main-repo
        - name: version-staging
        run:
          path: /bin/sh
          args:
            - -c
            - |
              ./main-repo/ci/scripts/deploy.sh
      on_failure:
        put: slack-alert
        params:
          channel: '#system_events'
          username: 'concourse'
          icon_emoji: ':concourse:'
          silent: true
          text: |
            *$BUILD_PIPELINE_NAME/$BUILD_JOB_NAME* ($BUILD_NAME) FAILED :rage: - TestApp Deploy to staging-swarm failed
            http://ci.example.local/teams/$BUILD_TEAM_NAME/pipelines/$BUILD_PIPELINE_NAME/jobs/$BUILD_JOB_NAME/builds/$BUILD_NAME
      on_success:
        put: slack-alert
        params:
          channel: '#system_events'
          username: 'concourse'
          icon_emoji: ':concourse:'
          silent: true
          text: |
            *$BUILD_PIPELINE_NAME/$BUILD_JOB_NAME* ($BUILD_NAME) SUCCESS :aww_yeah: - TestApp Deploy to staging-swarm succeeded
            http://ci.example.local/teams/$BUILD_TEAM_NAME/pipelines/$BUILD_PIPELINE_NAME/jobs/$BUILD_JOB_NAME/builds/$BUILD_NAME

  - name: deploy-prod
    plan:
    - get: main-repo-prod
    - get: main-repo
    - get: version-prod
      passed:
      - bump-prod-version
    - task: deploy-prod
      params:
        DOCKER_SWARM_HOSTNAME: ((docker_swarm_prod_host))
        DOCKER_SWARM_KEY: ((docker_swarm_key))
        DOCKER_HUB_USER: ((docker_hub_user))
        DOCKER_HUB_PASSWORD: ((docker_hub_password))
        SERVICE_NAME: app-prod
        SWARM: prod
        ENVIRONMENT: production
        AWS_ACCESS_KEY_ID: ((aws_access_key_id))
        AWS_SECRET_ACCESS_KEY: ((aws_secret_access_key))
        AWS_DEFAULT_REGION: ((aws_region))
      config:
        platform: linux
        image_resource:
          type: docker-image
          source:
            repository: rbekker87/build-tools
            tag: latest
            username: ((docker_hub_user))
            password: ((docker_hub_password))
        inputs:
        - name: main-repo-prod
        - name: main-repo
        - name: version-prod
        run:
          path: /bin/sh
          args:
            - -c
            - |
              ./main-repo/ci/scripts/deploy.sh
      on_failure:
        put: slack-alert
        params:
          channel: '#system_events'
          username: 'concourse'
          icon_emoji: ':concourse:'
          silent: true
          text: |
            *$BUILD_PIPELINE_NAME/$BUILD_JOB_NAME* ($BUILD_NAME) FAILED :rage: - TestApp Deploy to prod-swarm failed
            http://ci.example.local/teams/$BUILD_TEAM_NAME/pipelines/$BUILD_PIPELINE_NAME/jobs/$BUILD_JOB_NAME/builds/$BUILD_NAME
      on_success:
        put: slack-alert
        params:
          channel: '#system_events'
          username: 'concourse'
          icon_emoji: ':concourse:'
          silent: true
          text: |
            *$BUILD_PIPELINE_NAME/$BUILD_JOB_NAME* ($BUILD_NAME) SUCCESS :aww_yeah: - TestApp Deploy to prod-swarm succeeded
            http://ci.example.local/teams/$BUILD_TEAM_NAME/pipelines/$BUILD_PIPELINE_NAME/jobs/$BUILD_JOB_NAME/builds/$BUILD_NAME
```

Our `ci/credentials.yml` which will hold all our secret info, which will remain local:

```
username: yourdockerusername
password: yourdockerpassword
docker_swarm_prod_host: 10.20.30.40
...
```

The first step of our deploy will invoke a shell script that will establish a ssh tunnel to the docker host, mounting the docker socket to a tcp local port, then exporting the docker host port to the tunneled port, `ci/scripts/deploy.sh`:

```
#!/usr/bin/env sh

export DOCKER_HOST="localhost:2376"

echo "${DOCKER_SWARM_KEY}" | sed -e 's/\(KEY-----\)\s/\1\n/g; s/\s\(-----END\)/\n\1/g' | sed -e '2s/\s\+/\n/g' > key.pem
chmod 600 key.pem

screen -S \
  sshtunnel -m -d sh -c \
  "ssh -oStrictHostKeyChecking=no -oUserKnownHostsFile=/dev/null -i ./key.pem -NL localhost:2376:/var/run/docker.sock root@$DOCKER_SWARM_HOSTNAME"

sleep 5
docker login -u "${DOCKER_HUB_USER}" -p "${DOCKER_HUB_PASSWORD}"
docker stack deploy --prune -c ./main-repo/ci/docker/docker-compose.${ENVIRONMENT}.yml $SERVICE_NAME --with-registry-auth

if [ $? != "0" ]
  then
    echo "deploy failure for: $SERVICE_NAME"
    screen -S sshtunnel -X quit
    exit 1
  else
    set -x
    echo "deploy success for: $SERVICE_NAME"
    screen -S sshtunnel -X quit
fi
```

The deploy script references the docker-compose files, first our `ci/docker/docker-compose.staging.yml`:

```
version: "3.4"

services:
  web:
    image: ruanbekker/web-center-name
    environment:
      - APP_ENVIRONMENT=Staging
    ports:
      - 81:5000
    networks:
      - web_net
    deploy:
      mode: replicated
      replicas: 2

networks:
  web_net: {}
```

Also, our docker-compose for production, `ci/docker/docker-compose.production.yml`:

```
version: "3.4"

services:
  web:
    image: ruanbekker/web-center-name
    environment:
      - APP_ENVIRONMENT=Production
    ports:
      - 80:5000
    networks:
      - web_net
    deploy:
      mode: replicated
      replicas: 10

networks:
  web_net: {}
```

## Set the Pipeline in Concourse

Create 2 branches in your github repository for versioning: `version-staging` and `version-prod`, then logon to concourse and save the target:

```
$ fly -t ci login -n main -c http://<concourse-ip>
```

Set the pipeline, point the config, local variables definition and name the pipeline:

```
$ fly -t ci sp -n main -c ci/pipeline.yml -p <pipeline-name> -l ci/<variables>.yml
```

You will find that the pipeline will look like below and that it will be in a paused state:

![](https://user-images.githubusercontent.com/567298/54060759-96dfd800-4206-11e9-9236-e3b86783417c.png)

Unpause the pipeline:

```
$ fly -t ci up -p swarm-demo
```

The pipeline should kick-off automatically due to the trigger that is set to true:

![](https://user-images.githubusercontent.com/567298/54060811-cbec2a80-4206-11e9-8de7-a0b308f20cef.png)

Deployed automatically to staging, prod is a manual trigger:

![](https://user-images.githubusercontent.com/567298/54060991-8e3bd180-4207-11e9-9726-2c01ca10d24a.png)

## Testing our Application

For demonstration purposes we have deployed staging on port 81 and production on port 80.

Testing Staging on http://<swarm-ip>:81/

![](https://user-images.githubusercontent.com/567298/57185377-73fe3700-6eca-11e9-91d3-953e754cbde9.png)

Testing Production on http://<swarm-ip>:80/

![](https://user-images.githubusercontent.com/567298/57185383-8d06e800-6eca-11e9-8cff-c3a665f9f377.png)

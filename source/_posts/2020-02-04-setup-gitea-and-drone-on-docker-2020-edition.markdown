---
layout: post
title: "Setup Gitea and Drone on Docker 2020 Edition"
date: 2020-02-04 21:58:39 +0200
comments: true
categories: ["drone", "gitea", "devops", "cicd"] 
---

This post will show how to setup gitea and drone on a docker host with docker-compose. The drone example in this tutorial will be very basic, but in future posts I will focus more on pipeline examples using drone.

As this post I will use to link back for those who needs to setup the stack first.

## Deploy Gitea and Drone

Get the docker-compose.yml:

```
$ wget -O docker-compose.yml https://gist.githubusercontent.com/ruanbekker/27d2cb2e3f4194ee5cfe2bcdc9c4bf52/raw/25590a23e87190a871d70fd57ab461ce303cd286/2020.02.04-gitea-drone_docker-compose.yml
```

Verify the environment variables and adjust the defaults if you want to change something, if you want your git clone ssh url to point to a dns name as well as the url for gitea, then change the following to your dns:

```
  gitea:
    ...
    environment:
      - ROOT_URL=http://gi.myresolvable.dns:3000
      - SSH_DOMAIN=git.myresolvable.dns
```

then deploy:

```
$ docker-compose up -d
```

## Access your Stack

The default port for Gitea in this setup is port `3000`:

<img width="1273" alt="image" src="https://user-images.githubusercontent.com/567298/73778916-9b08d280-4794-11ea-88a6-8aafcd6e2656.png">

Initial configuration will be pre-populated from our environment variables:

<img width="859" alt="image" src="https://user-images.githubusercontent.com/567298/73778973-b378ed00-4794-11ea-8615-d8deeee07b32.png">

From the additional settings section, create your admin user (this user is referenced in our docker-compose as well)

<img width="871" alt="image" src="https://user-images.githubusercontent.com/567298/73779102-df946e00-4794-11ea-9177-712904e9dbee.png">

Because I am using gitea as my hostname, you will be redirected to `http://gitea:3000/user/login`, if you don't have a host entry setup for that it will fail, but you can just replace your servers ip in the request url and it will take you to the login screen, and after logging on, you should see this screen:

<img width="1269" alt="image" src="https://user-images.githubusercontent.com/567298/73779494-752ffd80-4795-11ea-9c34-ff9eee269b0c.png">

Access drone on port 80, you will be directed to the login screen:

<img width="773" alt="image" src="https://user-images.githubusercontent.com/567298/73779560-9395f900-4795-11ea-8f90-e420aa4c383d.png">

Use the same credentials that you have used to sign up with gitea, and after logging on, you should see this:

<img width="1280" alt="image" src="https://user-images.githubusercontent.com/567298/73779651-b2948b00-4795-11ea-9939-51531467b600.png">

If ever your login does not work, just delete the drone access token on gitea (gitea:3000/user/settings/applications)

## Create a Git Repository

On gitea, create a new git repository:

<img width="698" alt="image" src="https://user-images.githubusercontent.com/567298/73779800-fdae9e00-4795-11ea-9422-938a24c08eb3.png">

You should now see your git repository:

<img width="1005" alt="image" src="https://user-images.githubusercontent.com/567298/73779843-10c16e00-4796-11ea-98c6-2f70519146f0.png">

Create a new file `.drone.yml` with the following content:

```
kind: pipeline
name: hello-world
type: docker

steps:
  - name: say-hello
    image: busybox
    commands:
      - echo hello-world
```

It should look like this:

<img width="1019" alt="image" src="https://user-images.githubusercontent.com/567298/73779989-4fefbf00-4796-11ea-8e65-8441d3440d19.png">

## Configure Drone

Commit the file in your git repository and head over to drone (which should be available on port `80`) and select "Sync", after a couple of seconds you should see the git repository:

<img width="860" alt="image" src="https://user-images.githubusercontent.com/567298/73780087-7f063080-4796-11ea-92ce-3d216c4e4097.png">

Select "Activate" and "Activate Repository", on the next screen select "Trusted", verify that the configuration file name is the same as which we created, then select save:

<img width="860" alt="image" src="https://user-images.githubusercontent.com/567298/73780208-b543b000-4796-11ea-98f1-0f072eeae0ef.png">

## Trigger the Build

If you click on "Activity Feed" you should see a empty feed. Head back to git and commit a dummy file to trigger the build to start. I will create a file name `trigger` with the value as `1` for my dummy file.

After committing the file, you will see on drone that the build started:

<img width="900" alt="image" src="https://user-images.githubusercontent.com/567298/73780444-297e5380-4797-11ea-94e6-58c01ae11143.png">

When we select the build, you can see we have a clone step and the step that we defined to echo "hello-world":

<img width="851" alt="image" src="https://user-images.githubusercontent.com/567298/73780516-46b32200-4797-11ea-8a07-0563dea90d83.png">

## Thank You

This was a basic introduction for gitea and drone, but I will use this post in conjunction with more gitea examples in the future.



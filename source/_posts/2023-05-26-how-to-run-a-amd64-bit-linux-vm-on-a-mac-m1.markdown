---
layout: post
title: "How to Run a AMD64 Bit Linux VM on a Mac M1"
date: 2023-05-26 08:35:38 -0400
comments: true
categories: ["amd64", "linux", "mac", "virtualization"]
---

This tutorial will show you how you can run 64bit Ubuntu Linux Virtual Machines on a Apple Mac M1 arm64 architecture macbook using [UTM](https://github.com/utmapp/UTM).

## Installation

Head over to their [documentation](https://docs.getutm.app/installation/ios/) and download the `UTM.dmg` file and install it, once it is installed and you have opened UTM, you should see this screen:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/a5303fc2-0925-4055-921e-78292d5b45e0)

## Creating a Virtual Machine

In my case I would like to run a Ubuntu VM, so head over to the [Ubuntu Server Download](https://ubuntu.com/download/server) page and download the version of choice, I will be downloading Ubuntu Server 22.04, once you have your ISO image downloaded, you can head over to the next step which is to "Create a New Virtual Machine":

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/3fa35dc5-982e-469b-822d-e9c548edf69f)

I will select "Emulate" as I want to run a amd64 bit architecture, then select "Linux":

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/58f1485c-9b6a-4703-a2fb-377263c4750c)

In the next step we want to select the Ubuntu ISO image that we downloaded, which we want to use to boot our VM from:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/676b6258-ccab-4e4e-a447-db012a2de1b3)

Browse and select the image that you downloaded, once you selected it, it should show something like this:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/c102f46e-e5df-45f5-9bec-727b67ec1bf2)

Select continue, then select the architecture to `x86_64`, the system I kept on defaults and the memory I have set to `2048MB` and cores to `2` but that is just my preference:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/2c79e154-5fef-46bb-8b10-17e4a837ce0c)

The next screen is to configure storage, as this is for testing I am setting mine to `8GB`:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/d62730e8-dda7-4324-95bd-6d01532af1da)

The next screen is shared directories, this is purely optional, I have created a directory for this:

```bash
mkdir ~/utm
```

Which I've then defined for a shared directory, but this depends if you need to have shared directories from your local workstation. 

The next screen is a summary of your choices and you can name your vm here:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/3dee86f1-8f09-4caa-8cb2-0470352c9e77)

Once you are happy select save, and you should see something like this:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/725951b7-d0ed-4b64-8418-1197415da91a)

You can then select the play button to start your VM.

The console should appear and you can select install or try this vm:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/bf8ed7fe-e7c2-4855-a4c0-cfd98857fbd0)

This will start the installation process of a Linux Server:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/09364ab8-be5a-4c51-9a0f-edea04707802)

Here you can select the options that you would like, I would just recommend to ensure that you select `Install OpenSSH Server` so that you can connect to your VM via SSH.

Once you get to this screen:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/8204583e-2175-4815-a96b-3c4d8063758a)

The installation process is busy and you will have to wait a couple of minutes for it to complete. Once you see the following screen the installation is complete:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/4c8add6a-fb1e-469e-967f-0c78228eb340)

On the right hand side select the circle, then select CD/DVD and select the ubuntu iso and select eject:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/4c17223e-a755-4742-9b95-ef64dc217264)

## Starting your VM

Then power off the guest and power on again, then you should get a console login, then you can proceed to login, and view the ip address:

![](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/51d56c64-2be2-4036-836d-579fd1bd6ac2)

## SSH to your VM

Now from your terminal you should be able to ssh to the VM:

![](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/7ee94cb4-73bf-4ddc-9eb3-01fcee68a29f)

We can also verify that we are running a 64bit vm, by running `uname --processor`:

![](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/ed444a85-28c1-44af-88ac-5e956a742f59)

## Thank You

Thanks for reading, feel free to check out my [website](https://ruan.dev/), feel free to subscribe to my [newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog) or follow me at [@ruanbekker](https://twitter.com/ruanbekker) on Twitter.

- Linktree: https://go.ruan.dev/links
- Patreon: https://go.ruan.dev/patreon

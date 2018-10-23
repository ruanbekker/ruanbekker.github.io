---
layout: post
title: "My PiStack Blog Proudly hosted on my RaspberryPi Swarm Cluster"
date: 2018-10-23 16:11:19 -0400
comments: true
categories: ["raspberrypi", "docker", "swarm", "cluster"] 
---

This is a repost of my [first blogpost which is hosted on my Raspberry Pi Cluster (04 July 2017)](http://blog.pistack.co.za/my-blog-proudly-hosted-on-my-raspberrypi-cluster/), that runs Docker Swarm and is served from my Home in South Africa.

## Just Look at It!

- 3x Raspberry Pi 3 Model B
- Quad Core 1.2GHz Broadcom BCM2837 64bit CPU
- 1GB RAM
- BCM43438 wireless LAN and Bluetooth Low Energy (BLE) on board
- 3x 32GB Sandisk SD Cards (Replicated GlusterFS Volume for <code>/gluster</code> partition) 
- Upgraded switched Micro USB power source up to 2.5A


![](https://objects.ruanbekker.com/assets/images/rpi-cluster.jpg)

## My Setup:

I have 3x [Raspberrypi 3's](https://www.raspberrypi.org/products/raspberry-pi-3-model-b/), each with a [32GB SanDisk SD Card](https://www.sandisk.com/home/memory-cards/sd-cards/ultra-sd), formatted with [Raspbian Jessie Lite](https://www.raspberrypi.org/downloads/raspbian/), powered by a [6 Port USB Hub](https://www.pishop.co.za/store/rpi-power/anidées-6-port-50w-high-power-usb-hub-25aport) and networked with a [Totolink 5 Port Gigabit Switch](https://m.takealot.com/#product_1?id=35258721), but note that: *the Rpi does not support Gigabit Networking*

For persistent storage I have setup a Replicated GlusterFS Volume across the 3 nodes. 

More details on how I did the setup, can be found from the [Setting Up a Docker Swarm Cluster on RaspberryPi Nodes](http://blog.pistack.co.za/setting-up-a-docker-swarm-cluster-on-3-raspberrypi-nodes/) blog post.

## Thanks!

Thanks for the visit, I will blog about awesome Docker and RaspberryPi related stuff as my mind stumble along awesome ideas :) 

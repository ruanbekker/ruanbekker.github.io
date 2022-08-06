---
layout: post
title: "Unmask a Masked Service in Systemd"
date: 2017-12-09 02:02:21 -0500
comments: true
categories: ["systemd", "linux"] 
---

I was busy setting up a `docker-volume-netshare` plugin to use NFS Volumes for Docker, which relies on the `nfs-utils/nfs-common` package, and when trying to start the service, I found that the `nfs-common` service is `masked`:

<style>
#carbonads {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", Helvetica, Arial,
  sans-serif;
}

#carbonads {
  display: block;
  overflow: hidden;
  max-width: 728px;
  position: relative;
  background-color: hsl(0, 0%, 99%);
  border: solid 1px #eee;
  font-size: 22px;
  box-sizing: content-box;
}

#carbonads > span {
  display: block;
}

#carbonads a {
  color: inherit;
  text-decoration: none;
}

#carbonads a:hover {
  color: inherit;
}

.carbon-wrap {
  display: flex;
  align-items: center;
}

.carbon-img {
  display: block;
  margin: 0;
  line-height: 1;
}

.carbon-img img {
  display: block;
  height: 100px;
  width: auto;
}

.carbon-text {
  display: block;
  padding: 0 1em;
  line-height: 1.35;
  text-align: left;
}

.carbon-poweredby {
  display: block;
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 6px 10px;
  background: repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 5px,
                  hsla(0, 0%, 0%, 0.025) 5px,
                  hsla(0, 0%, 0%, 0.025) 10px
  )
  hsla(203, 11%, 95%, 0.8);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  font-size: 8px;
  border-top-left-radius: 4px;
  line-height: 1;
}

@media only screen and (min-width: 320px) and (max-width: 759px) {
  .carbon-text {
    font-size: 14px;
  }
}
</style>
<script async type="text/javascript" src="//cdn.carbonads.com/carbon.js?serve=CEAIP2JL&placement=blogruanbekkercom" id="_carbonads_js"></script>

```bash
$ sudo systemctl start docker-volume-netshare.service
Failed to start docker-volume-netshare.service: Unit nfs-common.service is masked.
```

Looking at the `nfs-common` service:

```bash
$ sudo systemctl is-enabled nfs-common
masked

$ sudo systemctl enable nfs-common
Synchronizing state of nfs-common.service with SysV service script with /lib/systemd/systemd-sysv-install.
Executing: /lib/systemd/systemd-sysv-install enable nfs-common
Failed to enable unit: Unit file /lib/systemd/system/nfs-common.service is masked.
```

It appears that the unit file has a symbolic link to /dev/null:

```bash
$ file /lib/systemd/system/nfs-common.service 
/lib/systemd/system/nfs-common.service: symbolic link to /dev/null
```

I was able to unmask the service by removing the file:

```bash
$ sudo rm /lib/systemd/system/nfs-common.service 
```

Then reloading the daemon:

```bash
$ sudo systemctl daemon-reload
```

As we can see the `nfs-common` service is not running:

```bash
$ sudo systemctl status nfs-common
● nfs-common.service - LSB: NFS support files common to client and server
   Loaded: loaded (/etc/init.d/nfs-common; generated; vendor preset: enabled)
   Active: inactive (dead)
     Docs: man:systemd-sysv-generator(8)
```

Let's go ahead and start the service:

```bash
$ sudo systemctl start nfs-common
$ sudo systemctl status nfs-common
● nfs-common.service - LSB: NFS support files common to client and server
   Loaded: loaded (/etc/init.d/nfs-common; generated; vendor preset: enabled)
   Active: active (running) since Sat 2017-12-09 08:59:47 SAST; 2s ago
     Docs: man:systemd-sysv-generator(8)
  Process: 7382 ExecStart=/etc/init.d/nfs-common start (code=exited, status=0/SUCCESS)
      CPU: 162ms
   CGroup: /system.slice/nfs-common.service
           └─7403 /usr/sbin/rpc.idmapd
```

Now we can see the serive is unmasked and started, also remember to enable to service on boot:

```bash
$ sudo systemctl enable nfs-common
nfs-common.service is not a native service, redirecting to systemd-sysv-install.
Executing: /lib/systemd/systemd-sysv-install enable nfs-common

$ sudo systemctl is-enabled nfs-common
enabled
```

[![Say Thanks!](https://img.shields.io/badge/Say%20Thanks-!-1EAEDB.svg)](https://saythanks.io/to/ruan.ru.bekker@gmail.com) 

Thanks for reading, feel free to check out my **[website](https://ruan.dev)**, feel free to subscribe to my **[newsletter](http://digests.ruanbekker.com/?via=hashnode)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.




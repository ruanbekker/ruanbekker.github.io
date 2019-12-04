---
layout: post
title: "Unmask a Masked Service in Systemd"
date: 2017-12-09 02:02:21 -0500
comments: true
categories: ["systemd", "linux"] 
---

I was busy setting up a `docker-volume-netshare` plugin to use NFS Volumes for Docker, which relies on the `nfs-utils/nfs-common` package, and when trying to start the service, I found that the `nfs-common` service is `masked`:

<a href="https://bekkerclothing.com/collections/developer?utm_source=blog.ruanbekker.com&utm_medium=blog&utm_campaign=leaderboard_ad" target="_blank"><img alt="bekker-clothing-developer-tshirts" src="https://user-images.githubusercontent.com/567298/70170981-7c278a80-16d6-11ea-9759-6621d02c1423.png"></a>


```bash
$ sudo systemctl start docker-volume-netshare.service
Failed to start docker-volume-netshare.service: Unit nfs-common.service is masked.
```

Looking at the `nfs-common` service:

```bash
sudo systemctl is-enabled nfs-common
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

<script type="text/javascript">
  ( function() {
    if (window.CHITIKA === undefined) { window.CHITIKA = { 'units' : [] }; };
    var unit = {"calltype":"async[2]","publisher":"rbekker87","width":728,"height":90,"sid":"Chitika Default"};
    var placement_id = window.CHITIKA.units.length;
    window.CHITIKA.units.push(unit);
    document.write('<div id="chitikaAdBlock-' + placement_id + '"></div>');
}());
</script>
<script type="text/javascript" src="//cdn.chitika.net/getads.js" async></script>

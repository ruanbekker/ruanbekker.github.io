---
layout: post
title: "Fix Mac High Sierra opendlrectoryd Too many corpses being created issue"
date: 2019-01-07 06:57:56 -0500
comments: true
categories: ["mac", "support"]
---

This morning my brother's iMac gave some boot issues. The resolution to the issue was to drop into a terminal, rename the mrb_cache directory and reboot.

## Steps to Resolution

When booting, the loading bar got stuck as seen below:

![](https://user-images.githubusercontent.com/567298/50767470-9f0eac00-1285-11e9-80a6-0475bb3b97cb.png)

Starting to investigate, he ran `cmd+s` to logon to single user mode, and he noticed the error: **crashed: opendlrectoryd. Toomay corpses being crashed**, as seen from the screenshot below:

![](https://user-images.githubusercontent.com/567298/50767477-a635ba00-1285-11e9-9086-605e06864d39.png)

After some troubleshooting he had to hard reboot his mac, hit `cmd+r` repeatedly until he loaded his mac into recovery mode:

![](https://user-images.githubusercontent.com/567298/50767613-2fe58780-1286-11e9-9d5b-02b73c052d6f.png)

From thereon, from the top dropdown select Utilities -> Terminal, change into the directory where the cache folder needs to be moved:

```
$ cd /Volumes/Macintosh\ HD/var/db/caches/opendirectory
```

List to see if the cache directory is present:

```bash
$ ls -la | grep cache
-rw-------- root wheel 28655 	Jan 3 	22:22 mbr_cache
```

Rename the cache directory:

```bash
mv ./mbr_cache ./mbr_cache_old
```

Once that is done, reboot:

```bash
$ reboot
```

If you experienced the similar issue, you should be able to see the login screen after successful boot.

## Thank You

Please feel free to show support by, **sharing** this post, making a **donation**, **subscribing** or **reach out to me** if you want me to demo and write up on any specific tech topic.

<center>
<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
<input type="hidden" name="cmd" value="_s-xclick" />
<input type="hidden" name="hosted_button_id" value="W7CBGYTCWGANQ" />
<input type="image" src="https://user-images.githubusercontent.com/567298/49853901-461c3700-fdf1-11e8-9d80-8a424a3173af.png" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
</form>
</center>

<br>

Ad space:

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

<p>

Thanks for reading!

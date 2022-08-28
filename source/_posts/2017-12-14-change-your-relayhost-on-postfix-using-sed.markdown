---
layout: post
title: "Change your Relayhost on Postfix using Sed"
date: 2017-12-14 10:11:33 -0500
comments: true
categories: ["postfix", "mail", "linux", "sed"] 
---

a Quick post on how to change your relayhost on Postfix to a External SMTP Provider and aswell how to revert back the changes so the Relay server sends out mail directly.

## Checking your current relayhost configuration:

We will assume your `/etc/postfix/main.cf` has a relayhost entry of `#relayhost =`, in my example it will look like this:

```bash
$ cat /etc/postfix/main.cf
#relayhost =
```

If not, you can just adjust your sed command accordingly.

## Changing your relayhost configuration to a External SMTP Provider:

We will use sed to change the relayhost to `za-smtp-outbound-1.mimecast.co.za` for example:

```bash
$ sed -i 's/#relayhost\ =/relayhost\ =\ \[za-smtp-outbound-1.mimecast.co.za\]/g' /etc/postfix/main.cf
```

to verify that we have set the config, look at the config:

```bash
$ cat /etc/postfix/main.cf | grep relayhost 
relayhost = [za-smtp-outbound-1.mimecast.co.za]
```

Once you see the changes looks as expected, you can restart postfix:

```bash
$ /etc/init.d/postfix restart
```

Then you can tail the logs to see if the mail gets delivered:

```bash
$ tail -f /var/log/maillog
```

## Revert your changes so that postfix sends out directly:

To revert your changes, let's change the config back to what it was:

```bash
$ sed -i 's/relayhost\ =\ \[za-smtp-outbound-1.mimecast.co.za\]/#relayhost\ =/g' /etc/postfix/main.cf
```

To verify your changes:

```bash
$ cat /etc/postfix/main.cf | grep relayhost
#relayhost =
```

As you can see the relayhost is commented out, meaning that the relayhost property will not be active, go ahead and restart the service for the changes to take effect:

```bash
$ /etc/init.d/postfix restart
```

Same as before, look at the logs to confirm mailflow is as expected:

```bash
$ tail -f /var/log/maillog
```



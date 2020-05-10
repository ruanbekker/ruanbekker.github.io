---
layout: post
title: "Server Backups to Google Drive using the Drive CLI tool"
date: 2020-05-08 18:43:35 +0200
comments: true
image: images/ruanbekker-header-photo.png
categories: ["backups", "google-drive", "gdrive"] 
---

This tutorial will demonstrate how I ship my backups to Google Drive using the [drive](https://github.com/odeke-em/drive/releases/) cli utility. 

What I really like about the drive cli tool, is that it's super easy to setup and you can easily script your backups to ship it to google drive.

## What we will be doing

We will setup the drive cli tool, authorize it with your google account, then show how to upload your files to google drive from your terminal and then create a script to automatically upload your data to google drive and then include it in a cronjob.

## Setup Drive CLI Tool

Head over to the [drive releases](https://github.com/odeke-em/drive/releases/) page and get the latest version, at the moment of writing 0.3.9 is the latest. Then we will move it to our path and make it executable:

```
$ wget https://github.com/odeke-em/drive/releases/download/v0.3.9/drive_linux
$ mv drive_linux /usr/bin/gdrive
$ chmod +x /usr/bin/gdrive
```

You should be getting a output when running version as an argument:

```
$ gdrive version
drive version: 0.3.9
```

## Credentials

Move to your home directory and initialize, this will ask you to access the google accounts web page, where you will be authorizing this application to use your google drive account. Upon succesful authorization, you will get a authorization code that we will need to paste in our terminal.

This will then write the credentials file to ~/.gd/credentials.json`. **Always** remember to keep this file safe.

```
$ gdrive init
Visit this URL to get an authorization code
https://accounts.google.com/o/oauth2/auth?access_type=offline&client_id=x&redirect_uri=x&response_type=code&scope=x&state=x
Paste the authorization code: < paste authorization code here >
```

You will now see that the credentials for your application has been saved as seen below:

```
$ cat ~/.gd/credentials.json
{"client_id":"<redacted>","client_secret":"<redacted>","refresh_token":"<redacted>"}
```

## Backup to Google Drive

On Google Drive, I have a backup folder named `Backups` and in my local path `/opt/backups/`, which has the files that I want to backup to google drive:

```
$ ls /opt/backups/
app.backup-2020-05-05.tar.gz  
app.backup-2020-05-06.tar.gz
```

Now let's backup the files to Google Drive, it works as follows `gdrive push -destination (path on google drive) (path on local drive)`:

```
$ gdrive push -destination Backups/demo/app1 /opt/backups/*
Resolving...
+ /Backups/demo/app1/app.backup-2020-05-05.tar.gz
+ /Backups/demo/app1/app.backup-2020-05-06.tar.gz
Addition count 2 src: 26.32MB
Proceed with the changes? [Y/n]:Y
```

As you can see it checks what is on Google Drive and what is on the Local Drive, then determines what needs to be uploaded, and asks you if you want to continue. 

If we run that command again, you will see that it does not upload it again, as the content is already on Google Drive:

```
$ gdrive push -destination Backups/demo/app1 /opt/backups/*
Resolving...
Everything is up-to-date.
```

To test it out, let's create a new file and verify if it only uploads the new file:

```
$ touch file.txt
$ gdrive push -destination Backups/demo/app1 /opt/backups/*
Resolving...
+ /Backups/demo/app1/file.txt
Addition count 1
Proceed with the changes? [Y/n]:y
```

That is all cool and all, but if we want to script this, we don't want to be prompted to continue, we can do this by adding a argument `-quiet`:

```
$ gdrive push -quiet -destination Backups/demo/app1 /opt/*
```

## Scripting our Backup Task

Let's create a script that makes a local archive, then uploads it to Google Drive, I will create the file: `/opt/scripts/backup.sh` with the following content:

```
#!/bin/bash

# make a local archive
tar -zcvf /opt/backups/app1.backup-$(date +%F).tar.gz \
	/home/me/data/dir1 \
	/home/me/data/dir2 \
	/home/me/data/dir3 \
	/home/me/data/dir4 

# backup to gdrive
sleep 1
gdrive push -quiet -destination Backups/Servers/sysadmins.co.za /opt/backups/sysadmins-blog/*

# delete archives older than 14 days from disk
sleep 1
find /opt/backups/ -type f -name "*.tar.gz" -mtime +14 -exec rm {} \;
```

Make the file executable:

```
$ chmod +x /opt/scripts/backup.sh
```

Then, we want to add it as a cronjob so that it runs every night at 23:10 in my case:

Open crotab: `crontab -e` and add the following entry:

```
10 23 * * * /opt/scripts/backup.sh
```

## Thank You

Backups are important, especially when you rely on them, and it was never made. Plan ahead to not be in that situation.

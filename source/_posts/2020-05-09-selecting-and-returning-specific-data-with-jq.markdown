---
layout: post
title: "Selecting and Returning Specific Data with JQ"
date: 2020-05-09 22:23:00 +0200
comments: true
categories: ["jq"] 
---

I was working with curl to get data from a api, and wanted to get a specific url for a specific name within an array. I got it working using jq, and will be demonstrating how I got it working.

The data:

```
$ cat data.json | jq .
{
  "tag_name": "v1.17.5+k3s1",
  "name": "v1.17.5+k3s1",
  "assets": [
    {
      "url": "https://api.github.com/repos/rancher/k3s/releases/assets/20496869",
      "id": 20496869,
      "name": "e2e-passed-amd64-parallel.log",
      "state": "uploaded",
      "size": 1125136,
      "download_count": 3,
      "created_at": "2020-05-07T00:00:45Z",
      "updated_at": "2020-05-07T00:00:46Z",
      "browser_download_url": "https://github.com/rancher/k3s/releases/download/v1.17.5%2Bk3s1/e2e-passed-amd64-parallel.log"
    },
    {
      "url": "https://api.github.com/repos/rancher/k3s/releases/assets/20496281",
      "id": 20496281,
      "name": "k3s",
      "state": "uploaded",
      "size": 52740096,
      "download_count": 887,
      "created_at": "2020-05-06T23:45:02Z",
      "updated_at": "2020-05-06T23:45:03Z",
      "browser_download_url": "https://github.com/rancher/k3s/releases/download/v1.17.5%2Bk3s1/k3s"
    },
    {
      "url": "https://api.github.com/repos/rancher/k3s/releases/assets/20496655",
      "id": 20496655,
      "name": "k3s-armhf",
      "state": "uploaded",
      "size": 48431104,
      "download_count": 95,
      "created_at": "2020-05-06T23:48:05Z",
      "updated_at": "2020-05-06T23:48:06Z",
      "browser_download_url": "https://github.com/rancher/k3s/releases/download/v1.17.5%2Bk3s1/k3s-armhf"
    }
  ],
  "tarball_url": "",
  "zipball_url": "",
  "body": ""
}
```

Getting the json objects inside the array "assets":

```
$ cat data.json | jq '.assets[]'
{
  "url": "https://api.github.com/repos/rancher/k3s/releases/assets/20496869",
  "id": 20496869,
  "name": "e2e-passed-amd64-parallel.log",
  "state": "uploaded",
  "size": 1125136,
  "download_count": 3,
  "created_at": "2020-05-07T00:00:45Z",
  "updated_at": "2020-05-07T00:00:46Z",
  "browser_download_url": "https://github.com/rancher/k3s/releases/download/v1.17.5%2Bk3s1/e2e-passed-amd64-parallel.log"
}
{
  "url": "https://api.github.com/repos/rancher/k3s/releases/assets/20496281",
  "id": 20496281,
  "name": "k3s",
  "state": "uploaded",
  "size": 52740096,
  "download_count": 887,
  "created_at": "2020-05-06T23:45:02Z",
  "updated_at": "2020-05-06T23:45:03Z",
  "browser_download_url": "https://github.com/rancher/k3s/releases/download/v1.17.5%2Bk3s1/k3s"
}
{
  "url": "https://api.github.com/repos/rancher/k3s/releases/assets/20496655",
  "id": 20496655,
  "name": "k3s-armhf",
  "state": "uploaded",
  "size": 48431104,
  "download_count": 95,
  "created_at": "2020-05-06T23:48:05Z",
  "updated_at": "2020-05-06T23:48:06Z",
  "browser_download_url": "https://github.com/rancher/k3s/releases/download/v1.17.5%2Bk3s1/k3s-armhf"
}
```

Data containing "k3s" under the "name" key::

```
$ cat data.json | jq '.assets[] | select(.name | contains("3s"))'
{
  "url": "https://api.github.com/repos/rancher/k3s/releases/assets/20496281",
  "id": 20496281,
  "name": "k3s",
  "state": "uploaded",
  "size": 52740096,
  "download_count": 887,
  "created_at": "2020-05-06T23:45:02Z",
  "updated_at": "2020-05-06T23:45:03Z",
  "browser_download_url": "https://github.com/rancher/k3s/releases/download/v1.17.5%2Bk3s1/k3s"
}
{
  "url": "https://api.github.com/repos/rancher/k3s/releases/assets/20496655",
  "id": 20496655,
  "name": "k3s-armhf",
  "state": "uploaded",
  "size": 48431104,
  "download_count": 95,
  "created_at": "2020-05-06T23:48:05Z",
  "updated_at": "2020-05-06T23:48:06Z",
  "browser_download_url": "https://github.com/rancher/k3s/releases/download/v1.17.5%2Bk3s1/k3s-armhf"
}
```

Data that starts with "k3s" under the "name" key:

```
$ cat data.json | jq '.assets[] | select(.name | startswith("k3s"))'
{
  "url": "https://api.github.com/repos/rancher/k3s/releases/assets/20496281",
  "id": 20496281,
  "name": "k3s",
  "state": "uploaded",
  "size": 52740096,
  "download_count": 887,
  "created_at": "2020-05-06T23:45:02Z",
  "updated_at": "2020-05-06T23:45:03Z",
  "browser_download_url": "https://github.com/rancher/k3s/releases/download/v1.17.5%2Bk3s1/k3s"
}
{
  "url": "https://api.github.com/repos/rancher/k3s/releases/assets/20496655",
  "id": 20496655,
  "name": "k3s-armhf",
  "state": "uploaded",
  "size": 48431104,
  "download_count": 95,
  "created_at": "2020-05-06T23:48:05Z",
  "updated_at": "2020-05-06T23:48:06Z",
  "browser_download_url": "https://github.com/rancher/k3s/releases/download/v1.17.5%2Bk3s1/k3s-armhf"
}
```

Data with the exact name is "k3s":

```
$ cat data.json | jq '.assets[] | select(.name == "k3s")'
{
  "url": "https://api.github.com/repos/rancher/k3s/releases/assets/20496281",
  "id": 20496281,
  "name": "k3s",
  "state": "uploaded",
  "size": 52740096,
  "download_count": 887,
  "created_at": "2020-05-06T23:45:02Z",
  "updated_at": "2020-05-06T23:45:03Z",
  "browser_download_url": "https://github.com/rancher/k3s/releases/download/v1.17.5%2Bk3s1/k3s"
}
```

Getting only the "browser_download_url" value from the match:

```
$ cat data.json | jq '.assets[] | select(.name == "k3s") | .browser_download_url'
"https://github.com/rancher/k3s/releases/download/v1.17.5%2Bk3s1/k3s"
```

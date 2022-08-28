---
layout: post
title: "Deploy Scaleway Servers via the API in Python"
date: 2019-03-20 19:04:00 -0400
comments: true
categories ["scaleway", "python", "api"]: 
---

![](https://user-images.githubusercontent.com/567298/54725016-2e81e680-4b76-11e9-9e69-ffe4cd470bb7.jpg)

A quick post on how to deploy Scaleway Servers via their API using Python.

## API Documentation

Scaleway has great [API Documentation](https://developer.scaleway.com/#servers-servers) available, so for deeper info have a look at the link provided.

## Python

Our python script has a function `create_server` that expects a server name, server size, the tag and the linux distribution:

```python
import requests
import json
import time

SCW_API_KEY = "<your-api-key>"
SCW_OGRA_ID = "<your-organization-id>"
SCW_REGION = "ams1"
SCW_COMPUTE_API_URL = "https://cp-{region}.scaleway.com/{resource}".format(region=SCW_REGION, resource='servers')
SCW_VOLUME_API_URL = "https://cp-{region}.scaleway.com/{resource}".format(region=SCW_REGION, resource='volumes')
SCW_HEADERS = {"X-Auth-Token": SCW_API_KEY, "Content-Type": "application/json"}
SCW_IMAGES = {"ubuntu/18": "6a601340-19c1-4ca7-9c1c-0704bcc9f5fe", "debian/stretch": "710ff1fa-0d16-4f8f-93ac-0647c44fa21d"}

def get_status(server_id):
  response = requests.get(SCW_COMPUTE_API_URL + "/" + server_id, headers=SCW_HEADERS)
  state = response.json()
  return state

def create_server(instance_name, instance_type, instance_tag, os_distro):
  count = 0
  compute_payload = {
      "name": instance_name,
      "image": SCW_IMAGES[os_distro],
      "commercial_type": instance_type,
      "tags": [instance_tag],
      "organization": SCW_OGRA_ID
  }

  print("creating server")
  r_create = requests.post(SCW_COMPUTE_API_URL, json=compute_payload, headers=SCW_HEADERS)
  server_id = r_create.json()["server"]["id"]
  action_payload = {"action": "poweron"}
  r_start = requests.post(SCW_COMPUTE_API_URL + "/" + server_id + "/action", json=action_payload, headers=SCW_HEADERS)
  r_describe = requests.get(SCW_COMPUTE_API_URL + "/" + server_id, headers=SCW_HEADERS)

  server_state = get_status(server_id)['server']['state']
  while server_state != "running":

    if count > 90:
      r_delete = requests.delete(SCW_COMPUTE_API_URL + "/" + server_id, json=action_payload, headers=SCW_HEADERS)
      return {"message": "error", "description": "task timed out while waiting for server to boot"}

    count += 1
    print("waiting for server to become ready")
    time.sleep(10)
    server_state = get_status(server_id)['server']['state']

  time.sleep(5)
  resp = get_status(server_id)["server"]
  output = {
      "id": resp["id"],
      "hostname": resp["hostname"],
      "instance_type": resp["commercial_type"],
      "public_ip": resp["public_ip"]["address"],
      "private_ip": resp["private_ip"],
      "status": resp["state"]
  }
  return output


response = create_server("swarm-manager", "START1-M", "swarm", "ubuntu/18")
print(response)
```

Deploying a server with the hostname: swarm-manager, instance-size: START1-M, tag: swarm and os distribution: ubuntu/18:

```bash
$ python scw.py
creating server
waiting for server to become ready
waiting for server to become ready
waiting for server to become ready
{'status': u'running', 'hostname': u'swarm-manager', 'public_ip': u'51.x.x.x', 'instance_type': u'START1-M', 'private_ip': u'10.x.x.x', 'id': u'xx-xx-xx-xx-xx'
```

For more info on [Scaleway](https://www.scaleway.com) please do check them out: https://www.scaleway.com}

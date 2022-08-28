---
layout: post
title: "Setup a SSH Tunnel with the sshtunnel module in Python"
date: 2018-04-23 11:56:46 -0400
comments: true
categories: ["python", "ssh", "tunnel"] 
---

Sometimes we need to restrict access to a port, where a port should listen on localhost, but you want to access that port from a remote source. One secure way of doing that, is to establish a SSH Tunnel to the remote side, and forward to port via the SSH Tunnel.

Today we will setup a Flask Web Service on our Remote Server (Side B) which will be listening on `127.0.0.1:5000` and setup the SSH Tunnel with the `sshtunnel` module in Python from our client side (Side A). Then we will make a GET request on our client side to the port that we are forwarding via the tunnel to our remote side.

<a href="https://github.com/ruanbekker/cheatsheets" target="_blank"><img alt="ruanbekker-cheatsheets" src="https://user-images.githubusercontent.com/567298/169162832-ef3019de-bc49-4d6c-b2a6-8ac17c457d24.png"></a>

## Remote Side:

Our Demo Python Flask Application:

```python
from flask import Flask

app = Flask(__name__)

@app.route('/')
def index():
    return 'OK'

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)
```

Run the server:

```bash
$ python app.py
Listening on 127.0.0.1:5000
```

## Client Side:

From our client side we first need to install sshtunnel via pip:

```bash
$ pip install sshtunnel requests --user
```

Our code for our client that will establish the tunnel and do the GET request:

```python
from sshtunnel import SSHTunnelForwarder
import requests

remote_user = 'ubuntu'
remote_host = '192.168.10.10'
remote_port = 22
local_host = '127.0.0.1'
local_port = 5000

server = SSHTunnelForwarder(
   (remote_host, remote_port),
   ssh_username=remote_user,
   ssh_private_key='/home/ubuntu/.ssh/mykey.pem',
   remote_bind_address=(local_host, local_port),
   local_bind_address=(local_host, local_port),
   )

server.start()

headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.0; WOW64; rv:24.0) Gecko/20100101 Firefox/24.0'}
r = requests.get('http://127.0.0.1:5000', headers=headers).content
print(r)
server.stop()
```

Running our app:

```bash
$ python ssh_tunnel.py
OK
```

So we have sucessfully established our ssh tunnel to our remote side, and able to access the network restricted port via the tunnel.

## Resources:

- [SSHTunnel](https://pypi.org/project/sshtunnel/)

---
layout: post
title: "Populate Environment Variables from Docker Secrets with a Flask Demo App"
date: 2018-03-12 18:16:42 -0400
comments: true
categories: ["docker", "swarm", "secrets", "environment-variables"]
---

![](http://obj-cache.cloud.ruanbekker.com/docker-logo.png)

## Docker Secrets Exporter to Environment Variable

In this post we will create a basic Python Flask WebApp, but we will read our Flask Host, and Flask Port from Environment Variables, which will be populated from Docker Secrets, which we will read in from a python script.

## Our Directory Setup:

This can be retrieved from [github.com/ruanbekker/docker-swarm-apps/tool-secrets-env-exporter](https://github.com/ruanbekker/docker-swarm-apps/tree/master/tools-secrets-env-exporter), but I will place the code in here as well.

```bash Dockerfile:
FROM alpine:edge
RUN apk add --no-cache python2 py2-pip && pip install flask
ADD exporter.py /exporter.py
ADD boot.sh /boot.sh
ADD app.py /app.py
CMD ["/bin/sh", "/boot.sh"]
```

```python exporter.py
import os
from glob import glob

for var in glob('/run/secrets/*'):
    k=var.split('/')[-1]
    v=open(var).read().rstrip('\n')
    os.environ[k] = v
    print("export {key}={value}".format(key=k,value=v))
```

```python app.py
import os
from flask import Flask

flask_host = str(os.environ['flask_host'])
flask_port = int(os.environ['flask_port'])

app = Flask(__name__)

@app.route('/')
def index():
    return 'ok\n'

if __name__ == '__main__':
    app.run(host=flask_host, port=flask_port)
```

```bash boot.sh
#!/bin/sh
set -e
eval $(python /exporter.py)
python /app.py
```

## Flow Information:

The exporter script checks all the secrets that is mounted to the container, then formats the secrets to a key/value pair, which then exports the environment variables to the current shell, which thereafter gets read by the flask application.

## Usage:

Create Docker Secrets:

```
$ echo 5001 | docker secret create flask_port -
$ echo 0.0.0.0 | docker secret create flask_host -
```

Build and Push the Image:

```
$ docker build -t registry.gitlab.com/<user>/<repo>/<image>:<tag>
$ docker push registry.gitlab.com/<user>/<repo>/<image>:<tag>
```

Create the Service, and specify the secrets that we created earlier:

```
$ docker service create --name webapp \
--secret source=flask_host,target=flask_host \
--secret source=flask_port,target=flask_port \
registry.gitlab.com/<user>/<repo>/<image>:<tag>
```

Exec into the container, list to see where the secrets got populated:

```
$ ls /run/secrets/
flask_host  flask_port
```

Do a netstat, to see that the value from the created secret is listening:

```
$ netstat -tulpn
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 0.0.0.0:5001            0.0.0.0:*               LISTEN      7/python
```

Do a GET request on the Flask Application:

```
$ curl http://0.0.0.0:5001/
ok
```


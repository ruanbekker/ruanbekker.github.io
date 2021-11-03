---
layout: post
title: "Setup Traefik Version 2 on Docker"
date: 2021-11-03 01:20:27 -0400
comments: true
categories: ["docker", "traefik", "letsencrypt"] 
---

In this tutorial we will be setting up [Traefik ](https://traefik.io) v2 as our reverse proxy with port 80 and 443 enabled, and then hook up a example application behind the application load balancer, and route incoiming requests via host headers.

## What is Traefik

Traefik is a modern HTTP reverse proxy and load balancer that makes deploying microservices super easy by making use of docker labels to route your traffic based on host headers, path prefixes etc. Please check out [their website](https://doc.traefik.io/traefik/) to find out more about them.

## Use Case

In our example we want to route traefik from `http://app.selfhosted.co.za` to hit our proxy on port 80, then we want traefik to redirect port 80 to the 443 port configured on the proxy which is configured with letsencrypt and reverse proxy the connection to our application.

The application is being configured via docker labels, which we will get into later.

## Our Environment

I will be using the domain `selfhosted.co.za`, so if you are following along, you can just replace this domain with yours.

For this demonstration I have spun up a VM at [Civo](https://civo.com) as you can see below:

![image](https://user-images.githubusercontent.com/567298/125192278-5023a200-e247-11eb-97c6-cebd65f22f07.png)

From the provided public IP address, we will be creating a DNS A record for our domain, and then create a wildcard entry to CNAME to our initial dns name:

![image](https://user-images.githubusercontent.com/567298/125192297-6b8ead00-e247-11eb-9c01-740557838a12.png)

You might not want to point all the subdomains to that entry, but to simplify things, every application that needs to be routed via traefik, I can manage from a traefik config level, since my dns is already pointing to the public ip where traefik is running on. 

So if I spin up a new container, lets say `bitwarden`, I can just set `bitwarden.selfhosted.co.za` in the labels of that container and due to the dns already pointing to traefik, traefik will route the connection to the correct container.

## Pre-Requisites

In order to follow along you will need [docker](https://docs.docker.com/get-docker/) and [docker-compose](https://docs.docker.com/compose/install/) to be installed, and can be validated using:

```
docker -v
Docker version 20.10.7, build f0df350

docker-compose -v
docker-compose version 1.28.6, build 5db8d86f
```

## Traefik on Docker

We will have one `docker-compose.yml` file which has the proxy and the example application. Be sure to change the following to suite your environment:
- `traefik.http.routers.api.rule=Host()'`
- `--certificatesResolvers.letsencrypt.acme.email=youremail@yourdomain.net`

The compose:

```yaml
---
version: '3.8'

services:
  traefik:
    image: traefik:2.4
    container_name: traefik
    restart: unless-stopped
    volumes:
      - ./traefik/acme.json:/acme.json
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - docknet
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.api.rule=Host(`traefik.selfhosted.co.za`)'
      - 'traefik.http.routers.api.entrypoints=https'
      - 'traefik.http.routers.api.service=api@internal'
      - 'traefik.http.routers.api.tls=true'
      - 'traefik.http.routers.api.tls.certresolver=letsencrypt'
    ports:
      - 80:80
      - 443:443
    command:
      - '--api'
      - '--providers.docker=true'
      - '--providers.docker.exposedByDefault=false'
      - '--entrypoints.http=true'
      - '--entrypoints.http.address=:80'
      - '--entrypoints.http.http.redirections.entrypoint.to=https'
      - '--entrypoints.http.http.redirections.entrypoint.scheme=https'
      - '--entrypoints.https=true'
      - '--entrypoints.https.address=:443'
      - '--certificatesResolvers.letsencrypt.acme.email=youremail@yourdomain.net'
      - '--certificatesResolvers.letsencrypt.acme.storage=acme.json'
      - '--certificatesResolvers.letsencrypt.acme.httpChallenge.entryPoint=http'
      - '--log=true'
      - '--log.level=INFO'
    logging:
      driver: "json-file"
      options:
        max-size: "1m"

  webapp:
    image: traefik/whoami
    container_name: webapp
    restart: unless-stopped
    networks:
      - docknet
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.webapp.rule=Host(`app.selfhosted.co.za`)'
      - 'traefik.http.routers.webapp.entrypoints=https'
      - 'traefik.http.routers.webapp.tls=true'
      - 'traefik.http.routers.webapp.tls.certresolver=letsencrypt'
      - 'traefik.http.routers.webapp.service=webappservice'
      - 'traefik.http.services.webappservice.loadbalancer.server.port=80'
    logging:
      driver: "json-file"
      options:
        max-size: "1m"

networks:
  docknet:
    name: docknet
```

Prepare the `./traefik/acme.json` file:

```
mkdir traefik
touch traefik/acme.json
chmod 600 traefik/acme.json
```

As you can see in order to wire a application onto the proxy we need the following labels:

```yaml
      - 'traefik.enable=true'
      - 'traefik.http.routers.webapp.rule=Host(`app.selfhosted.co.za`)'
      - 'traefik.http.routers.webapp.entrypoints=https'
      - 'traefik.http.routers.webapp.tls=true'
      - 'traefik.http.routers.webapp.tls.certresolver=letsencrypt'
      - 'traefik.http.routers.webapp.service=webappservice'
      - 'traefik.http.services.webappservice.loadbalancer.server.port=80'
```

Now boot our stack using docker-compose:

```bash
docker-compose up -d
```

You can follow the logs to ensure everything works as expected:

```
docker-compose logs -f
Attaching to webapp, traefik
traefik    | time="2021-07-11T11:02:22Z" level=info msg="Configuration loaded from flags."
traefik    | time="2021-07-11T11:02:22Z" level=info msg="Starting provider aggregator.ProviderAggregator {}"
traefik    | time="2021-07-11T11:02:22Z" level=info msg="Starting provider *traefik.Provider {}"
traefik    | time="2021-07-11T11:02:22Z" level=info msg="Starting provider *docker.Provider {\"watch\":true,\"endpoint\":\"unix:///var/run/docker.so                                              ck\",\"defaultRule\":\"Host(`{{ normalize .Name }}`)\",\"swarmModeRefreshSeconds\":\"15s\"}"
traefik    | time="2021-07-11T11:02:22Z" level=info msg="Starting provider *acme.ChallengeTLSALPN {\"Timeout\":4000000000}"
traefik    | time="2021-07-11T11:02:22Z" level=info msg="Starting provider *acme.Provider {\"email\":\"youremail@domain.com\",\"caServer\":\"https://                                              acme-v02.api.letsencrypt.org/directory\",\"storage\":\"acme.json\",\"keyType\":\"RSA4096\",\"httpChallenge\":{\"entryPoint\":\"http\"},\"ResolverNam                                              e\":\"letsencrypt\",\"store\":{},\"TLSChallengeProvider\":{\"Timeout\":4000000000},\"HTTPChallengeProvider\":{}}"
traefik    | time="2021-07-11T11:02:22Z" level=info msg="Testing certificate renew..." providerName=letsencrypt.acme
traefik    | time="2021-07-11T11:02:24Z" level=info msg=Register... providerName=letsencrypt.acme
webapp     | Starting up on port 80
```

The certificate process might take anything from 5-30s in my experience.

## Test the Application

Now that our `webapp` container is running, make a http request using curl against the configured host rule, which is `app.selfhosted.co.za` on `http` so that we can validate if traefik is doing a redirect to `https`:

```bash
curl -IL http://app.selfhosted.co.za:80

HTTP/1.1 308 Permanent Redirect
Location: https://app.selfhosted.co.za/
Date: Sun, 11 Jul 2021 11:05:47 GMT
Content-Length: 18
Content-Type: text/plain; charset=utf-8

HTTP/2 200
content-type: text/plain; charset=utf-8
date: Sun, 11 Jul 2021 11:05:47 GMT
content-length: 343
```

If we access our `webapp` service in our web browser, we will see the following:

![image](https://user-images.githubusercontent.com/567298/125192768-c1fceb00-e249-11eb-8b67-7347b4d16a8f.png)

We can also validate that the certificate is valid:

![image](https://user-images.githubusercontent.com/567298/125196546-a9490100-e25a-11eb-8e94-0d7af307d2fb.png)

We can also access the traefik dashboard using the configured domain, in this case `traefik.selfhosted.co.za`, and you should see the pretty traefik dashboard:

![image](https://user-images.githubusercontent.com/567298/125196448-4bb4b480-e25a-11eb-906b-a221d1415f38.png)

## Future Posts

In future posts I will be using this post as the base setup on getting traefik up and running, and future posts that uses traefik will be tagged under [#traefik](https://containers.fan/tags/traefik/).

## Thank You

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.

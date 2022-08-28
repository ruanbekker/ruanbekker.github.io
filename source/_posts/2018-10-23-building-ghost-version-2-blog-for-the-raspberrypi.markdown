---
layout: post
title: "Building Ghost Version 2 Blog for the RaspberryPi"
date: 2018-10-23 17:37:49 -0400
comments: true
categories: ["raspberrypi", "docker", "swarm", "ghost", "traefik", "blog"]
---

![](https://objects.ruanbekker.com/assets/images/ghost-blog-main.png)

In this post we will setup Ghost 2.0.3 for the Raspberry Pi on Docker Swarm

## Dockerfile

Our dockerfile:

```
FROM rbekker87/armhf-node:8.11

RUN apk add --no-cache 'su-exec>=0.2' && apk --update add bash gcc g++ make python && npm install sqlite3 --build-from-source

ENV NODE_ENV production
ENV GHOST_CLI_VERSION 1.9.1
ENV GHOST_VERSION 2.0.3
ENV GHOST_INSTALL /var/lib/ghost
ENV GHOST_CONTENT /var/lib/ghost/content

RUN npm install -g "ghost-cli@$GHOST_CLI_VERSION"

RUN set -ex; \
        mkdir -p "$GHOST_INSTALL" \
        && adduser -s /bin/sh -D node \
        && chown node:node "$GHOST_INSTALL" \
        && su-exec node ghost install "$GHOST_VERSION" --db sqlite3 --no-prompt --no-stack --no-setup --dir "$GHOST_INSTALL" \
        && cd "$GHOST_INSTALL" \
        && su-exec node ghost config --ip 0.0.0.0 --port 2368 --no-prompt --db sqlite3 --url http://localhost:2368 --dbpath "$GHOST_CONTENT/data/ghost.db" \
        && su-exec node ghost config paths.contentPath "$GHOST_CONTENT" \
        && su-exec node ln -s config.production.json "$GHOST_INSTALL/config.development.json" \
        && readlink -f "$GHOST_INSTALL/config.development.json" \
        && mv "$GHOST_CONTENT" "$GHOST_INSTALL/content.orig" \
        && mkdir -p "$GHOST_CONTENT" && chown node:node "$GHOST_CONTENT" \
        && "$GHOST_INSTALL/current/node_modules/knex-migrator/bin/knex-migrator" --version

ENV PATH $PATH:$GHOST_INSTALL/current/node_modules/knex-migrator/bin

WORKDIR $GHOST_INSTALL

COPY docker-entrypoint.sh /usr/local/bin
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]

CMD ["node", "current/index.js"]
```

## Our Boot Script

Our entrypoint script `docker-entrypoint.sh`:

```
#!/bin/bash
set -e

if [[ "$*" == node*current/index.js* ]] && [ "$(id -u)" = '0' ];
  then
    chown -R node "$GHOST_CONTENT"
    exec su-exec node "$BASH_SOURCE" "$@"
fi

if [[ "$*" == node*current/index.js* ]];
  then
    baseDir="$GHOST_INSTALL/content.orig"
    for src in "$baseDir"/*/ "$baseDir"/themes/*;
      do
        src="${src%/}"
        target="$GHOST_CONTENT/${src#$baseDir/}"
        mkdir -p "$(dirname "$target")"
        if [ ! -e "$target" ];
          then
            tar -cC "$(dirname "$src")" "$(basename "$src")" | tar -xC "$(dirname "$target")"
        fi
      done

    knex-migrator-migrate --init --mgpath "$GHOST_INSTALL/current"
fi

prod() {
cat > /var/lib/ghost/config.development.json << EOF
{
  "url": "http://${SERVER_URL:-localhost}:${SERVER_PORT:-2368}",
  "server": {
    "port": ${SERVER_PORT:-2368},
    "host": "0.0.0.0"
  },
  "database": {
    "client": "sqlite3",
    "connection": {
      "filename": "/var/lib/ghost/content/data/ghost.db"
    }
  },
  "mail": {
    "transport": "SMTP",
    "from": "${FROM_NAME:-MyBlog} <${FROM_EMAIL:-ghost-blog@localhost}>",
    "options": {
      "service": "Mailgun",
      "host": "${SMTP_HOST:-localhost}",
      "port": ${SMTP_PORT:-25},
      "auth": {
        "user": "${SMTP_AUTH_USERNAME:-root}",
        "pass": "${SMTP_AUTH_PASSWORD:-password}"
      }
    }
  },
  "logging": {
    "transports": [
      "file",
      "stdout"
    ]
  },
  "process": "systemd",
  "paths": {
    "contentPath": "/var/lib/ghost/content"
  }
}
EOF
}

dev() {
cat > /var/lib/ghost/config.development.json << EOF
{
  "url": "http://${SERVER_URL:-localhost}:${SERVER_PORT:-2368}",
  "server": {
    "port": ${SERVER_PORT:-2368},
    "host": "0.0.0.0"
  },
  "database": {
    "client": "sqlite3",
    "connection": {
      "filename": "/var/lib/ghost/content/data/ghost.db"
    }
  },
  "mail": {
    "transport": "Direct"
  },
  "logging": {
    "transports": [
      "file",
      "stdout"
    ]
  },
  "process": "systemd",
  "paths": {
    "contentPath": "/var/lib/ghost/content"
  }
}
EOF
}

test(){
cat > /var/lib/ghost/config.development.json << EOF
{
  "url": "http://localhost:2368",
  "server": {
    "port": 2368,
    "host": "0.0.0.0"
  },
  "database": {
    "client": "sqlite3",
    "connection": {
      "filename": "/var/lib/ghost/content/data/ghost.db"
    }
  },
  "mail": {
    "transport": "Direct"
  },
  "logging": {
    "transports": [
      "file",
      "stdout"
    ]
  },
  "process": "systemd",
  "paths": {
    "contentPath": "/var/lib/ghost/content"
  }
}
EOF
}

if  [ "${ENV_TYPE}" = "PROD" ]
  then prod

elif [ "${ENV_TYPE}" = "DEV" ]
  then dev
  else test

fi

exec "$@"
```

The entrypoint script takes a couple of environment variables, as you can see if they are not defined, defaults will be inherited. 

Configurable Environment Variables:

```
      - ENV_TYPE=PROD
      - SERVER_PORT=2368
      - SERVER_URL=myblog.pistack.co.za
      - FROM_NAME=MyName
      - SMTP_HOST=mail.mydomain.co.za
      - SMTP_PORT=587
      - SMTP_AUTH_USERNAME=me@mydomain.co.za
      - SMTP_AUTH_PASSWORD=secret
```

## Building our Ghost Image

I have a public image available if you dont want to build/push, but for building:

```
$ docker build -t your-name/repo:tag
```

## Deploy Ghost with Traefik

Our `ghost-compose.yml` with traefik will look like the following, note that I mounted the source path to the container's path, the source path is running on a replicated glusterfs volume, which can be setup following [this post](https://blog.ruanbekker.com/blog/2018/10/23/setting-up-a-docker-swarm-cluster-on-3-raspberrypi-nodes/)

Also for this demonstration I was using the domain pistack.co.za, where you need to utilize the domain of your choice.

```
version: "3.4"

services:
  ghost:
    image: rbekker87/armhf-ghost:2.0.3
    networks:
      - appnet
    volumes:
      - type: bind
        source: /mnt/volumes/myblog/content/data
        target: /var/www/ghost/content/data
    environment:
      - ENV_TYPE=PROD
      - SERVER_PORT=2368
      - SERVER_URL=myblog.pistack.co.za
      - FROM_NAME=MyName
      - SMTP_HOST=mail.mydomain.co.za
      - SMTP_PORT=587
      - SMTP_AUTH_USERNAME=me@mydomain.co.za
      - SMTP_AUTH_PASSWORD=secret
    deploy:
      replicas: 1
      labels:
        - "traefik.enable=true"
        - "traefik.backend=ghost"
        - "traefik.backend.loadbalancer.swarm=true"
        - "traefik.docker.network=appnet"
        - "traefik.port=2368"
        - "traefik.frontend.passHostHeader=true"
        - "traefik.frontend.rule=Host:myblog.pistack.co.za"
      replicas: 3
      update_config:
        parallelism: 2
        delay: 10s
      restart_policy:
        condition: on-failure
      placement:
        constraints: [node.role == worker]

networks:
  appnet:
    external: true
```

Deploy the stack:

```
$ docker stack deploy -c ghost-compose.yml web
```

Once the service is up, you will be able to reach your blog on the provided `traefik.frontend.rule`. If you don't have traefik running, you can follow [this post](https://blog.ruanbekker.com/blog/2018/10/23/build-a-traefik-proxy-image-for-your-raspberry-pi-on-docker-swarm/) to get traefik up and running.

## Resources:

- https://hub.docker.com/r/rbekker87/armhf-ghost/
- https://github.com/ruanbekker/ghost-armhf 

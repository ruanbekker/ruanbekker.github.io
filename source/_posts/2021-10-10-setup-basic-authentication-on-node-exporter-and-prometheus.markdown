---
layout: post
title: "Setup TLS and Basic Authentication on Node Exporter for Prometheus"
date: 2021-10-10 16:50:17 -0400
comments: true
categories: ["monitoring", "prometheus", "node-exporter"]
---

I had a public VPS server that I wanted to scrape node-exporter metrics from, but my Prometheus instance was behind a Dynamic IP address, so to allow only my prometheus instance to scrape my Node Exporter instance, was a bit difficult, since the IP keep changing and I had to update my iptables firewall rules.

In this tutorial I will show you how to setup TLS and Basic Authentication on Node Exporter, and how to configure prometheus to pass the auhtentication to successfully scrape the node exporter metrics endpoint.

## Install Node Exporter

On the node-exporter host, set the environment variables for the version, user and directory path where node exporter will be installed::

```bash
$ NODE_EXPORTER_VERSION="1.1.2"
$ NODE_EXPORTER_USER="node_exporter"
$ BIN_DIRECTORY="/usr/local/bin"
```

Download and place the node-exporter binary in place:

```bash
$ wget https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz
$ tar -xf node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz
$ cp node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64/node_exporter ${BIN_DIRECTORY}/
$ chown ${NODE_EXPORTER_USER}:${NODE_EXPORTER_USER} ${BIN_DIRECTORY}/node_exporter
$ rm -rf node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64*
$ mkdir /etc/node-exporter
```

## Configuration

Create a self-signed cert for node-exporter:

```bash
$ openssl req -new -newkey rsa:2048 -days 365 -nodes -x509 -keyout node_exporter.key -out node_exporter.crt -subj "/C=ZA/ST=CT/L=SA/O=VPN/CN=localhost" -addext "subjectAltName = DNS:localhost"
```

Move the certs into the directory we created:

```bash
$ mv node_exporter.* /etc/node-exporter/
```

Install htpasswd so that we can generate a password hash with bcrypt, which will prompt you for a password that we are setting for the prometheus user::

```bash
$ apt install apache2-utils
$ htpasswd -nBC 10 "" | tr -d ':\n'; echo
```

Now populate the config for node-exporter:

```bash
$ cat /etc/node-exporter/config.yml
tls_server_config:
  cert_file: node_exporter.crt
  key_file: node_exporter.key
basic_auth_users:
  prometheus: <the-output-value-of-htpasswd>
```

Change the ownership of the node exporter directory:

```bash
$ chown -R ${NODE_EXPORTER_USER}:${NODE_EXPORTER_USER} /etc/node-exporter
```

Then create the systemd unit file:

```
$ cat > /etc/systemd/system/node_exporter.service << EOF
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target
StartLimitIntervalSec=500
StartLimitBurst=5
[Service]
User=${NODE_EXPORTER_USER}
Group=${NODE_EXPORTER_USER}
Type=simple
Restart=on-failure
RestartSec=5s
ExecStart=${BIN_DIRECTORY}/node_exporter --web.config=/etc/node-exporter/config.yml
[Install]
WantedBy=multi-user.target
EOF
```

Reload systemd and start node-exporter

```bash
$ systemctl daemon-reload
$ systemctl enable node_exporter
$ systemctl restart node_exporter
```

## Prometheus Config

Copy the `/etc/node-exporter/node_exporter.crt` from the node-exporter node to prometheus-node, then in the `/etc/prometheus/prometheus.yml` config:

```yaml
scrape_configs:
  - job_name: 'node-exporter-tls'
    scheme: https
    basic_auth:
      username: prometheus
      password: <the-plain-text-password>
    tls_config:
      ca_file: node_exporter.crt
      insecure_skip_verify: true
    static_configs:
    - targets: ['node-exporter-ip:9100']
      labels:
        instance: friendly-instance-name
```

After you restart prometheus, you should see the metrics in prometheus' tsdb of the node exporter target that we are scraping.

## Thank You

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.


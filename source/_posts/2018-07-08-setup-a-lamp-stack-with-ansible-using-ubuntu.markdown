---
layout: post
title: "Setup a LAMP Stack with Ansible using Ubuntu"
date: 2018-07-08 17:15:15 -0400
comments: true
categories: ["ansible", "devops", "ansible-tutorial", "ubuntu"]
---

This is Part-2 of our [Ansible-Tutorial](http://blog.ruanbekker.com/blog/categories/ansible-tutorial) and in this post we will cover how to setup a LAMP Stack on Ubuntu using Ansible. We will only have one host in our inventory, but this can be scaled easily by increasing the number of nodes in your invetory configuration file.

## Our Playbook:

Our `lamp.yml` playbook:

```yml lamp.yml
---
# Setup LAMP Stack
- hosts: newhost
  tasks:
    - name: install lamp stack
      sudo: yes
      apt: name={{ item }} state=present update_cache=yes
      with_items:
        - apache2
        - mysql-server
        - php7.0
        - php7.0-mysql

    - name: start services
      service: name={{ item }} state=started enabled=yes
      sudo: yes
      with_items:
        - apache2
        - mysql

    - name: deploy index.html
      sudo: yes
      copy:
        src: /tmp/index.html
        dest: /var/www/html/index.html
```

Our `index.html` that will be deployed on our servers:

```bash /tmp/index.html
<!DOCTYPE html>
<html>
  <body>
    <h1>Deployed with Ansible</h1>
  </body>
</html>
```

## Deploy your LAMP Stack:

```bash
$ ansible-playbook -i inventory.ini -u root lamp.yml

PLAY [newhost] ***************************************************************************************************************************

TASK [Gathering Facts] *******************************************************************************************************************
ok: [web-1]

TASK [install lamp stack] ****************************************************************************************************************
ok: [web-1] => (item=[u'apache2', u'mysql-server', u'php7.0', u'php7.0-mysql'])

TASK [start services] ********************************************************************************************************************
ok: [web-1] => (item=apache2)
ok: [web-1] => (item=mysql)

TASK [deploy index.html] *****************************************************************************************************************
changed: [web-1]

PLAY RECAP *******************************************************************************************************************************
web-1                      : ok=4    changed=1    unreachable=0    failed=0
```

Test our web server:

```bash
$ curl http://10.0.0.4

<!DOCTYPE html>
<html>
<body>
<h1>Deployed with Ansible</h1>
</body>
</html>
```

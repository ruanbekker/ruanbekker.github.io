---
layout: post
title: "Customize Ubuntu 16 Desktop with Arc Dark Theme"
date: 2017-10-11 15:56:10 -0400
comments: true
categories: ["desktop", "linux", "ubuntu", "customization"] 
---

![](https://i.snag.gy/g1ryLn.jpg)

So I was running ApricityOS for quite some time, which is a Arch Distibution. But a couple of hours before PyConZa I was trying to do a update and found that their repositories were reporting 404 errors, and turns out they have stopped their project :( . I quite liked ApricityOS, as it's what you will expect when installing Arch with the basic applications and the numix icon/theme pack.

So I decided to use Ubuntu for a change.

## Customizations:

For the customization, I am Ubuntu 16:

- [Ubuntu 16.04 (Operating System)](https://www.ubuntu.com/download/desktop)

Formy theme I am using Arc Dark:

- [Arch Teme](https://github.com/horst3180/arc-theme) - [autoconf dependency required](https://askubuntu.com/questions/265471/autoreconf-not-found-error-during-making-qemu-1-4-0/490839)

![](https://i.snag.gy/u5fP4w.jpg)

Moka Icon pack for my Icons:

- [Moka Icon Themes](https://snwh.org/moka/download)

![](https://i.snag.gy/3JPi9W.jpg?nocache=1507753731895)

Terminator for my terminal of choice:

- [Terminator Terminal](http://www.linuxandubuntu.com/home/10-best-linux-terminals-for-ubuntu-and-fedora)

![](https://i.snag.gy/xqgXMc.jpg)

And my config:

```bash ~/.config/terminator/config 
[global_config]
  enabled_plugins = LaunchpadCodeURLHandler, APTURLHandler, LaunchpadBugURLHandler
  sticky = True
  window_state = maximise
[keybindings]
[layouts]
  [[default]]
    [[[child1]]]
      parent = window0
      profile = default
      type = Terminal
    [[[window0]]]
      parent = ""
      type = Window
  [[multi]]
    foreground_color = "#ffffff"
    palette = "#62b9d6:#cc0000:#4e9a06:#c4a000:#3465a4:#75507b:#06989a:#d3d7cf:#77c529:#ef2929:#8ae234:#fce94f:#729fcf:#ad7fa8:#34e2e2:#eeeeec"
    [[[child0]]]
      order = 0
      parent = ""
      position = 0:25
      size = 1366, 768
      type = Window
    [[[child1]]]
      order = 0
      parent = child0
      position = 632
      type = HPaned
    [[[child2]]]
      order = 0
      parent = child1
      position = 354
      type = VPaned
    [[[child5]]]
      order = 1
      parent = child1
      position = 354
      type = VPaned
    [[[terminal3]]]
      command = top; bash
      order = 0
      parent = child2
      profile = default
      type = Terminal
    [[[terminal4]]]
      command = uptime; bash
      order = 1
      parent = child2
      profile = default
      type = Terminal
    [[[terminal6]]]
      command = cd ~/workspace; bash
      order = 0
      parent = child5
      profile = default
      type = Terminal
    [[[terminal7]]]
      command = cd ~/workspace; bash
      order = 1
      parent = child5
      profile = default
      type = Terminal
  [[simples]]
    [[[child0]]]
      order = 0
      parent = ""
      position = 0:25
      size = 715, 694
      type = Window
    [[[child1]]]
      order = 0
      parent = child0
      position = 348
      type = VPaned
    [[[terminal2]]]
      command = cd ~/workspace; bash
      order = 0
      parent = child1
      profile = default
      type = Terminal
    [[[terminal3]]]
      command = cd ~/workspace; bash
      order = 1
      parent = child1
      profile = default
      type = Terminal
[plugins]
[profiles]
  [[default]]
    background_image = None
    icon_bell = False
    scrollback_infinite = True
```

And to force color prompts:

```bash ~/.bashrc
force_color_prompt=yes
```

And my Wallpaper:

- [Lamborghini Wallpaper](https://www.pixelstalk.net/wp-content/uploads/2016/03/Black-lamborghini-wallpaper-HD.jpg)

## Other Preferred Applications:

- [Docker](https://www.docker.com/docker-ubuntu)
- [LXD](https://linuxcontainers.org/lxd/getting-started-cli/)
- [Cloud Storage: Dropbox](https://www.dropbox.com/)
- [Text Editor: Sublime Text](https://www.sublimetext.com/)
- [Note Taking: Boostnote](https://boostnote.io/)
- [Mail Client: Nylas](https://www.nylas.com/nylas-mail/) and [Geary](https://wiki.gnome.org/Apps/Geary)
- [Python IDE: PyCharm](https://www.jetbrains.com/pycharm/) (however, I prefer to use VIM :D )
- [Java IDE: Netbeans](https://netbeans.org/)

- Sysadmin Tools: (htop, netstat, tcpdump, nmap, vnstat, mysql-client, mongo-client, curl, nload, etc)

I will update this page as I'm getting new apps or modifications

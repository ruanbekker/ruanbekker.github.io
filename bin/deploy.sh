#!/bin/bash
set -e
# https://stackoverflow.com/a/38316690
# apt-get install -y locales >/dev/null
# echo "en_US UTF-8" > /etc/locale.gen
# locale-gen en_US.UTF-8

export LANG=en_US.UTF-8
export LANGUAGE=en_US:en
export LC_ALL=en_US.UTF-8

git add source/_posts/*.markdown && git commit -m "add post $(date +%F)" && git push origin source && bundle exec rake generate && bundle exec rake deploy

---
layout: post
title: "Hello World Ruby on Rails App Tutorial using Mac"
date: 2018-07-20 03:30:20 -0400
comments: true
categories: ["ruby", "ruby-on-rails", "hello-world", "rails", "web-development"] 
---

In this tutorial, we will setup a basic ruby on rails web app, that consists of a `/hello_world` and a `/status` controller. The hello_world controller will return `Hello, World` and our `/status` controller will return a `HTTP 204` no content response code.

## Setup Ruby on Rails

Setup Ruby on Rails on your Mac:

```
$ brew install rbenv ruby-build

$ echo 'if which rbenv > /dev/null; then eval "$(rbenv init -)"; fi' >> ~/.bash_profile
$ source ~/.bash_profile

$ rbenv install 2.5.0
$ rbenv global 2.5.0
$ ruby -v

$ gem install rails -v 5.1.4
$ benv rehash
```

## Creating the App

Create your ruby on rails application:

```
$ rails new fist-app
$ cd first-app
$ rails server
```

## Route Config

Our routes config:

```
$ cat config/routes.rb
Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  get 'hello_world', to: 'hello_world#call'
  get 'status', to: 'status#call'
end
```

## Controllers

Configure the hello_world controller:

```
$ cat app/controllers/hello_world_controller.rb

class HelloWorldController < ApplicationController
  def call
    render body: "Hello, World"
  end
end
```

Configure the status controller:

```
$ cat app/controllers/status_controller.rb

class StatusController < ApplicationController
  def call
    [204, {}, ['']]
  end
end
```

## Testing

For our hello world controller:

```
$ curl -i http://localhost:3000/hello_world
HTTP/1.1 200 OK
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Content-Type: text/plain; charset=utf-8
ETag: W/"565339bc4d33d72817b583024112eb7f"
Cache-Control: max-age=0, private, must-revalidate
X-Request-Id: 62441a6d-faa3-42d5-a5a2-bcf7eff5e917
X-Runtime: 0.001940
Transfer-Encoding: chunked
Hello, World
```

For our status controller:

```bash
$ curl -i http://localhost:3000/status
HTTP/1.1 204 No Content
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Cache-Control: no-cache
X-Request-Id: bec91213-ff82-4fc6-8698-3ee7622b1f51
X-Runtime: 0.075504
```

## Resources:

- https://gorails.com/setup/osx/10.12-sierra
- http://guides.rubyonrails.org/routing.html
- https://www.railstutorial.org/book/beginning#sec-installing_rails
- https://www.railstutorial.org/book/toy_app
- http://codingnudge.com/2017/03/17/tutorial-how-to-run-ruby-on-rails-on-docker-part-1/
- https://medium.com/how-i-learned-ruby-rails/how-i-trained-to-learn-rails-e08c94e2a51e

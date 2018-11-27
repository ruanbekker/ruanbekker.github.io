---
layout: post
title: "Golang: Building a Basic Web Server in Go"
date: 2018-11-21 00:57:54 -0500
comments: true
categories: ["golang", "golang-tutorial", "hello-world", "programming"] 
---

![](https://objects.ruanbekker.com/assets/images/golang-web-server.png)

Continuing with our [#golang-tutorial](https://blog.ruanbekker.com/blog/categories/golang-tutorial/) blog series, in this post we will setup a Basic HTTP Server in Go.

## Our Web Server:

Our Web Server will respond on 2 Request Paths:

```
- / -> returns "Hello, Wolrd!"
- /cheers -> returns "Goodbye!"
```

## Application Code:

If you have not setup your golang environment, you can do so by visiting [@AkyunaAkish's Post on Setting up a Golang Development Enviornment on MacOSX](https://medium.com/@AkyunaAkish/setting-up-a-golang-development-environment-mac-os-x-d58e5a7ea24f).

Create the `server.go` or any filename of your choice. Note: I created 2 ways of returning the content of http response for demonstration

```go
package main

import (
	"io"
        "log"
	"net/http"
)

func hello(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Hello, World!" + "\n")
	log.Println("hello function handler was executed")
}

func goodbye(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	io.WriteString(w, "Cheers!" + "\n")
	log.Println("goodbye function handler was executed")
}

func main() {
	http.HandleFunc("/", hello)
	http.HandleFunc("/cheers", goodbye)
	http.ListenAndServe(":8000", nil)
}
```

Explanation of what we are doing:

- Programs runs in the package `main`
- We are importing 3 packages: `io`, `log` and `net/http`
- HandleFunc registers the handler function for the given pattern in the DefaultServeMux, in this case the HandleFunc registers `/` to the `hello` handler function and `/cheers` to the goodbye handler function.
- In our 2 handler functions, we have two arguments: 
  - The first one is `http.ResponseWriter` and its corresponding response stream, which is actually an interface type. 
  - The second is `*http.Request` and its corresponding HTTP request. `io.WriteString` is a helper function to let you write a string into a given writable stream, this is named the `io.Writer` interface in Golang. 
- ListenAndServe starts an HTTP server with a given address and handler. The handler is usually nil, which means to use DefaultServeMux
- The logging is not a requirement, but used it for debugging/verbosity

## Running our Server:

Run the http server:

```bash
$ go run server.go
```

## Client Side Requests:

Run client side http requests to your golang web server:

```bash
$ curl -i http://localhost:8000/
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Date: Wed, 21 Nov 2018 21:33:42 GMT
Content-Length: 14

Hello, World!
```

And another request to `/cheers`:

```bash
$ curl -i http://localhost:8000/cheers
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Date: Wed, 21 Nov 2018 21:29:46 GMT
Content-Length: 8

Cheers!
```

## Server Side Output:

As we used the log package, the logging gets returned to stdout:

```bash
$ go run server.go
2018/11/21 23:29:36 hello function handler was executed
2018/11/21 23:29:46 goodbye function handler was executed
```

## Resources:

- https://golang.org/doc/code.html
- https://gowalker.org/net/http#HandleFunc
- https://stackoverflow.com/questions/37863374/whats-the-difference-between-responsewriter-write-and-io-writestring
- https://www.alexedwards.net/blog/golang-response-snippets

<script type="text/javascript">
  ( function() {
    if (window.CHITIKA === undefined) { window.CHITIKA = { 'units' : [] }; };
    var unit = {"calltype":"async[2]","publisher":"rbekker87","width":728,"height":90,"sid":"Chitika Default"};
    var placement_id = window.CHITIKA.units.length;
    window.CHITIKA.units.push(unit);
    document.write('<div id="chitikaAdBlock-' + placement_id + '"></div>');
}());
</script>
<script type="text/javascript" src="//cdn.chitika.net/getads.js" async></script>

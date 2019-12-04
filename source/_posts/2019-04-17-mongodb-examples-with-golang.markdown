---
layout: post
title: "MongoDB Examples with Golang"
date: 2019-04-17 08:51:35 -0400
comments: true
categories: ["mongodb", "golang", "databases", "programming"] 
---

![](https://user-images.githubusercontent.com/567298/55478904-236e9200-561d-11e9-9382-f31b25a9ae03.png)

While looking into working with mongodb using golang, I found it quite frustrating getting it up and running and decided to make a quick post about it.

<a href="https://bekkerclothing.com/collections/developer?utm_source=blog.ruanbekker.com&utm_medium=blog&utm_campaign=leaderboard_ad" target="_blank"><img alt="bekker-clothing-developer-tshirts" src="https://user-images.githubusercontent.com/567298/70170981-7c278a80-16d6-11ea-9759-6621d02c1423.png"></a>

## What are we doing?

Examples using the golang driver for mongodb to connect, read, update and delete documents from mongodb.

## Environment:

Provision a mongodb server in docker:

```
$ docker network create container-net
$ docker run -itd --name mongodb --network container-net -p 27017:27017 ruanbekker/mongodb
```

Drop into a golang environment using docker:

```
$ docker run -it golang:alpine sh
```

Get the dependencies:

```
$ apk add --no-cache git
```

Change to your project path:

```
$ mkdir $GOPATH/src/myapp
$ cd $GOPATH/src/myapp
```

Download the golang mongodb driver:

```
$ go get go.mongodb.org/mongo-driver
```

## Connecting to MongoDB in Golang

First example will be to connect to your mongodb instance:

```go
package main

import (
    "context"
    "fmt"
    "log"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/mongo/options"
)

type Person struct {
    Name string
    Age  int
    City string
}

func main() {
    clientOptions := options.Client().ApplyURI("mongodb://mongodb:27017")
    client, err := mongo.Connect(context.TODO(), clientOptions)

    if err != nil {
        log.Fatal(err)
    }

    err = client.Ping(context.TODO(), nil)

    if err != nil {
        log.Fatal(err)
    }

    fmt.Println("Connected to MongoDB!")

}
```

Running our app:

```bash
$ go run main.go
Connected to MongoDB!
```

## Writing to MongoDB with Golang

Let's insert a single document to MongoDB:

```go
func main() {
    ..
    collection := client.Database("mydb").Collection("persons")
    
    ruan := Person{"Ruan", 34, "Cape Town"}

    insertResult, err := collection.InsertOne(context.TODO(), ruan)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println("Inserted a Single Document: ", insertResult.InsertedID)
}
```

Running it will produce:

```bash
$ go run main.go
Connected to MongoDB!
Inserted a single document:  ObjectID("5cb717dcf597b4411252341f")
```

Writing more than one document:

```
func main() {
    ..
    collection := client.Database("mydb").Collection("persons")
    
    ruan := Person{"Ruan", 34, "Cape Town"}
    james := Person{"James", 32, "Nairobi"}
    frankie := Person{"Frankie", 31, "Nairobi"}

    trainers := []interface{}{james, frankie}

    insertManyResult, err := collection.InsertMany(context.TODO(), trainers)
    if err != nil {
		log.Fatal(err)
	}
    fmt.Println("Inserted multiple documents: ", insertManyResult.InsertedIDs)
}
```

This will output in:

```bash
$ go run main.go
Inserted Multiple Documents:  [ObjectID("5cb717dcf597b44112523420") ObjectID("5cb717dcf597b44112523421")]
```

## Updating Documents in MongoDB using Golang

Updating Frankie's age:

```
func main() {
    ..
    filter := bson.D{{"name", "Frankie"}}
    update := bson.D{
        {"$inc", bson.D{
            {"age", 1},
        }},
    }

    updateResult, err := collection.UpdateOne(context.TODO(), filter, update)
    if err != nil {
		log.Fatal(err)
	}
    fmt.Printf("Matched %v documents and updated %v documents.\n", updateResult.MatchedCount, updateResult.ModifiedCount)
}
```

Running that will update Frankie's age:

```bash
$ go run main.go
Matched 1 documents and updated 1 documents.
```

## Reading Data from MongoDB

Reading the data:

```go
funct main() {
    ..
    filter := bson.D{{"name", "Frankie"}}
    var result Trainer

	err = collection.FindOne(context.TODO(), filter).Decode(&result)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Found a single document: %+v\n", result)

	findOptions := options.Find()
    findOptions.SetLimit(2)
    
}
```

```bash
$ go run main.go
Found a single document: {Name:Frankie Age:32 City:Nairobi}
```

Finding multiple documents and returning the cursor

```go
func main() {
    ..
    var results []*Trainer
	cur, err := collection.Find(context.TODO(), bson.D{{}}, findOptions)
	if err != nil {
		log.Fatal(err)
	}

	for cur.Next(context.TODO()) {
		var elem Trainer
		err := cur.Decode(&elem)
		if err != nil {
			log.Fatal(err)
		}

		results = append(results, &elem)
	}

	if err := cur.Err(); err != nil {
		log.Fatal(err)
	}

	cur.Close(context.TODO())
    fmt.Printf("Found multiple documents (array of pointers): %+v\n", results)
}
```

Running the example:

```
$ go run main.go
Found multiple documents (array of pointers): [0xc0001215c0 0xc0001215f0]
```

## Deleting Data from MongoDB:

Deleting our data and closing the connection:

```go
func main(){
    ..
    deleteResult, err := collection.DeleteMany(context.TODO(), bson.D{{}})
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Deleted %v documents in the trainers collection\n", deleteResult.DeletedCount)

	err = client.Disconnect(context.TODO())

	if err != nil {
		log.Fatal(err)
	} else {
		fmt.Println("Connection to MongoDB closed.")
	}
}
```

Running the example:

```bash
$ go run main.go
Deleted 3 documents in the trainers collection
Connection to MongoDB closed.
```

The code for this example can be found at [github.com/ruanbekker/code-examples/mongodb/golang/examples.go](https://github.com/ruanbekker/code-examples/blob/master/mongodb/golang/examples.go)

## Resources:

- https://www.mongodb.com/blog/post/mongodb-go-driver-tutorial

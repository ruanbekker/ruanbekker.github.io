---
layout: post
title: "Tutorial on DynamoDB using Bash and the AWS CLI Tools to Interact with a Music Dataset"
date: 2018-08-14 16:33:22 -0400
comments: true
categories: ["aws", "dynamodb", "nosql", "bash", "awscli", "docker"] 
---

![](https://objects.ruanbekker.com/assets/images/aws-logo.png)

In this tutorial we will be using Amazons DynamoDB (DynamoDB Local) to host a sample dataset consisting of music data that I retrieved from the iTunes API, which we will be using the aws cli tools to interact with the data. 

We will be doing the following:

- Use Docker to provision a Local DynamoDB Server
- Create a DynamoDB Table with a Hash and Range Key
- List the Table
- Create a Item in DynamoDB
- Read a Item from DynamoDB
- Read a Item from DynamoDB by specifying the details you would like to read
- Batch Write multiple items to DynamoDB
- Scan all your Items from DynamoDB
- Query by Artist
- Query by Artist and Song
- Query all the Songs from an Artist starting with a specific letter
- Indexes
- Delete the Table

If you are just getting started with DynamoDB, I recommend having a look at [Amazons DynamoDB Documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html) Page first.

## The Music Dataset:

I used the [iTunes API](https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/) to get the music metadata, but I also have a post on [how to query the iTunes API](http://blog.ruanbekker.com/blog/2018/05/08/use-python-requests-to-interact-with-the-itunes-api-to-search-for-music-info/) to get data from them to use.

a Quick way in Python to get the top 10 songs from Guns and Roses, will look like this:

```python
>>> a = 'https://itunes.apple.com/search?term=guns+and+roses&limit=10'
>>> b = requests.get(a).json()
>>> print(json.dumps(b, indent=2))
```

## Create the DynamoDB Local Server on Docker:

If you have a AWS Account you can provision your table from there, but if you want to test it locally, you can provision a local DynamoDB Server using Docker:

```
$ docker run -it -p 8000:8000 --name dynamodb-local rbekker87/dynamodb-local
```

## Install the AWS CLI Tools:

```bash
$ pip install awscli
$ aws configure
# you can enter random data if you are using dynamodb-local
```

## Create the DynamoDB Table:

Create a DynamoDB Table named `MusicCollection` with a `Artist (HASH)` and `SongTitle (RANGE)` key attributes: 

```bash
$ aws dynamodb create-table --table-name MusicCollection \
  --attribute-definitions AttributeName=Artist,AttributeType=S AttributeName=SongTitle,AttributeType=S \
  --key-schema AttributeName=Artist,KeyType=HASH AttributeName=SongTitle,KeyType=RANGE \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --endpoint-url http://localhost:8000

Response:
{
    "TableDescription": {
        "TableArn": "arn:aws:dynamodb:ddblocal:000000000000:table/MusicCollection",
        "AttributeDefinitions": [
            {
                "AttributeName": "Artist",
                "AttributeType": "S"
            },
            {
                "AttributeName": "SongTitle",
                "AttributeType": "S"
            }
        ],
        "ProvisionedThroughput": {
            "NumberOfDecreasesToday": 0,
            "WriteCapacityUnits": 5,
            "LastIncreaseDateTime": 0.0,
            "ReadCapacityUnits": 5,
            "LastDecreaseDateTime": 0.0
        },
        "TableSizeBytes": 0,
        "TableName": "MusicCollection",
        "TableStatus": "ACTIVE",
        "KeySchema": [
            {
                "KeyType": "HASH",
                "AttributeName": "Artist"
            },
            {
                "KeyType": "RANGE",
                "AttributeName": "SongTitle"
            }
        ],
        "ItemCount": 0,
        "CreationDateTime": 1525339294.186
    }
}
```

## Listing the Tables:

List the DynamoDB Table that you created:

```bash
$ aws dynamodb list-tables --endpoint-url http://localhost:8000

{
    "TableNames": [
        "MusicCollection"
    ]
}
```

## Create a Item in DynamoDB:

Add a song from the band `Bring me the Horizon` called `Sleepwalking` from the album `Sempiternal` to the table by using the `PutItem` call:

```bash
$ aws dynamodb --endpoint-url http://localhost:8000 put-item --table-name MusicCollection \
  --item '{"Artist": {"S": "Bring me the Horizon"}, "SongTitle": {"S": "Sleepwalking"}, "AlbumTitle": {"S": "Sempiternal"}}'
```

## Read a Item from DynamoDB

Get the Song Details from the Table by using the `GetItem` call:

```bash
$ aws dynamodb --endpoint-url http://localhost:8000 get-item --table-name MusicCollection \
  --key  '{"Artist": {"S": "Bring me the Horizon"}, "SongTitle": {"S": "Sleepwalking"}}'

{
    "Item": {
        "Artist": {
            "S": "Bring me the Horizon"
        },
        "SongTitle": {
            "S": "Sleepwalking"
        },
        "AlbumTitle": {
            "S": "Sempiternal"
        }
    }
}
```

To only get specific attributes we can use `--aatributes-to-get`:

```bash
$ aws dynamodb --endpoint-url http://localhost:8000 get-item --table-name MusicCollection \
  --attributes-to-get '["AlbumTitle", "SongTitle"]' \
  --key  '{"Artist": {"S": "Bring me the Horizon"}, "SongTitle": {"S": "Sleepwalking"}}'

{
    "Item": {
        "SongTitle": {
            "S": "Sleepwalking"
        },
        "AlbumTitle": {
            "S": "Sempiternal"
        }
    }
}
```

However, AWS Recommends to use the `--projection-expression` parameter:

```bash
$ aws dynamodb --endpoint-url http://localhost:8000 get-item --table-name MusicCollection \
  --projection-expression "AlbumTitle, SongTitle" \
  --key  '{"Artist": {"S": "Bring me the Horizon"}, "SongTitle": {"S": "Sleepwalking"}}'

{
    "Item": {
        "SongTitle": {
            "S": "Sleepwalking"
        },
        "AlbumTitle": {
            "S": "Sempiternal"
        }
    }
}
```

- https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/LegacyConditionalParameters.AttributesToGet.html

## Batch Write

Now lets use the [iTunes API](https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/) to get a collection of some songs, which I will dump into a [json file on github](https://github.com/ruanbekker/dynamodb-local-docker/blob/master/demo/batch-write-songs.json). So now that we have a json file with a collection of songs from multiple artists, we can go ahead and write it into our table using the `BatchWriteItem` call:

```bash
$ wget https://raw.githubusercontent.com/ruanbekker/dynamodb-local-docker/master/demo/batch-write-songs.json
$ aws dynamodb batch-write-item --request-items file://music-table/batch-write-songs.json --endpoint-url http://localhost:8000
```

## Scan the Table:

This can be a very expensive call, as a `Scan` will return all the items from your table, and depending on the size of your table, you could be throttled, but since we are using dynamodb local and only having 16 items in our table, we can do a scan to return all the items in our table:

```bash
$ aws dynamodb --endpoint-url http://localhost:8000 scan --table-name MusicCollection
{
    "Count": 16,
```

## Query

Let's start using the `Query` call to get all the songs from the Artist: AC/DC

- https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/LegacyConditionalParameters.QueryFilter.html

```bash
$ aws dynamodb --endpoint-url http://localhost:8000 query --select ALL_ATTRIBUTES \
  --table-name MusicCollection \
  --key-condition-expression "Artist = :a" \
  --expression-attribute-values  '{":a":{"S":"AC/DC"}}'

{
    "Count": 3,
    "Items": [
        {
            "Artist": {
                "S": "AC/DC"
            },
            "SongTitle": {
                "S": "Back In Black"
            },
            "AlbumTitle": {
                "S": "Back In Black"
            }
        },
        {
            "Artist": {
                "S": "AC/DC"
            },
            "SongTitle": {
                "S": "Thunderstruck"
            },
            "AlbumTitle": {
                "S": "The Razors Edge"
            }
        },
        {
            "Artist": {
                "S": "AC/DC"
            },
            "SongTitle": {
                "S": "You Shook Me All Night Long"
            },
            "AlbumTitle": {
                "S": "Back in Black"
            }
        }
    ],
    "ScannedCount": 3,
    "ConsumedCapacity": null
}
```

Query to get the details of a specific Song from a specific Artist:

```bash
$ aws dynamodb --endpoint-url http://localhost:8000 query --select ALL_ATTRIBUTES \
  --table-name MusicCollection \
  --key-condition-expression "Artist = :a and SongTitle = :t" \
  --expression-attribute-values  '{ ":a": {"S": "AC/DC"}, ":t": {"S": "You Shook Me All Night Long"}}'

{
    "Count": 1,
    "Items": [
        {
            "Artist": {
                "S": "AC/DC"
            },
            "SongTitle": {
                "S": "You Shook Me All Night Long"
            },
            "AlbumTitle": {
                "S": "Back in Black"
            }
        }
    ],
    "ScannedCount": 1,
    "ConsumedCapacity": null
}
```

Query to get all the songs from the Beatles that starts with the letter 'H':

```bash
$ aws dynamodb --endpoint-url http://localhost:8000 query --select ALL_ATTRIBUTES \
  --table-name MusicCollection \
  --key-condition-expression "Artist = :a and begins_with(SongTitle, :t)" \
  --expression-attribute-values  '{":a":{"S":"The Beatles"}, ":t": {"S": "h"}}'

{
    "Count": 2,
    "Items": [
        {
            "Artist": {
                "S": "The Beatles"
            },
            "SongTitle": {
                "S": "Happy Day"
            },
            "AlbumTitle": {
                "S": "The Beatles 1967-1970 (The Blue Album)"
            }
        },
        {
            "Artist": {
                "S": "The Beatles"
            },
            "SongTitle": {
                "S": "Help!"
            },
            "AlbumTitle": {
                "S": "The Beatles Box Set"
            }
        }
    ],
    "ScannedCount": 2,
    "ConsumedCapacity": null
}
```

So our table consists of Artist (HASH) and SongTitle (RANGE), so we can only query based on those attributes. You will find when you try to query on a attribute that is not part of the KeySchema, a exception will be received:

```bash
$ aws dynamodb --endpoint-url http://localhost:8000 query --select ALL_ATTRIBUTES --table-name MusicCollection --key-condition-expression "Artist = :a and AlbumTitle = :t" --expression-attribute-values  '{":a":{"S":"AC/DC"}, ":t": {"S": "Back in Black"}}'

An error occurred (ValidationException) when calling the Query operation: Query condition missed key schema element
```

So how do we query on a attribute that is not part of the KeySchema? Let's say you want to query all the songs from a Artist and a specific Album.

## Global Secondary Indexes:

Add Global Secondary Index, with the Attributes: Artist and AlbumTitle.

```bash
$ aws dynamodb --endpoint-url http://localhost:8000 update-table --table-name MusicCollection \
  --attribute-definitions AttributeName=Artist,AttributeType=S AttributeName=SongTitle,AttributeType=S AttributeName=AlbumTitle,AttributeType=S \
  --global-secondary-index-updates "Create={"IndexName"="album-index", "KeySchema"=[ {"AttributeName"="Artist", "KeyType"="HASH"}, {"AttributeName"="AlbumTitle", "KeyType"="RANGE" }], "Projection"={"ProjectionType"="INCLUDE", "NonKeyAttributes"="AlbumTitle"}, "ProvisionedThroughput"= {"ReadCapacityUnits"=1, "WriteCapacityUnits"=1} }"

{
    "TableDescription": {
        "TableArn": "arn:aws:dynamodb:ddblocal:000000000000:table/MusicCollection",
        "AttributeDefinitions": [
            {
                "AttributeName": "Artist",
                "AttributeType": "S"
            },
            {
                "AttributeName": "SongTitle",
                "AttributeType": "S"
            },
            {
                "AttributeName": "AlbumTitle",
                "AttributeType": "S"
            }
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "album-index",
                "Projection": {
                    "ProjectionType": "INCLUDE",
                    "NonKeyAttributes": [
                        "AlbumTitle"
                    ]
                },
                "ProvisionedThroughput": {
                    "WriteCapacityUnits": 1,
                    "ReadCapacityUnits": 1
                },
                "IndexStatus": "CREATING",
                "Backfilling": false,
                "KeySchema": [
                    {
                        "KeyType": "HASH",
                        "AttributeName": "Artist"
                    },
                    {
                        "KeyType": "RANGE",
                        "AttributeName": "AlbumTitle"
                    }
                ],
                "IndexArn": "arn:aws:dynamodb:ddblocal:000000000000:table/MusicCollection/index/album-index"
            }
        ],
        "ProvisionedThroughput": {
            "NumberOfDecreasesToday": 0,
            "WriteCapacityUnits": 5,
            "LastIncreaseDateTime": 0.0,
            "ReadCapacityUnits": 5,
            "LastDecreaseDateTime": 0.0
        },
        "TableSizeBytes": 984,
        "TableName": "MusicCollection",
        "TableStatus": "ACTIVE",
        "KeySchema": [
            {
                "KeyType": "HASH",
                "AttributeName": "Artist"
            },
            {
                "KeyType": "RANGE",
                "AttributeName": "SongTitle"
            }
        ],
        "ItemCount": 15,
        "CreationDateTime": 1525339294.186
    }
}
```

Now when we use the same query, but we specify our index, we will get the data:

```bash
$ aws dynamodb --endpoint-url http://localhost:8000 query \
  --select ALL_ATTRIBUTES \
  --table-name MusicCollection \
  --index-name album-index \
  --key-condition-expression "Artist = :a and AlbumTitle = :t" \
  --expression-attribute-values  '{":a":{"S":"AC/DC"}, ":t": {"S": "Back in Black"}}'

{
    "Count": 1,
    "Items": [
        {
            "Artist": {
                "S": "AC/DC"
            },
            "SongTitle": {
                "S": "You Shook Me All Night Long"
            },
            "AlbumTitle": {
                "S": "Back in Black"
            }
        }
    ],
    "ScannedCount": 1,
    "ConsumedCapacity": null
}
```

## Delete the Table:

Delete the Table that we created:

```bash
$ aws dynamodb --endpoint-url http://localhost:8000 delete-table --table-name MusicCollection
```

## Resources:

- https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/SQLtoNoSQL.ReadData.Query.html
- https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/SQLtoNoSQL.Indexes.html
- https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/


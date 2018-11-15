---
layout: post
title: "Create Read Only Users in MongoDB"
date: 2018-11-12 17:02:53 -0500
comments: true
categories: ["mongodb", "authentication", "nosql", "databases", "security"] 
---

In this post I will demonstrate how to setup 2 read only users in MongoDB, one user that will have access to one MongoDB Database and all the Collections, and one user with access to one MongoDB Database and only one Collection.

<script id="mNCC" language="javascript">
    medianet_width = "728";
    medianet_height = "90";
    medianet_crid = "218284798";
    medianet_versionId = "3111299";
  </script>
<script src="//contextual.media.net/nmedianet.js?cid=8CUD78FSV"></script>

## First Method: Creating and Assigning the User

The first method we will create the user and assign it the read permissions that he needs. In this case read only access to the mytest db.

First logon to mongodb and switch to the admin database:

```bash
$ mongo -u dbadmin -p --authenticationDatabase admin
> use admin
switched to db admin
```

Now list the dbs:

```bash
> show dbs
admin       0.000GB
mytest      0.000GB
```

List the collections and read the data from it for demonstration purposes:

```bash
> use mytest
> show collections;
col1
col2
> db.col1.find()
{ "_id" : ObjectId("5be3d377b54849bb738e3b6b"), "name" : "ruan" }
> db.col2.find()
{ "_id" : ObjectId("5be3d383b54849bb738e3b6c"), "name" : "stefan" }
```

Now create the user collectionreader that will have access to read all the collections from the database:

```bash
$ > db.createUser({user: "collectionreader", pwd: "secretpass", roles: [{role: "read", db: "mytest"}]})
Successfully added user: {
  "user" : "collectionreader",
  "roles" : [
    {
      "role" : "read",
      "db" : "mytest"
    }
  ]
}
```

Exit and log out and log in with the new user to test the permissions:

```bash
$ mongo -u collectionreader -p --authenticationDatabase mytest
> use mytest
switched to db mytest

> show collections
col1
col2

> db.col1.find()
{ "_id" : ObjectId("5be3d377b54849bb738e3b6b"), "name" : "ruan" }
```

Now lets try to write to a collection:

```bash
> db.col1.insert({"name": "james"})
WriteResult({
  "writeError" : {
    "code" : 13,
    "errmsg" : "not authorized on mytest to execute command { insert: \"col1\", documents: [ { _id: ObjectId('5be3d6c0492818b2c966d61a'), name: \"james\" } ], ordered: true }"
  }
})
```

So we can see it works as expected.

## Second Method: Create Roles and Assign Users to the Roles

In the second method, we will create the roles then assign the users to the roles. And in this scenario, we will only grant a user `reader` access to one collection on a database. Login with the admin user:

```bash
$ mongo -u dbadmin -p --authenticationDatabase admin
> use admin
```

First create the read only role `myReadOnlyRole`:

```bash
> db.createRole({ role: "myReadOnlyRole", privileges: [{ resource: { db: "mytest", collection: "col2"}, actions: ["find"]}], roles: []})
```

Now create the user and assign it to the role:

```bash
> db.createUser({ user: "reader", pwd: "secretpass", roles: [{ role: "myReadOnlyRole", db: "mytest"}]})
```

Similarly, if we had an existing user that we also would like to add to that role, we can do that by doing this:

```bash
> db.grantRolesToUser("anotheruser", [ { role: "myReadOnlyRole", db: "mytest" } ])
```

Logout and login with the reader user:

```bash
$ mongo -u reader -p --authenticationDatabase mytest
> use mytest
```

Now try to list the collections:

```bash
> show collections
2018-11-08T07:42:39.907+0100 E QUERY    [thread1] Error: listCollections failed: {
  "ok" : 0,
  "errmsg" : "not authorized on mytest to execute command { listCollections: 1.0, filter: {} }",
  "code" : 13,
  "codeName" : "Unauthorized"
}
```

As we only have read (find) access on col2, lets try to read data from collection col1:

```bash
> db.col1.find()
Error: error: {
  "ok" : 0,
  "errmsg" : "not authorized on mytest to execute command { find: \"col1\", filter: {} }",
  "code" : 13,
  "codeName" : "Unauthorized"
}
```

And finally try to read data from the collection we are allowed to read from:

```bash
> db.col2.find()
{ "_id" : ObjectId("5be3d383b54849bb738e3b6c"), "name" : "stefan" }
```

And also making sure we cant write to that collection:

```
> db.col2.insert({"name": "frank"})
WriteResult({
  "writeError" : {
    "code" : 13,
    "errmsg" : "not authorized on mytest to execute command { insert: \"col2\", documents: [ { _id: ObjectId('5be3db1530a86d900c361465'), name: \"frank\" } ], ordered: true }"
  }
})
```
## Assigning Permissions to Roles

If you later on want to add more permissions to the role, this can easily be done by using `grantPrivilegesToRole()`:

```bash
$ mongo -u dbadmin -p --authenticationDatabase admin
> use mytest
> db.grantPrivilegesToRole("myReadOnlyRole", [{ resource: { db : "mytest", collection : "col1"}, actions : ["find"] }])
```

To view the permissions for that role:

```bash
> db.getRole("myReadOnlyRole", { showPrivileges : true })
```

## Resources:

- https://docs.mongodb.com/manual/tutorial/create-users/
- https://docs.mongodb.com/manual/core/collection-level-access-control/
- https://docs.mongodb.com/manual/reference/privilege-actions/
- https://sanderknape.com/2018/07/manage-custom-secrets-aws-secrets-manager/
- https://blog.mlab.com/2016/07/mongodb-tips-tricks-collection-level-access-control/
- https://studio3t.com/knowledge-base/articles/mongodb-users-roles-explained-part-1/

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

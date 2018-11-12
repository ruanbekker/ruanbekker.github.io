---
layout: post
title: "Create a Chatbot with Chatterbot on Python"
date: 2017-12-13 08:53:50 -0500
comments: true
categories: ["chatbot", "python", "machinelearning", "docker", "mongodb"] 
---

![](https://chatterbot.readthedocs.io/en/stable/_images/banner.png)

So I've been wanting to take a stab at chatbots for some time, and recently discovered [Chatterbot](https://github.com/gunthercox/ChatterBot), so in this tutorial I will go through some examples on setting up a very basic chatbot.

<script id="mNCC" language="javascript">
    medianet_width = "728";
    medianet_height = "90";
    medianet_crid = "218284798";
    medianet_versionId = "3111299"; 
  </script>
<script src="//contextual.media.net/nmedianet.js?cid=8CUD78FSV"></script>

## Getting the Dependencies:

I will be using Alpine on [Docker](docker.com) to run all the the examples, I am using Alpine so that we have a basic container with nothing special pre-installed.

Chatterbot is written in Python, so let's install Python and Chatterbot:

```bash
$ docker run -it --name chatbot alpine:edge sh
$ apk update && apk add python py2-pip
$ pip install pip --upgrade --user
$ pip install chatterbot
```

## Setup the Basic Chatbot:

Now that our dependencies is installed, enter the Python interpreter where we will instantiate our Chatbot, and get a response from our Chatbot. By default the library will create a sqlite database to build up statements that is passed to and from the bot.

At this point, the bot is still pretty useless:

```bash
$ python
>>> from chatterbot import ChatBot
>>> chatbot = ChatBot('Ben')
>>> chatbot.get_response('What is your name?')
<Statement text:What is your name?>
>>> chatbot.get_response('My name is Ruan, what is your name?')
<Statement text:What is your name?>
```

## Training your Bot:

To enable your bot to have some knowledge, we can train the bot with training data. The training data is populated in a list, which will represent the conversation. 

Exit the python interpreter and delete the sqlite database:

```bash
$ rm -rf db.sqlite3
```

Now our Bot wont have any history of what we said. Start the interpreter again and add some data to train our bot. In this example, we want our Chatbot to respond when we ask it, what his name is:

```bash
>>> from chatterbot import ChatBot
>>> from chatterbot.trainers import ListTrainer
>>> chatbot = ChatBot('Ben')
>>> chatbot.set_trainer(ListTrainer)
>>> chatbot.train(['What is your name?', 'My name is Ben'])
List Trainer: [####################] 100%
```

Now that we have trained our bot, let's try to chat to our bot:

```bash
>>> chatbot.get_response('What is your name?')
<Statement text:My name is Ben>
>>> chatbot.get_response('Who is Ben?')
<Statement text:My name is Ben>
```

We can also enable our bot to respond on multiple statements:

```bash
>>> chatbot.train(['Do you know someone with the name of Sarah?', 'Yes, my sisters name is Sarah', 'Is your sisters name, Sarah?', 'Faw shizzle!'])
List Trainer: [####################] 100%

>>> chatbot.get_response('do you know someone with the name of Sarah?')
<Statement text:Yes, my sisters name is Sarah>
>>> chatbot.get_response('is your sisters name Sarah?')
<Statement text:Faw shizzle!>
```

With that said, we can define our list of statements in our code:

```python
>>> conversations = [
...     'Are you an athlete?', 'No, are you mad? I am a bot',
...     'Do you like big bang theory?', 'Bazinga!',
...     'What is my name?', 'Ruan',
...     'What color is the sky?', 'Blue, stop asking me stupid questions'
... ]

>>> chatbot.train(conversations)
List Trainer: [####################] 100%
>>> chatbot.get_response('What color is the sky?')
<Statement text:Blue, stop asking me stupid questions>
```

So we can see it works as expected, but let's state one of the answers from our statements, to see what happens:

```bash
>>> chatbot.get_response('Bazinga')
<Statement text:What is my name?>
>>> chatbot.get_response('Your name is Ben')
<Statement text:Yes, my name is Ben>
```

So we can see it uses natural language processing to learn from the data that we provide our bot. Just to check another question:

```bash
>>> chatbot.get_response('Do you like big bang theory?')
<Statement text:Bazinga!>
```

If we have quite a large subset of learning data, we can add all the data in a file, seperated by new lines then we can use python to read the data from disk, and split up the data in the expected format.

The training file will reside in our working directory, let's name it `training-data.txt` and the content will look like this:

```bash
What is Bitcoin?
Bitcoin is a Crypto Currency
Where is this blog hosted?
Github
```

A visual example of how we will process this data will look like this:

```bash
>>> data = open('training-data.txt').read()
>>> data.strip().split('\n')
['What is Bitcoin?', 'Bitcoin is a Crypto Currency', 'Where is this blog hosted?', 'Github']
```

And in action, it will look like this:

```bash
>>> data = open('training-data.txt').read()
>>> conversations = data.strip().split('\n')
>>> chatbot.train(conversations)
List Trainer: [####################] 100%

>>> chatbot.get_response('Where is this blog hosted?')
<Statement text:Github>
```

There is also pre-populated data that you can use to train your bot, on the [documentation](https://chatterbot.readthedocs.io/en/stable/training.html#training-with-corpus-data) is a couple of examples, but for demonstration, we will use the CorpusTrainer:

```bash
>>> from chatterbot.trainers import ChatterBotCorpusTrainer
>>> chatterbot.set_trainer(ChatterBotCorpusTrainer)
>>> chatbot.train("chatterbot.corpus.english")
ai.yml Training: [####################] 100%
botprofile.yml Training: [####################] 100%
computers.yml Training: [####################] 100%
conversations.yml Training: [####################] 100%
emotion.yml Training: [####################] 100%
food.yml Training: [####################] 100%
gossip.yml Training: [####################] 100%
greetings.yml Training: [####################] 100%
history.yml Training: [####################] 100%
humor.yml Training: [####################] 100%
literature.yml Training: [####################] 100%
money.yml Training: [####################] 100%
movies.yml Training: [####################] 100%
politics.yml Training: [####################] 100%
psychology.yml Training: [####################] 100%
science.yml Training: [####################] 100%
sports.yml Training: [####################] 100%
trivia.yml Training: [####################] 100%

>>> chatbot.get_response('Do you like peace?')
<Statement text:not especially. i am not into violence.>
>>> chatbot.get_response('Are you emotional?')
<Statement text:Sort of.>
>>> chatbot.get_response('What language do you speak?')
<Statement text:Python.>
>>> chatbot.get_response('What is your name?')
<Statement text:My name is Ben>
>>> chatbot.get_response('Who is the President of America?')
<Statement text:Richard Nixon> #data seems outdated :D
>>> chatbot.get_response('I like cheese')
<Statement text:What kind of movies do you like?>
```

## Using an External Database like MongoDB

Instead of using sqlite on the same host, we can use a NoSQL Database like MongoDB that resides outside our application.

For the sake of this tutorial, I will use Docker to spin up a MongoDB Container:

```bash
$ docker run -d --name mongodb -p 27017:27017 -p 28017:28017 -e AUTH=no -e OPLOG_SIZE=50 tutum/mongodb
```

Below is my code of a terminal application that uses Chatterbot, MongoDB as a Storage Adapter, and we are using a while loop, so that we can chat with our bot, and in our except statement, we can stop our application by using our keyboard to exit:

```python
from chatterbot import ChatBot
from chatterbot.trainers import ChatterBotCorpusTrainer

chatbot = ChatBot(
    "Chatbot Backed by MongoDB",
    storage_adapter="chatterbot.storage.MongoDatabaseAdapter",
    database="chatterbot_db",
    database_uri="mongodb://172.17.0.3:27017/",
    logic_adapters=[
        'chatterbot.logic.BestMatch'
    ],
    trainer='chatterbot.trainers.ChatterBotCorpusTrainer',
    filters=[
        'chatterbot.filters.RepetitiveResponseFilter'
    ],
    input_adapter='chatterbot.input.TerminalAdapter',
    output_adapter='chatterbot.output.TerminalAdapter'
)

chatbot.set_trainer(ChatterBotCorpusTrainer)
chatbot.train("chatterbot.corpus.english")

print('Chatbot Started:')

while True:
    try:
        print(" -> You:")
        botInput = chatbot.get_response(None)
    except (KeyboardInterrupt, EOFError, SystemExit):
        break
```

Running the example:

```bash
$ python bot.py
 -> You:
How are you?
I am doing well.
 -> You:
Tell me a joke
A 3-legged dog walks into an old west saloon, slides up to the bar and announces "I'm looking for the man who shot my paw."
```

And from mongodb, we can see some data:

```bash
$ mongo
> show dbs
admin          0.078GB
chatterbot_db  0.078GB
local          0.078GB

> use chatterbot_db
switched to db chatterbot_db

> show collections;
conversations
statements
system.indexes

> db.conversations.find().count()
4
> db.statements.find().count()
1240
> db.system.indexes.find().count()
3
```

That was a basic tutorial on Chatterbot, next I will be looking into mining data from Twitter's API and see how clever our bot can become.

## Resources:

- [Chatterbot Documentation](https://chatterbot.readthedocs.io/en/stable/quickstart.html#quick-start-guide)
- [Chatterbot Examples](https://github.com/gunthercox/ChatterBot/tree/master/examples)

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


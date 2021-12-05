---
layout: post
title: "Run a GETH Ethereum Light Node"
date: 2021-12-05 04:14:11 -0500
comments: true
categories: ["ethereum", "blockchain", "geth"]
---

![ethereum](https://user-images.githubusercontent.com/567298/144747750-e0a6f000-fc60-4422-b9bc-7b1b6549cbe4.png)

In this tutorial we will install the Geth implementation of [Ethereum](https://ethereum.org/en/) on Linux and we will be using the [light sync mode](https://ethereum.org/en/developers/docs/nodes-and-clients/#light-node) which will get you up and running in minutes, which only downloads a couple of GBs.

Once we have our node setup we will be using the API and Web3 to interact with our ethereum node.

## Environment Setup

We require go to be installed on our server, so from golang's [releases](https://golang.org/dl/) page get the latest version of Go and extract it:

```bash
cd /tmp
wget https://go.dev/dl/go1.17.4.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.17.4.linux-amd64.tar.gz
```

Setup environment for Go in `/etc/profile.d/go.sh`:

```bash
export GOROOT=/usr/local/go
export GOPATH=$HOME/go
export PATH=$PATH:$GOROOT/bin
```

While you are in your session, source the file:

```bash
source /etc/profile.d/go.sh
```

And verify that Go is installed:

```bash
go version
go version go1.17.4 linux/amd64
```

## Download Geth

From the geth [releases](https://geth.ethereum.org/downloads/) page, get the latest version, extract and setup a symlink to the latest version:

```bash
cd /tmp
wget https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.10.13-7a0c19f8.tar.gz
tar -xvf geth-linux-amd64-1.10.13-7a0c19f8.tar.gz
sudo mkdir -p /usr/local/geth/1.10.13/bin
sudo mv geth-linux-amd64-1.10.13-7a0c19f8/geth /usr/local/geth/1.10.13/bin/geth
sudo ln -s /usr/local/geth/1.10.13 /usr/local/geth/current
```

Setup the environment for geth on `/etc/profile.d/geth.sh`:

```bash
export PATH=$PATH:/usr/local/geth/current/bin
```

Then source the file while you are still in your session:

```bash
source /etc/profile.d/geth.sh
```

You should be able to verify that geth is installed by running:

```bash
geth version
Geth
Version: 1.10.13-stable
Git Commit: eae3b1946a276ac099e0018fc792d9e8c3bfda6d
Git Commit Date: 20210929
Architecture: amd64
Go Version: go1.17
Operating System: linux
GOPATH=/home/ubuntu/go
GOROOT=/usr/local/go
```

## Setup Geth

Create the data directory for geth and change the ownership of the directory to our user:

```bash
sudo mkdir -p /blockchain/ethereum/data
sudo chown -R ubuntu:ubuntu /blockchain/ethereum
```

Run geth in the foreground to test:

```bash
geth --ropsten \
  --datadir /blockchain/ethereum/data --datadir.minfreedisk 1024 \
  --cache 128 --syncmode "light" \
  --http --http.addr 0.0.0.0 --http.port 8545 \
  --metrics --metrics.addr 0.0.0.0 --metrics.port 6060
```

If everything goes okay, you can stop the process, and remove the ropsten testnet blockchain and state databases:

```bash
geth --ropsten removedb
```

Create the systemd unit file in `/etc/systemd/system/geth.service`:

```
[Unit]
Description=Geth Node
After=network.target auditd.service
Wants=network.target

[Service]
WorkingDirectory=/home/ubuntu
ExecStart=/usr/local/geth/current/bin/geth \
  --ropsten \
  --datadir /blockchain/ethereum/data \
  --datadir.minfreedisk 1024 \
  --cache 128 \
  --syncmode "light" \
  --http --http.addr 0.0.0.0 --http.port 8545 \
  --http.api "admin,db,debug,eth,miner,net,personal,txpool,web3" \
  --http.corsdomain "*" \
  --metrics --metrics.addr 0.0.0.0 --metrics.port 6060 \
  --whitelist 10920274=0xfd652086d220d506ae5b7cb80fde97d2f3f7028d346cc7d9d384a83d3d638532
User=ubuntu
Group=ubuntu
Restart=on-failure
RestartSec=120s
KillMode=process
KillSignal=SIGINT
TimeoutStopSec=600

[Install]
WantedBy=multi-user.target
Alias=geth.service
```

The values such as `--whitelist` can be retrieved from [this issue](https://github.com/ethereum/go-ethereum/issues/23546) or [this post](https://www.linkedin.com/pulse/how-mine-ropsten-testnet-ether-keir-finlow-bates/) and extracted from the post:

> "due to the London upgrade you'll probably end up on the chain that isn't tracked by Etherscan and Metamask. To ensure you only retrieve blocks from peers on that chain, include the following string in your geth start command"

Since we created a new systemd unit file, reload the systemd daemon:

```bash
sudo systemctl daemon-reload
```

Enable and start geth:

```bash
sudo systemctl enable geth
sudo systemctl restart geth
```

You can tail the logs to ensure everything runs as it should:

```bash
sudo journalctl -fu geth
```

## API

Following the [JSON-RPC](https://eth.wiki/json-rpc/API) documentation, create your account:

```bash
curl -H "Content-Type: application/json" -XPOST http://localhost:8545/ -d '{"jsonrpc":"2.0","method":"personal_newAccount","params":["password"],"id":1}'
```

The response should provide your ropsten testnet address:

```json
{"jsonrpc":"2.0","id":1,"result":"0x2b1718cdf7dbcc381267ccf43d320c6e194d6aa8"}
```

We can list all our ethereum addresses by calling the [eth_accounts](https://eth.wiki/json-rpc/API#eth_accounts) method:

```bash
curl -H "Content-Type: application/json" -XPOST http://localhost:8545/ -d '{"jsonrpc":"2.0","method":"eth_accounts","params":[],"id":1}'
```

We can then check our balance with [eth_getbalance](https://eth.wiki/json-rpc/API#eth_getbalance), where we pass the ethereum address which is in hex format, followed by the block number, but we will use "latest":

```bash
curl -H "Content-Type: application/json" -XPOST http://localhost:8545/ -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x2b1718cdf7dbcc381267ccf43d320c6e194d6aa8", "latest"],"id":1}'
```

You can use the following faucets to send testnet funds to your account:
- https://faucet.dimensions.network/
- https://faucet.ropsten.be/

After sending funds to your account, we can check our balance again:

```bash
curl -H "Content-Type: application/json" -XPOST http://localhost:8545/ -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x2b1718cdf7dbcc381267ccf43d320c6e194d6aa8", "latest"],"id":1}'
```

And our balances should reflect in our account:

```json
{"jsonrpc":"2.0","id":1,"result":"0x429d069189e0000"}
```

As you can notice the value of our balance for our ethereum address is in hexadecimal format, we can convert it to decimal format:

```bash
echo $((0x429d069189e0000))
300000000000000000
```

We can use python to convert to decimal using the int() function, by passing the hexadecimal value and pass its base to convert it into an integer, the base for hexadecimal is 16:

```python
>>> print(int('0x429d069189e0000', 16))
300000000000000000
```

The decimal value that was returned is the value in [Wei](https://www.investopedia.com/terms/w/wei.asp), and the value of 1 ETH equals to 1,000,000,000,000,000,000 Wei.

Using [gwei.io](https://gwei.io/) the conversions from 1 ETH are:

```
Wei: 1000000000000000000
Kwei: 1000000000000000
Mwei: 1000000000000
Gwei: 1000000000
Twei: 1000000
Pwei: 1000
ETH: 1
```

So now we can convert our balance from wei to ethereum:

- `your_balance_in_wei / unit_value_of_wei`
- `300000000000000000 / 1000000000000000000`

```
python3 -c "print(300000000000000000 / 1000000000000000000)"
0.3
```

We can use [this](https://eth-converter.com/) converter to make sure my math is correct

To get the current gas price in wei

```bash
curl -H "Content-Type: application/json" -XPOST http://localhost:8545/ -d '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}'{"jsonrpc":"2.0","id":1,"result":"0x73a20d04"}
```

## CLI - [Accounts](https://geth.ethereum.org/docs/interface/managing-your-accounts)

Create a password in `/tmp/pass` then:

```bash
geth --datadir /blockchain/ethereum/data --keystore /blockchain/ethereum/data/keystore account new --password /tmp/.pass

Your new key was generated

Public address of the key:   0x5814D945EC909eb1307be4F133AaAB3dEF3572f0
Path of the secret key file: /blockchain/ethereum/data/keystore/UTC--2021-10-06T15-43-23.679655564Z--5814d945ec909eb1307be4f133aaab3def3572f0

- You can share your public address with anyone. Others need it to interact with you.
- You must NEVER share the secret key with anyone! The key controls access to your funds!
- You must BACKUP your key file! Without the key, it's impossible to access account funds!
- You must REMEMBER your password! Without the password, it's impossible to decrypt the key!
```

Then when you attach your console session, you will be able to see the address that we created:

```
geth attach /blockchain/ethereum/data/geth.ipc
> eth.accounts[0]
"0x5814d945ec909eb1307be4f133aaab3def3572f0"
```

## CLI - Attach

Run the geth console:

```bash
geth attach /blockchain/ethereum/data/geth.ipc
Welcome to the Geth JavaScript console!

instance: Geth/v1.10.13-stable-eae3b194/linux-amd64/go1.17
at block: 11173667 (Wed Oct 06 2021 08:00:44 GMT+0200 (SAST))
 datadir: /blockchain/ethereum/data
 modules: admin:1.0 debug:1.0 eth:1.0 ethash:1.0 les:1.0 net:1.0 personal:1.0 rpc:1.0 txpool:1.0 vflux:1.0 web3:1.0

To exit, press ctrl-d or type exit
> 
```

We can run `net` to show us the peercounts:

```
> net
{
  listening: true,
  peerCount: 1,
  version: "3",
  getListening: function(callback),
  getPeerCount: function(callback),
  getVersion: function(callback)
}
```

Or if we just want to access the peerCount value:

```
> net.peerCount
1
```

To view the peers thats connected:

```
> admin.peers
[{
    caps: ["eth/66", "les/2", "les/3", "les/4", "snap/1"],
    enode: "enode://3b76ec5359e59048721de8b6ff97a064ea280233d37433222ce7efcdac700c987326734983c9b65f8f1914c40e1efd6b43999912a3bca208fcbb540a678db110@93.75.22.22:30308",
    enr: "enr:-KO4QD2mp_FKB4ZDpfOAD_ziVnMXo1Mcd-FQl9Abj__EJKr9As6UE0frpdaiOnWjqzuGLGaabaAkG7e2CvfY8LulI9ENg2V0aMfGhHEZtrOAgmlkgnY0gmlwhF1LFhaDbGVzwQGJc2VjcDI1NmsxoQI7duxTWeWQSHId6Lb_l6Bk6igCM9N0MyIs5-_NrHAMmIRzbmFwwIN0Y3CCdmSDdWRwgnZk",
    id: "a95433e1bcbcc64f5d1ad8bd2535557d1f5ed2191a760f704d42a925656bb8de",
    name: "Geth/v1.10.9-stable-eae3b194/linux-amd64/go1.17",
    network: {
      inbound: false,
      localAddress: "192.168.0.120:55166",
      remoteAddress: "93.75.22.22:30308",
      static: false,
      trusted: false
    },
    protocols: {
      les: {
        difficulty: 35015228630523840,
        head: "1aa1db0e6810f504f1542e8c3c49cecf17b0c3246b41f45bede42723d22b7c0c",
        version: 4
      }
    }
}]
```

Check if the node is syncing:

```
> eth.syncing
{
  currentBlock: 11176044,
  highestBlock: 11176158,
  knownStates: 40043719,
  pulledStates: 39904521,
  startingBlock: 0
}
```

We can view our accounts:

```
> eth.accounts
["0x2b1718cdf7dbcc381267ccf43d320c6e194d6aa8"]
```

And get the balance:

```
> eth.getBalance(eth.accounts[0])
300000000000000000
```

## CLI - SendTransaction

The account that will be receiving the funds (host-a):

```
$ geth attach /blockchain/ethereum/data/geth.ipc
> eth.accounts[0]
"0x2b1718cdf7dbcc381267ccf43d320c6e194d6aa8"
```

It's current balance:

```
> eth.getBalance(eth.accounts[0])
20485608293038927543
```

On the account that we will be sending from (host-b):

```
$ geth attach /blockchain/ethereum/data/geth.ipc
> eth.accounts[0]
"0xd490fb53c0e7d3c80153112a4bd135e2cf897282"
```

It's current balance:

```
> eth.getBalance(eth.accounts[0])
2001712477998186788
```

When we attempt to send 1ETH to the recipient address:

```
> eth.sendTransaction({from: "0xd490fb53c0e7d3c80153112a4bd135e2cf897282", to: "0x2b1718cdf7dbcc381267ccf43d320c6e194d6aa8", value: "1000000000000000000"})
Error: authentication needed: password or unlock
	at web3.js:6357:37(47)
	at web3.js:5091:62(37)
	at <eval>:1:20(10)
```

You will notice that we need to unlock our account first:

```
> web3.personal.unlockAccount(web3.personal.listAccounts[0], null, 60)
Unlock account 0xd490fb53c0e7d3c80153112a4bd135e2cf897282
Passphrase:
true
```

Now we can send the transaction:

```
> eth.sendTransaction({from: "0xd490fb53c0e7d3c80153112a4bd135e2cf897282", to: "0x2b1718cdf7dbcc381267ccf43d320c6e194d6aa8", value: "1000000000000000000"})
"0x4bffabf28b71e6f83a48f0accb850b232dc3f482e30d942be3a2eb53d639d4bd"
```

And the transaction id can be looked up on the ropsten blockexplorer:
- https://ropsten.etherscan.io/tx/0x4bffabf28b71e6f83a48f0accb850b232dc3f482e30d942be3a2eb53d639d4bd

And after the confirmations has been confirmed, we can see in our receiving account, we received the funds:

```
> eth.getBalance(eth.accounts[0])
21485608293038927543
```

## Web3

Run a python environment:

```
docker run -it python:3.8.5-slim bash
```

Install dependencies:

```
apt update
apt install python3-dev gcc -y
pip install web3[tester]
```

The examples I will be following was extracted from the documentation:
- https://ethereum.org/ml/developers/tutorials/a-developers-guide-to-ethereum-part-one/

Instantiate a client and connect to your geth node, [this documentation] provides different methods of connecting, but I will be using the `HTTPProvider` to connect over the network:

```python
>>> from web3 import Web3
>>> w3 = Web3(Web3.HTTPProvider('http://192.168.0.120:8545'))
>>> w3.isConnected()
True
```

List the accounts:

```python3
>>> w3.eth.accounts
['0x2b1718CdF7dBcc381267CCF43D320C6e194D6aa8']
```

Get the balance in Wei:

```python3
>>> account = w3.eth.accounts[0]
>>> w3.eth.get_balance(account)
300000000000000000
```

Convert from Wei to ETH:

```python
>>> balance_wei = w3.eth.get_balance(account)
>>> w3.fromWei(balance_wei, 'ether')
Decimal('0.3')
```

Get the information about the latest block:

```python
>>> w3.eth.get_block('latest')
AttributeDict({'baseFeePerGas': 9, 'difficulty': 2073277081, 'extraData': HexBytes('0x63732e7064782e65647520676574682076312e31302e38'), 'gasLimit': 8000000, 'gasUsed': 3361330, 'hash': HexBytes('0xd06a7a734413bcffa4d56617b7efb9ebd8e684c5fcc7fd4f3ec85b8b809b1a0b'), 'logsBloom': HexBytes('0x00000004080000000001000000000000000000000000000000000000000000860000000000000400000000010000000000000000001000000000000080240000000000000000000000000018000000000000000000040000000000000000000002000000020000000000000000000800000000000000200000000010000000800000000000000002000000020000000040000000000000000001000000000000020800000000000000000000000000000000000000000000000000000000800000004002008000000001000000800000000000000000000000000000000062004010202800004000000000000000000000000040000000000002200000000000'), 'miner': '0xe9e7034AeD5CE7f5b0D281CFE347B8a5c2c53504', 'mixHash': HexBytes('0x42641ef2d13826f9cb070516f81515464af9c5c0a36edaa7c250fec62d18a193'), 'nonce': HexBytes('0x670ce792aed73895'), 'number': 11173874, 'parentHash': HexBytes('0xe26e265b264e5158a46ee213d39150d90b532db061497027f35ad36e98458895'), 'receiptsRoot': HexBytes('0x08c15b7365caa993a3047a3093ae641d5b97c51aff058952ab48a56bdee9240b'), 'sha3Uncles': HexBytes('0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347'), 'size': 16130, 'stateRoot': HexBytes('0x9e2d99e11b4c71b93f14a563a87945c0ed89e577eefc860a7909bd6f3b8e669f'), 'timestamp': 1633502988, 'totalDifficulty': 35015626783987398, 'transactions': [HexBytes('0x9013555031ca4510e619968814b75ff428c595488c46a387a6b57774313f4686'), HexBytes('0x899f3dfa8cc0ce7eac397500a014dd624d50c0024e112fa3989403da5669b838'), HexBytes('0xf0c08c7e6849be5d23e0c603b405012a1baa4252884f8efac3244d3ed77b8622'), HexBytes('0xb6e03e10e0d6ced0a791f3a9474d760d7248301dc489c5b191aa82b1ef23e677'), HexBytes('0xb424a4da501df145346027c9c839ae9bf9a25f3672bf13fe097c39f46eda5028'), HexBytes('0xcb74ac5580485542ca532f5dc46798b84cb26d34ebc127871d6e2ffead6c32c7'), HexBytes('0xb61cf0eb92798885e4a6309d228e8a31e892e4353810593ba14a2737c1fcd53a'), HexBytes('0x20b27640c1b674be98d3051fac5dcf5ae50d5b7e957defc2336f07b99053fb2c'), HexBytes('0x2929a7384e5b47c4e414142623911a2deca95996e761bc10ccedf607342156af'), HexBytes('0x698af438f73bf384b7c35d4448c0e098d7744b4ce58327dc258a3d5706421c7e')], 'transactionsRoot': HexBytes('0x33cca53eabc2aed8cb0c8a5a7b771b9f14fd2e2aa2561195250411f0714ec768'), 'uncles': []})
```

## Mining

Note: `Light clients do not support mining`

From another node, im running the fast sync mode on ropsten:

```
--syncmode "fast"
```

- https://geth.ethereum.org/docs/interface/mining

```bash
> eth.hashrate
43949
```

```
> eth.coinbase
"0x2b1718cdf7dbcc381267ccf43d320c6e194d6aa8"
> eth.getBalance(eth.coinbase).toNumber();
145000000000000000000
```

## Delete Data

If we look at a fully synced ropsten "fast" node:

```bash
du -h /blockchain/ethereum/
4.0K	/blockchain/ethereum/data/keystore
856K	/blockchain/ethereum/data/geth/triecache
58G	/blockchain/ethereum/data/geth/chaindata/ancient
69G	/blockchain/ethereum/data/geth/chaindata
2.2M	/blockchain/ethereum/data/geth/nodes
188M	/blockchain/ethereum/data/geth/ethash
69G	/blockchain/ethereum/data/geth
69G	/blockchain/ethereum/data
69G	/blockchain/ethereum/
```

Remove the data with `removedb`:

```
geth --datadir /blockchain/ethereum/data removedb
INFO [10-06|20:01:52.061] Maximum peer count                       ETH=50 LES=0 total=50
INFO [10-06|20:01:52.061] Smartcard socket not found, disabling    err="stat /run/pcscd/pcscd.comm: no such file or directory"
INFO [10-06|20:01:52.062] Set global gas cap                       cap=50,000,000
Remove full node state database (/blockchain/ethereum/data/geth/chaindata)? [y/n] y
Remove full node state database (/blockchain/ethereum/data/geth/chaindata)? [y/n] y
INFO [10-06|20:01:57.141] Database successfully deleted            path=/blockchain/ethereum/data/geth/chaindata elapsed=2.482s
Remove full node ancient database (/blockchain/ethereum/data/geth/chaindata/ancient)? [y/n] y
Remove full node ancient database (/blockchain/ethereum/data/geth/chaindata/ancient)? [y/n] y
INFO [10-06|20:02:05.645] Database successfully deleted            path=/blockchain/ethereum/data/geth/chaindata/ancient elapsed=589.737ms
INFO [10-06|20:02:05.645] Light node database missing              path=/blockchain/ethereum/data/geth/lightchaindata
```

Now when we list the data directory, we can see the data was removed:

```bash
du -h /blockchain/ethereum/
8.0K	/blockchain/ethereum/data/keystore
868K	/blockchain/ethereum/data/geth/triecache
4.0K	/blockchain/ethereum/data/geth/chaindata/ancient
180K	/blockchain/ethereum/data/geth/chaindata
1.4M	/blockchain/ethereum/data/geth/nodes
188M	/blockchain/ethereum/data/geth/ethash
190M	/blockchain/ethereum/data/geth
190M	/blockchain/ethereum/data
190M	/blockchain/ethereum/
```

## Resources

- [Use web3 in python](https://ethereum.org/ml/developers/tutorials/a-developers-guide-to-ethereum-part-one/)
- [How to mine ropsten testnet](https://www.linkedin.com/pulse/how-mine-ropsten-testnet-ether-keir-finlow-bates)
- [Ethereum JSON RPC on Postman](https://documenter.getpostman.com/view/4117254/ethereum-json-rpc/RVu7CT5J)
- [ETH WIki - JSON RPC](https://eth.wiki/json-rpc/API#personal_newAccount)
- https://gist.github.com/swaldman/e58a866eafc4ff043c4099e394901a1e
- [Run Geth on a Raspberry Pi - ethereum.org](https://ethereum.org/en/developers/tutorials/run-node-raspberry-pi/)

## Thank You

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.



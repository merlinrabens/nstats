# nstats
Neighbor Health Stats - an IOTA Extension Interface module

This IRI extension (IXI) provides a mechanism for continuously fetching the neighbor's health statistics from your [IRI](https://github.com/iotaledger/iri) node.

## What it Does
The extension fetches every 3 seconds the no. of transactions that are mutually exchanged between our node and a particular neighbor node. From all values of the last 5 minutes a simple moving average (SMA) get's calculated and displayed when the API call get's triggered.

## Setup
1. Create subfolder `nstats` in your `ixi` folder.
2. Copy package.json and index.js into the new folder.

**or** clone the repository directly in your `ixi` folder by doing the following:

```bash
cd ixi
git clone https://github.com/bluedigits/nstats
```

The hot-plug mechanism should load the IXI module which should be shown in your IRI node log.

```
2017-06-26 23:26:34 [main] INFO  com.iota.iri.IXI - Path: ixi
2017-06-26 23:26:34 [main] INFO  com.iota.iri.IXI - Searching: ixi
2017-06-26 23:26:34 [main] INFO  com.iota.iri.IXI - Path: ixi/nstats
2017-06-26 23:26:34 [main] INFO  com.iota.iri.IXI - Searching: ixi/nstats
2017-06-26 23:26:34 [main] INFO  com.iota.iri.IXI - Path: ixi/nstats/package.json
2017-06-26 23:26:34 [main] INFO  com.iota.iri.IXI - start script: ixi/nstats/package.json
Neighbor stats extension started...
```

## Usage
The nstats.ixi module exposes a new API command `getHealth`. You have to specify an additional `threshold` which will be taken into account for showing up your neighbor's health stats.

```
curl http://localhost:14265 -X POST -H 'Content-Type: application/json' \
-d '{"command": "nstats.getHealth", "threshold": 500}' | python -m json.tool
```

-----

## What else?
Nothing! Have fun!

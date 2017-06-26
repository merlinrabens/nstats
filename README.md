# nstats.ixi
Neighbor Health Stats - an IOTA Extension Interface

This IRI extension (IXI) provides a mechanism on continuously get the neighbor's health statistics out of your [IRI](https://github.com/iotaledger/iri) node.

## Setup

1. Create a subfolder in your `ixi` folder.
2. Copy package.json and index.js into the new folder.

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
curl http://localhost:14265 -X POST -H 'Content-Type: application/json' -d '{"command": "nstats.getHealth", "threshold": 500}' | python -m json.tool
```

-----

## What else?
Nothing! Have fun!

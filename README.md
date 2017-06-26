# nstats.ixi
Neighbor Health Stats - an IOTA Extension Interface

This IRI extension (IXI) provides a mechanism on continuously get the neighbor's health statistics out of your [IRI](https://github.com/iotaledger/iri) node.

## Setup

1. Create a subfolder in your `ixi` folder.
2. Copy package.json and index.js into the new folder.

The hot-plug mechanism should load the IXI module which should be logged in your IRI node log.


## Usage
The nstats.ixi module exposes a new API command `getHealth`. You have to specify an additional `threshold` which will be taken into account for showing up your neighbor's health stats.

```
curl http://localhost:14265 -X POST -H 'Content-Type: application/json'   -d '{"command": "Snapshot.getState"}' | python -m json.tool
```

-----

## What else?
Nothing! Have fun!
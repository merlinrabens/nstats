# nstats
Neighbor Health Stats - an IOTA Extension Interface

This IRI extension (IXI) provides a mechanism for continuously checking health of your [IRI](https://github.com/iotaledger/iri) node's neighbors.

## What it Does
The extension monitors the no. of transactions that are mutually exchanged between your node your neighbor nodes. When a particular neighbor sends not enough transactions anymore (e.g. due to an outage or a network problem), his average transaction rate will fall below a configurable threshold which triggers the automatic removal of this particular neighbor. The removal will remain until the next restart of your IRI node or until you add the removed neighbors by invoking the corresponding API command..

## Setup
Create subfolder `nstats` in your `ixi` folder and copy `package.json` and `index.js` into the new folder.

**or**

clone the repository directly in your `ixi` folder by doing the following:

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

## Example

If you're utilizing the *getHealth* command you might get a response similiar to the following:

```json
{
    "duration": 1,
    "ixi": [
        {
            "address": "example_neighbor/1.2.3.4:12345",
            "allTxsSma": "0",
            "health": "BAD"
        }
    ]
}
```

This would mean, the health of your neighbor **example_neighbor** became bad, hence it's going to be removed from your neighbor list during the next check cycle (interval depends on your **timeInterval** setting). Then, you will see the following output in your log:

```
Health of neighbor 'example_neighbor/1.2.3.4:12345' became BAD. Going to remove...
Successfully removed neighbor 'example_neighbor/1.2.3.4:12345'.
```

## Usage
The nstats IXI module exposes the following API commands:

*  **getHealth:**

   *Description:* From all values of the last 5 minutes a simple moving average (SMA) get's calculated and displayed when the API call get's triggered.
   
   **Params:** You have to specifiy a `threshold` which states a neighbors health as *BAD* if not reached.
   
   **Sample Call:**

   ```bash
   curl http://localhost:14265 -X POST -H 'Content-Type: application/json' \
   -d '{"command": "nstats.getHealth", "threshold": 1}' | python -m json.tool
   ```

*  *getRemoveThreshold:*

   **Description:** Gets the currently set threshold. 
   
   **Sample Call:**

   ```bash
   curl http://localhost:14265 -X POST -H 'Content-Type: application/json' \
   -d '{"command": "nstats.getRemoveThreshold"}' | python -m json.tool
   ```

*  *setRemoveThreshold:*

   **Description:** Sets a new threshold for the automatic neighbor removal trigger.
   
   **Params:** You have to define a `threshold` > 0.
   
   **Default:** Default `threshold` is 1 if not set specifically.

   **Sample Call:**

   ```bash
   curl http://localhost:14265 -X POST -H 'Content-Type: application/json' \
   -d '{"command": "nstats.setRemoveThreshold", "threshold": 1}' | python -m json.tool
   ```

*  *getRemoveTimeInterval:*

   **Description:** Gets the currently set time interval for checking potentially bad neighbors. Time unit is *milliseconds*.
   
   **Sample Call:**

   ```bash
   curl http://localhost:14265 -X POST -H 'Content-Type: application/json' \
   -d '{"command": "nstats.getRemoveTimeInterval"}' | python -m json.tool
   ```

*  *setRemoveTimeInterval:*

   **Description:** Sets the time interval for checking potentially bad neighbors. Time unit is *milliseconds*.
   
   **Params:** You have to specifiy a `timeInterval` >= 1000 which states a neighbors health as *BAD* if not reached.
   
   **Default:** Default `timeInterval` is 300000 milliseconds if not set specifically.

   **Sample Call:**

   ```bash
   curl http://localhost:14265 -X POST -H 'Content-Type: application/json' \
   -d '{"command": "nstats.setRemoveTimeInterval", "timeInterval": 30000}' | python -m json.tool
   ```

-----

## What else?
Nothing! Have fun!

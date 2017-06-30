var iri = com.iota.iri;
var Callable = iri.service.CallableRequest;
var Response = iri.service.dto.IXIResponse;
var Error = iri.service.dto.ErrorResponse;
var Timer = Java.type("java.util.Timer");
var URI = Java.type("java.net.URI");
var TCPNeighbor = Java.type("com.iota.iri.network.TCPNeighbor");
var iota = iri.IRI.iota;

print("Neighbor stats extension started... ");

var globalRemoveThreshold = 1;
var globalRemoveTimeInterval = 300000;

var nbAllTxs = {};
var knownNeighbors = getNeighbors();

var calcNbHealthTimer = null;
var removeNbTimer = null;

function logSettings() {
  print("NSTATS: Remove neighbors sending less than " + globalRemoveThreshold + " transactions all 3 seconds on average. Removing neighbors will be triggered all " + globalRemoveTimeInterval + " milliseconds.");
}

function initCalcNbHealthTimer(reset) {
  if (reset && calcNbHealthTimer != null) {
    calcNbHealthTimer.cancel();
  }
  calcNbHealthTimer = new Timer();
  calcNbHealthTimer.scheduleAtFixedRate(function() {
    getNeighbors().stream().forEach(function (nb) {
      normalizeRingBuffer(nb);
    });
  }, 0, 3000);
}

function initRemoveNbTimer(reset) {
  if (reset && removeNbTimer != null) {
    removeNbTimer.cancel();
  }
  removeNbTimer = new Timer();
  removeNbTimer.scheduleAtFixedRate(function() {
    getNeighbors().stream().forEach(function (nb) {
      if (!knownNeighbors.contains(nb)) {
        knownNeighbors.add(nb);
      } else {
        if (nbAllTxs[nb] != null) {
          var sma = calcSma(nbAllTxs[nb]);
            if (Math.floor(sma).toFixed() < globalRemoveThreshold) {
              removeNeighbor(nb);
            }
          }
        }
    });
  }, 0, globalRemoveTimeInterval);
}

function normalizeRingBuffer(neighbor) {
  var queue = nbAllTxs[neighbor];
  if (queue == null) {
    queue = [];
    queue.start = neighbor.getNumberOfAllTransactions();
  }
  var lastIndex = queue.length - 1;
  if (lastIndex >= 99) {
    queue.start += queue.shift();
  }
  queue.push(neighbor.getNumberOfAllTransactions() - queue.start - sum(queue));
  nbAllTxs[neighbor] = queue;
}

function getNeighbors() {
 return iota.node.getNeighbors();
}

function removeNeighbor(neighbor) {
  var protocol = neighbor instanceof TCPNeighbor ? "tcp://" : "udp://";
  var port = neighbor.getAddress().getPort();
  var nbUri = new URI(protocol + neighbor.getAddress().getHostName() + ":" + port);
  print("Health of neighbor '" + neighbor.getAddress().toString() + "' became BAD. Going to remove... ");
  var success = iota.node.removeNeighbor(nbUri, true);
  if (success) {
    delete nbAllTxs[neighbor];
    knownNeighbors.remove(neighbor);
    print("Successfully removed neighbor '" + neighbor.getAddress().toString() + "'.");
  } else {
    print("Attempt to remove neighbor '" + neighbor.getAddress().toString() + "' failed.");
  }
}

function calcSma(array) {
  return sum(array) / array.length;
}

function sum(array) {
  return array.reduce(function(a, b) { return a + b; }, 0);
}

function getRemoveThreshold() {
  return Response.create("Threshold is currently set to " + globalRemoveThreshold + " transactions.");
}

function setRemoveThreshold(request) {
  var threshold;
  threshold = request.get("threshold");
  if (threshold == null || Number(threshold) < 1) {
    return Error.create("You have to define a `threshold` > 0");
  }
  globalRemoveThreshold = threshold;
  initCalcNbHealthTimer(true);
  logSettings();
  return Response.create("Threshold successfully set to " + threshold + " transactions.");
}

function getRemoveTimeInterval() {
  return Response.create("Time interval for removing BAD neighbors is currently set to " + globalRemoveTimeInterval + " milliseconds.");
}

function setRemoveTimeInterval(request) {
  var timeInterval;
  timeInterval = request.get("timeInterval");
  if (timeInterval == null || Number(timeInterval) < 1000) {
    return Error.create("You have to define a `timeInterval` >= 1000");
  }
  globalRemoveTimeInterval = timeInterval;
  initRemoveNbTimer(true);
  logSettings();
  return Response.create("Time interval for removing BAD neighbors successfully set to " + globalRemoveTimeInterval + " milliseconds.");
}

function getHealth(request) {
  var threshold;
  threshold = request.get("threshold");
  if (threshold == null || Number(threshold) < 1) {
    return Error.create("You have to define a `threshold` > 0");
  }
  var out = getNeighbors().stream().map(function (nb) {
    var sma = calcSma(nbAllTxs[nb]);
    res = {
      address: nb.getAddress().toString(),
      health: sma > threshold ? "GOOD" : "BAD",
      allTxsSma: Math.floor(sma).toFixed()
    }
    return res;
  }).toArray();
  if (out == null || out.length == 0) {
    return Error.create("No neighbors found.");
  }
  return Response.create(out);
}

API.put("getHealth", new Callable({ call: getHealth }));
API.put("getRemoveThreshold", new Callable({ call: getRemoveThreshold }));
API.put("setRemoveThreshold", new Callable({ call: setRemoveThreshold }));
API.put("getRemoveTimeInterval", new Callable({ call: getRemoveTimeInterval }));
API.put("setRemoveTimeInterval", new Callable({ call: setRemoveTimeInterval }));

initCalcNbHealthTimer(false);
initRemoveNbTimer(false);
logSettings();

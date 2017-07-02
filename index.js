var iri = com.iota.iri;
var Callable = iri.service.CallableRequest;
var Response = iri.service.dto.IXIResponse;
var Error = iri.service.dto.ErrorResponse;
var Timer = Java.type("java.util.Timer");
var URI = Java.type("java.net.URI");
var InetAddress = Java.type("java.net.InetAddress");
var Runnable = Java.type("java.lang.Runnable");
var TCPNeighbor = Java.type("com.iota.iri.network.TCPNeighbor");

print("Neighbor stats extension started... ");

var globalRemoveThreshold = 1;
var globalRemoveTimeInterval = 300000;

var nbAllTxs = {};
var pendingNeighbors = {};

var calcNbHealthTimer;
var removeNbTimer;
var checkPendingNeighborsTimer;

function logSettings() {
  print("NSTATS: Checking for BAD neighbors every " + globalRemoveTimeInterval + " milliseconds. Threshold: At least " + globalRemoveThreshold + " transaction(s) on average every 3 seconds.");
}

function initCalcNbHealthTimer(reset) {
  if (reset && calcNbHealthTimer != undefined) {
    calcNbHealthTimer.cancel();
  }
  calcNbHealthTimer = new Timer();
  calcNbHealthTimer.schedule(function() {
    getNeighbors().stream().forEach(function (nb) {
      normalizeRingBuffer(nb);
    });
  }, 0, 3000);
}

function initRemoveNbTimer(reset) {
  if (reset && removeNbTimer != undefined) {
    removeNbTimer.cancel();
  }
  removeNbTimer = new Timer();
  removeNbTimer.schedule(function() {
    getNeighbors().stream().forEach(function (nb) {
      if (nbAllTxs[nb] != null) {
        var sma = calcSma(nbAllTxs[nb]);
        var timeDiff = Date.now() - nbAllTxs[nb].startTime;
        if (Math.floor(sma).toFixed() < globalRemoveThreshold && timeDiff >= globalRemoveTimeInterval) {
          removeNeighbor(nb);
        }
      }
    });
  }, 0, globalRemoveTimeInterval);
}

function initCheckPendingNeighborsTimer() {
  checkPendingNeighborsTimer = new Timer();
  checkPendingNeighborsTimer.schedule(function() {
    for (var nb in pendingNeighbors) {
      checkNeighbor(nb);
    }
  }, 0, 10000);
}

function checkNeighbor(nb) {
  if (isNeighborAvailable(nb)) {
    print("NSTATS: Neighbor '" + pendingNeighbors[nb].address + "' seems to be available again. Going to add... ");
    var success = IOTA.node.addNeighbor(pendingNeighbors[nb].neighbor);
    if (success) {
      print("NSTATS: Successfully added neighbor '" + pendingNeighbors[nb].address + "'.");
      delete pendingNeighbors[nb];
    } else {
      print("NSTATS: Attempt to add neighbor '" + pendingNeighbors[nb].address + "' failed.");
      pendingNeighbors[nb].retries += 1;
    }
  } else {
    pendingNeighbors[nb].retries += 1;
  }
  if (pendingNeighbors[nb] != undefined && pendingNeighbors[nb].retries >= 8640) {
    delete pendingNeighbors[nb];
  }
}

function normalizeRingBuffer(neighbor) {
  var queue = nbAllTxs[neighbor];
  if (queue == null) {
    queue = [];
    queue.startTime = Date.now();
    queue.noOfAllTxs = neighbor.getNumberOfAllTransactions();
  }
  var lastIndex = queue.length - 1;
  if (lastIndex >= 99) {
    queue.noOfAllTxs += queue.shift();
  }
  queue.push(neighbor.getNumberOfAllTransactions() - queue.noOfAllTxs - sum(queue));
  nbAllTxs[neighbor] = queue;
}

function removeNeighbor(neighbor) {
  var nbUri = getNeighborUri(neighbor);
  print("NSTATS: Health of neighbor '" + neighbor.getAddress().toString() + "' became BAD. Going to remove... ");
  var success = IOTA.node.removeNeighbor(nbUri, true);
  if (success) {
    delete nbAllTxs[neighbor];
    var nbData = [];
    nbData.retries = 0;
    nbData.address = neighbor.getAddress().toString();
    nbData.host = neighbor.getHostAddress();
    nbData.port = neighbor.getPort();
    nbData.neighbor = neighbor;
    nbData.push(neighbor);
    pendingNeighbors[neighbor] = nbData;
    print("NSTATS: Successfully removed neighbor '" + neighbor.getAddress().toString() + "'.");
  } else {
    print("NSTATS: Attempt to remove neighbor '" + neighbor.getAddress().toString() + "' failed.");
  }
}

function getNeighborUri(neighbor) {
  var protocol = neighbor instanceof TCPNeighbor ? "tcp://" : "udp://";
  var port = neighbor.getAddress().getPort();
  return new URI(protocol + neighbor.getAddress().getHostName() + ":" + port);
}

function getNeighbors() {
 return IOTA.node.getNeighbors();
}

function calcSma(array) {
  return sum(array) / array.length;
}

function sum(array) {
  return array.reduce(function(a, b) { return a + b; }, 0);
}

function isNeighborAvailable(nb) {
  try {
    InetAddress.getByName(pendingNeighbors[nb].host).isReachable(3000);
    return true;
  } catch (err) {
    print("NSTATS: Could not check availability of " + pendingNeighbors[nb].host + ". Error: " + err);
    return false;
  }
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
initCheckPendingNeighborsTimer();
IXICycle.put("shutdown", new Runnable( function() {
  if (calcNbHealthTimer != undefined) {
        calcNbHealthTimer.cancel();
        calcNbHealthTimer.purge();
  }
  if (removeNbTimer != undefined) {
        removeNbTimer.cancel();
        removeNbTimer.purge();
  }
  if (checkPendingNeighborsTimer != undefined) {
        checkPendingNeighborsTimer.cancel();
        checkPendingNeighborsTimer.purge();
  }
}));
logSettings();

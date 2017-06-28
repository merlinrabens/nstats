var iri = com.iota.iri;
var Callable = iri.service.CallableRequest;
var Response = iri.service.dto.IXIResponse;
var Error = iri.service.dto.ErrorResponse;
var Timer = Java.type("java.util.Timer");
var iota = iri.IRI.iota;

print("Neighbor stats extension started... ");

var nbAllTxs = {};

var timer = new Timer();
timer.scheduleAtFixedRate(function() {
  getNeighbors().stream().forEach(function (nb) {
    var queue = nbAllTxs[nb.getAddress().toString()];
    var lastVal = 0;
    if (queue == null) {
      queue = [];
    }
    var lastIndex = queue.length - 1;
    if (lastIndex >= 99) {
      queue.shift();
    }
    if (lastIndex < 0) {
      queue.push(nb.getNumberOfAllTransactions());
    } else {
      queue.push(nb.getNumberOfAllTransactions() - sum(queue));
    }
    nbAllTxs[nb.getAddress().toString()] = queue;
  });
}, 0, 3000);

function getNeighbors() {
 return iota.node.getNeighbors();
}

function calcSma(array) {
  return sum(array) / array.length;
}

function sum(array) {
  return array.reduce(function(a, b) { return a + b; }, 0);
}

function getHealth(request) {
  var threshold;
  threshold = request.get("threshold");
  if (threshold == null || Number(threshold) < 1) {
    return Error.create("You have to define a `threshold` > 0");
  }	
  var out = getNeighbors().stream().map(function (nb) {
    var sma = calcSma(nbAllTxs[nb.getAddress().toString()]);
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

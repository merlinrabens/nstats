var iri = com.iota.iri;
var Callable = iri.service.CallableRequest;
var Response = iri.service.dto.IXIResponse;
var Error = iri.service.dto.ErrorResponse;
var Timer = Java.type("java.util.Timer");
var iota = iri.IRI.iota;

print("Neighbor stats extension started... ");

var nbRandomTxs = {};

var timer = new Timer();
timer.scheduleAtFixedRate(function() {
  getNeighbors().stream().forEach(function (nb) {
	var queue = nbRandomTxs[nb.getAddress().toString()];
	if (queue == null) {
		queue = [];
	}
	if (queue.length >= 100) {
		queue.shift();
	}
	queue.push(nb.getNumberOfRandomTransactionRequests());
	nbRandomTxs[nb.getAddress().toString()] = queue;
  });
}, 0, 3000);

function getNeighbors() {
 return iota.node.getNeighbors();
}

function calcSma(array) {
  var sum = array.reduce(function(a, b) { return a + b; }, 0);
  return sum / array.length;
}

function getHealth(request) {
  var threshold;
  threshold = request.get("threshold");
  if (threshold == null || Number(threshold) < 1) {
    return Error.create("You have to define a `threshold` > 0");
  }	
  var out = getNeighbors().stream().map(function (nb) {
    var sma = calcSma(nbRandomTxs[nb.getAddress().toString()]);
	res = {
      address: nb.getAddress().toString(),
      health: sma > threshold ? "GOOD" : "BAD",
	  randomTxsSma: Math.round(sma)
    }
    return res;
  }).toArray();
  if (out == null || out.length == 0) {
    return Error.create("No neighbors found.");
  }
  return Response.create(out);
}

API.put("getHealth", new Callable({ call: getHealth }));
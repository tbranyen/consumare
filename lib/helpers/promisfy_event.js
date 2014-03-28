const Q = require("q");

/**
 *
 */
function promisfyEvent(context, fn) {
  var deferred = Q.defer();

  // Convert the arguments object to be a valid Array..
  arguments.__proto__ = Array.prototype;

  // Ensure the context is always a value.
  context = context || this;

  // Trigger the function specified and whenever the callback is triggered,
  // notify the promise event..
  context[fn].apply(context, arguments.slice(2).concat(function(err, value) {
    deferred.notify(value);
  }));

  // Once the event has completed, trigger the deferred resolve.
  context[fn].call(context, "end", deferred.resolve);

  return deferred.promise;
}

module.exports = promisfyEvent;

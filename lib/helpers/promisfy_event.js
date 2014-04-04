const Q = require("q");

/**
 * Converts a Node event emitter into a Promise.
 *
 * @param {object} context - The object containing the function.
 * @param {function} fn - The function to wrap.
 *
 * @return {object} promise - Will terminate on end.
 */
function promisfyEvent(context, fn) {
  var deferred = Q.defer();

  // Convert the arguments object to be an Array.
  arguments.__proto__ = Array.prototype;

  // Ensure the context is always a value.
  context = context || this;

  // The event listener method.
  var eventListener = context[fn];

  // The first two arguments are reserved for context and function.  Any
  // additional arguments are passed along to the invoked method.
  var args = arguments.slice(2).concat(deferred.notify);

  // Trigger the function specified and whenever the callback is triggered,
  // notify the promise event.
  eventListener.apply(context, args);

  // Once the event has completed, trigger the deferred resolve.
  context[fn].call(context, "end", deferred.resolve);

  // Initiate the event.
  context.start();

  return deferred.promise;
}

module.exports = promisfyEvent;

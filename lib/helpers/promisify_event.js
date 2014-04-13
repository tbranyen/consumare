const assert = require("assert");
const Q = require("q");

/**
 * Converts a Node event emitter into a Promise.
 *
 * @param {object} emitter - The EventEmitter instance.
 * @param {function} eventName - The name of the event to listen on.
 *
 * @return {object} promise - Will terminate on end and emit progress events.
 */
function promisfyEvent(emitter, eventName) {
  assert.ok(emitter, "Missing event emitter.");

  var deferred = Q.defer();

  // Convert the arguments object to be an Array.
  arguments.__proto__ = Array.prototype;

  // Trigger the function specified and whenever the callback is triggered,
  // notifying the promise event.
  if (eventName) {
    emitter.on.apply(emitter, arguments.slice(1).concat(deferred.notify));
  }

  // Once the event has completed, trigger the deferred resolve.
  emitter.on("end", deferred.resolve);

  return deferred.promise;
}

module.exports = promisfyEvent;

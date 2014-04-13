const assert = require("assert");
const EventEmitter = require("events").EventEmitter;
const path = libpath + "helpers/promisify_event";

describe("Promisify Event", function() {
  afterEach(function() {
    delete require.cache[require.resolve(path)];
  });

  it("is a function", function() {
    var promisifyEvent = require(path);

    assert.ok(typeof promisifyEvent === "function");
  });

  it("can proxy an end event", function(done) {
    var promisifyEvent = require(path);
    var event = new EventEmitter();
    var promise = promisifyEvent(event);

    promise.then(function(value) {
      assert.ok(value);
    }).fin(done);

    event.emit("end", true);
  });

  it("can proxy event progress", function(done) {
    var promisifyEvent = require(path);
    var event = new EventEmitter();
    var promise = promisifyEvent(event, "add");
    var total = 0;

    promise.progress(function(value) {
      total += value;
    }).then(function() {
      assert.equal(total, 5);
    }).fin(done);

    event.emit("add", 1);
    event.emit("add", 2);
    event.emit("add", 3);

    event.emit("end", true);
  });
});

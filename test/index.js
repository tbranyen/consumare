var assert = require("assert");
var pkg = require("../package.json");

describe("Consumare", function() {
  afterEach(function() {
    delete require.cache[require.resolve("../")];
  });

  it("can be required", function() {
    var consumare = require("../");

    assert.equal(consumare.VERSION, pkg.version);
  });
});

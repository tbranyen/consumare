const assert = require("assert");
const path = require("path");
const pkg = require("../../package.json");
const fixtures = require("./helpers/fixtures");

describe("Consumare", function() {
  before(fixtures.setup);
  after(fixtures.teardown);

  afterEach(function() {
    delete require.cache[require.resolve(libpath + "index")];
    delete require.cache[require.resolve(libpath + "storage")];
  });

  it("exports the correct version", function() {
    var consumare = require(libpath + "index");

    assert.equal(consumare.VERSION, pkg.version);
  });

  it("exposes the API contract", function() {
    var consumare = require(libpath + "index");

    assert.ok(typeof consumare.configure === "function");
    assert.ok(typeof consumare.parse === "function");
    assert.ok(typeof consumare.meta === "function");
    assert.ok(typeof consumare.assemble === "function");
  });

  it("can correctly configure repo location and branch name", function() {
    var consumare = require(libpath + "index");
    var storage = require(libpath + "storage");

    var cwd = path.join(__dirname, "../");

    consumare.configure(cwd, {
      content: {
        repo: "test-repo",
        branch: "master"
      }
    });
    
    assert.equal(storage.opts.path, path.join(cwd, "test-repo"));
    assert.equal(storage.opts.branch, "master");
  });

  it("will default to master branch if omitted", function() {
    var consumare = require(libpath + "index");
    var storage = require(libpath + "storage");

    var cwd = path.join(__dirname, "../");

    consumare.configure(cwd, {
      content: {
        repo: "test-repo"
      }
    });
    
    assert.equal(storage.opts.path, path.join(cwd, "test-repo"));
    assert.equal(storage.opts.branch, "master");
  });
});

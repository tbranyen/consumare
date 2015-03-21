const assert = require("assert");
const path = require("path");
const fixtures = require("./helpers/fixtures");

describe("Storage", function() {
  before(fixtures.setup);
  after(fixtures.teardown);

  afterEach(function() {
    delete require.cache[require.resolve(libpath + "index")];
    delete require.cache[require.resolve(libpath + "storage")];
  });

  var consumare = require(libpath + "index");
  var storage = require(libpath + "storage");
  var cwd = path.join(__dirname, "../fixtures/");

  consumare.configure(cwd, {
    content: {
      repo: "test-repo",
      branch: "master"
    }
  });

  describe("file", function() {
    it("can get head contents", function() {
      return storage.file("README.md").then(function(file) {
        assert.equal(file[0],
          "Consumare Test Fixture\n======================\n\n- Contains commits that will assist testing.\n");
      });
    });

    it("can get specific commit contents", function() {
      var sha = "edd209ddc98dce035b05411fb103c2cb4cf7ddff";

      return storage.file("README.md", sha).then(function(file) {
        assert.equal(file[0], "Initial commit\n");
      });
    });
  });

  describe("history", function() {
    before(function() {
      var test = this;

      return storage.history("README.md").then(function(revs) {
        test.revs = revs;
      });
    });

    it("can iterate all history for a file", function() {
      var revs = this.revs;

      assert.equal(revs[0].sha(), "5fe36b33456706d5e696d78adf6526b42d03c869");
      assert.equal(revs[1].sha(), "edd209ddc98dce035b05411fb103c2cb4cf7ddff");
    });
  });
});

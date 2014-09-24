const repo = require("nodegit").Repository;
const rimraf = require("rimraf");
const path = require("path");

// Absolute path to fixtures directory.
var fixtures = path.join(__dirname, "../../fixtures/");

/**
 * Initial test fixture directories.
 *
 * @param {Function} done - Callback function indicating completion.
 */
exports.setup = function() {
  return repo.init(path.join(fixtures, "test-repo"), 1);
};

/**
 * Remove the fixtures directory.
 *
 * @param {Function} done - Callback function indicating completion.
 */
exports.teardown = function(done) {
  rimraf(fixtures, done);
};

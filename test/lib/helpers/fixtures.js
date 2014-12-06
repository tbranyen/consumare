const rimraf = require("rimraf");
const path = require("path");
const NodeGit = require("nodegit");
const repo = NodeGit.Repository;
const clone = NodeGit.Clone;

// Absolute path to fixtures directory.
var fixtures = path.join(__dirname, "../../fixtures/");
var testURL = "https://github.com/tbranyen/consumare-test.git";

/**
 * Initial test fixture directories.
 *
 * @param {Function} done - Callback function indicating completion.
 */
exports.setup = function() {
  var testPath = path.join(fixtures, "test-repo");
  return clone.clone(testURL, testPath, { ignoreCertErrors: 1 });
};

/**
 * Remove the fixtures directory.
 *
 * @param {Function} done - Callback function indicating completion.
 */
exports.teardown = function(done) {
  rimraf(fixtures, done);
};

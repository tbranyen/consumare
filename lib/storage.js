const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");
const NodeGit = require("nodegit");
const promisifyEvent = require("./helpers/promisify_event");

Promise.promisifyAll(fs);

/**
 * Globally configured options.
 * @type {object}
 */
exports.opts = {};

/**
 * file
 *
 * @param filePath
 * @param sha
 * @return
 */
exports.file = function(filePath, sha) {
  var opts = this.opts;

  // Convert to a Bluebird promise to access the `spread` method.
  return NodeGit.Repository.open(opts.path).then(function(repo) {
    // Commits will override branches.
    var method = sha ? "getCommit" : "getBranchCommit";

    // If a commit was specified use that revision, otherwise default to
    // branch.
    return repo[method](sha || opts.branch).then(function(commit) {
      // Look up this specific file in the given commit/branch.
      return commit.getEntry(filePath);
    }).then(function(tree) {
      // Read in the file's content.
      return tree.getBlob();
    }).then(function(blob) {
      var joinedPath = path.join(opts.path, filePath);

      // If a revision was passed resolve from Git contents.
      if (sha) {
        return [String(blob), filePath];
      }

      // Otherwise, use the filesystem.
      return fs.readFileAsync(joinedPath).then(function(contents) {
        // If the file system contents diff from the
        return [String(contents), filePath];
      });
    }).catch(function(err) {
      console.log(err);
      var joinedPath = path.join(opts.path, filePath);

      // Attempt to load from filesystem if unable to find in Git.
      return fs.readFileAsync(joinedPath).then(function(contents) {
        // No revisions when pulling from FS.
        return [String(contents), filePath];
      });
    });
  })

  .then(function(file) {
    var filePath = file[1];

    return exports.history(filePath).then(function(revs) {
      return [file[0], revs, filePath];
    });
  })

  // If any errors occur, display them.
  .catch(function(err) {
    console.error(err, err.stack);
  });
};

/**
 * history
 *
 * @param filePath
 * @return
 */
exports.history = function(filePath) {
  var opts = this.opts;

  return NodeGit.Repository.open(opts.path)
    .then(function(repo) {
      return repo.getBranchCommit(opts.branch);
    })
    .then(function(commit) {
      var shas = [];
      var entryShas = [];
      var history = commit.history();
      var walkHistory = promisifyEvent(history, "commit");

      walkHistory.progress(function(commit) {
        // Find stats on the commit diffs.
        //var diffStats = commit.getDiff().then(function(diffList) {
        //  var stats = {
        //    added: 0,
        //    deleted: 0,
        //    modified: 0
        //  };

        //  var numDeltasOfType = DiffList.numDeltasOfType;

        //  // FIXME

        //  //for (var i = 0; i < diffList.length; i++) {
        //  //  stats.added += numDeltasOfType(diffList[i], DiffList.Delta.Added);
        //  //  stats.deleted += numDeltasOfType(diffList[i], DiffList.Delta.Deleted);
        //  //  stats.modified += numDeltasOfType(diffList[i], DiffList.Delta.Modified);
        //  //}

        //  return stats;
        //});
        var diffStats = {
          added: 0,
          deleted: 0,
          modified: 0
        };

        return Promise.all([
          commit.getTree(),
          diffStats
        ]).spread(function(tree, diffStats) {
          var walk = tree.walk();
          var walkTree = promisifyEvent(walk, "entry");

          walkTree.progress(function(entry) {
            var path = entry.path();
            var sha = entry.sha();

            if (path === filePath && entryShas.indexOf(sha) === -1) {
              entryShas.push(sha);
              shas.push({
                sha: commit.sha(),
                stats: diffStats
              });
            }
          });

          // Start walking the tree.
          walk.start();

          return walkTree.then(function() {
            return shas;
          });
        });
      });

      // Start walking the history.
      history.start();

      return walkHistory.then(function() {
        return shas;
      });
    })
    .catch(function(err) {
      console.warn(err, err.stack);
    });
};

exports.use = function(path, branch) {
  this.opts.path = path;
  this.opts.branch = branch;
};

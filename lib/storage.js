const fs = require("fs");
const Promise = require("bluebird");
const Repo = require("nodegit").Repository;
const DiffList = require("nodegit").Diff;
const promisifyEvent = require("./helpers/promisify_event");

Promise.promisifyAll(fs);

/**
 * Globally configured options.
 * @type {object}
 */
exports.opts = {};

exports.file = function(filePath, rev) {
  var opts = this.opts;
  var openPromise = Repo.open(opts.path);

  // Convert to a Bluebird promise to access the `spread` method.
  return Promise.resolve(openPromise).then(function(repo) {
    // Commits will override branches.
    var method = rev ? "getCommit" : "getBranch";
    var methodPromise = repo[method](rev || opts.branch);

    // If a commit was specified use that revision, otherwise default to
    // branch.
    return Promise.resolve(methodPromise).then(function(commit) {
      return Promise.all([
        // Look up this specific file in the given commit/branch.
        commit.getEntry(filePath),

        // Get the file diffs.
        commit.getDiff(),

        // Pass along the commit.
        commit
      ]);
    }).spread(function(tree, diffList, commit) {
      // Read in the file's content.
      return tree.getBlob();
    }).spread(function(blob) {
      var path = opts.path + filePath;

      // If a revision was passed resolve from Git contents.
      if (rev) {
        return [String(blob), filePath];
      }

      // Otherwise, use the filesystem.
      return fs.readFileAsync(path).then(function(contents) {
        // If the file system contents diff from the
        return [String(contents), filePath];
      });
    }).catch(function(err) {
      var path = opts.path + filePath;

      // Attempt to load from filesystem if unable to find in Git.
      return fs.readFileAsync(path).then(function(contents) {
        // No revisions when pulling from FS.
        return [String(contents), filePath];
      });
    });
  })

  .spread(function(contents, filePath) {
    return exports.history(filePath).then(function(revs) {
      return [contents, revs, filePath];
    });
  })

  // If any errors occur, display them.
  .catch(function(err) {
    console.error(err, err.stack);
  });
};

exports.history = function(filePath) {
  var opts = this.opts;

  return Repo.open(opts.path).then(function(repo) {
    return repo.getBranch(opts.branch).then(function(branch) {
      var shas = [];
      var entryShas = [];
      var history = branch.history();
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
    });
  }).catch(function(err) {
    console.warn(err, err.stack);
  });
};

exports.use = function(path, branch) {
  this.opts.path = path;
  this.opts.branch = branch;
};

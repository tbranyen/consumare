const fs = require("fs");
const Q = require("q");
const Repo = require("nodegit").Repo;
const DiffList = require("nodegit").DiffList;
const promisfyEvent = require("./helpers/promisfy_event");

exports.opts = {};

exports.file = function(filePath, rev) {
  var opts = this.opts;

  return Q.ninvoke(Repo, "open", opts.path).then(function(repo) {
    // Commits will override branches.
    var method = rev ? "getCommit" : "getBranch";

    // If a commit was specified use that revision, otherwise default to
    // branch.
    return Q.ninvoke(repo, method, rev || opts.branch).then(function(commit) {
      return Q.all([
        // Look up this specific file in the given commit/branch.
        Q.ninvoke(commit, "getEntry", filePath),
        // Get the file diffs.
        Q.ninvoke(commit, "getDiff"),
        // Pass along the commit.
        commit
      ]);
    }).spread(function(tree, diffList, commit) {
      // Read in the file's content.
      return Q.all([Q.ninvoke(tree, "getBlob")]);
    }).spread(function(blob) {
      var path = opts.path + filePath;

      // If a revision was passed resolve from Git contents.
      if (rev) {
        return [String(blob), filePath];
      }

      // Otherwise, use the filesystem.
      return Q.ninvoke(fs, "readFile", path).then(function(contents) {
        // If the file system contents diff from the 
        return [String(contents), filePath];
      });
    }).fail(function(err) {
      var path = opts.path + filePath;

      // Attempt to load from filesystem if unable to find in Git.
      return Q.ninvoke(fs, "readFile", path).then(function(contents) {
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
  .fail(function(err) {
    console.error(err, err.stack);
  });
};

exports.history = function(filePath) {
  var opts = this.opts;

  return Q.ninvoke(Repo, "open", opts.path).then(function(repo) {
    return Q.ninvoke(repo, "getBranch", opts.branch).then(function(branch) {
      var shas = [];
      var entryShas = [];
      var walkHistory = promisfyEvent(branch.history(), "on", "commit");

      walkHistory.progress(function(commit) {
        // Find stats on the commit diffs.
        var diffStats = Q.ninvoke(commit, "getDiff").then(function(diffList) {
          var stats = {
            added: 0,
            deleted: 0,
            modified: 0
          };

          var numDeltasOfType = DiffList.numDeltasOfType;

          for (var i = 0; i < diffList.length; i++) {
            stats.added += numDeltasOfType(diffList[i], DiffList.Delta.Added);
            stats.deleted += numDeltasOfType(diffList[i], DiffList.Delta.Deleted);
            stats.modified += numDeltasOfType(diffList[i], DiffList.Delta.Modified);
          }

          return stats;
        });

        return Q.spread([
          Q.ninvoke(commit, "getTree"),
          diffStats
        ], function(tree, diffStats) {
          walkTree = promisfyEvent(tree.walk(), "on", "entry");

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

          return walkTree.then(function() {
            return shas;
          });
        });
      });

      return walkHistory.then(function() {
        return shas;
      });
    });
  }).fail(function(err) {
    console.warn(err, err.stack); 
  });
};

exports.use = function(path, branch) {
  this.opts.path = path;
  this.opts.branch = branch;
};

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const combyne = require("combyne");
const hl = require("highlight.js");
const marked = require("marked");
const storage = require("./storage");
const pkg = require("../package.json");

/**
 * This represents the exported API.
 */
var consumare = {
  /**
   * Expose the current version.
   */
  VERSION: pkg.version,

  /**
   * Set base path and configure the storage engine.
   *
   * @param {string} basePath - The parent location of the Git repository.
   * @param {object} config - Contains repository name and branch name to use. 
   */
  configure: function(basePath, config) {
    assert.ok(basePath != null, "Base path must be specified.")
    assert.ok(config, "Missing configuration argument.");
    assert.ok(config.content, "Missing content in configuration.");
    assert.ok(config.content.repo, "Missing repository in content.");

    var branch = config.content.branch || "master";

    // Configure the storage driver with the configuration settings.
    storage.use(basePath + config.content.repo, branch);
  },

  /**
   * Parse out a file containing metadata and content.
   *
   * @param {string} contents
   * @param {array} revs
   *
   * @return {object} obj containing 
   */
  parse: function(contents, revs) {
    var object = { metadata: {}, contents: "" };
    var docs = contents.split("\n\n");
    var lines = docs[0].split("\n");

    // Iterate over each line 
    lines.forEach(function(line) {
      var parts = line.trim().split(":");

      assert.ok(parts.length > 1, "Invalid key: val.");

      var key = parts[0];
      var val = parts.slice(1).join(":");

      object.metadata[key] = eval("(" + val + ")");
    });

    object.contents = docs.slice(1).join("\n\n");
    object.revs = revs;

    return object;
  },

  // Read in the file path.
  meta: function(filePath, callback) {
    // Once completed, return the parsed document contents.
    storage.file(filePath).then(function(contents) {
      callback(document.parse.apply(document, contents));
    });
  },

  // Take a content file path and render out the content.
  assemble: function(filepath, rev, callback) {
    // Allow argument shifting.
    if (typeof rev === "function") {
      callback = rev;
      rev = undefined;
    }

    // Read in the file path.
    var fileLookup = storage.file("posts/" + filepath + "post.md", rev);

    // Once read in, apply syntax highlighting and render out the template.
    fileLookup.then(function(result) {
      var contents = result[0];
      var revs = result[1];
      var parts = document.parse(contents);
      var tmpl = combyne(parts.contents, parts.metadata);
      var extmap = {
        ".js": "javascript",
        ".php": "php",
        ".lua": "lua",
        ".xml": "xml",
        ".coffee": "coffeescript",
        ".yaml": "coffeescript"
      };

      // Convert scripts to GitHub flavored markdown
      tmpl.registerFilter("render", function(val) {
        var type = val.split(".").pop();
        var codeBlock = "<pre><code>";
        var source = fs.readFileSync("content/posts/" +
          filepath + "assets/" + val).toString();
        var ext = path.extname(val);

        try {
          codeBlock += hl.highlight(extmap[ext] || "text", source).value;
          codeBlock += "</code></pre>";
        } catch (ex) {
          console.warn(val + " was unable to be highlighted");
        }

        return codeBlock;
      });

      callback(marked(tmpl.render()), revs);
    }).fail(function(e) {
      console.log(e.stack);
    });
  }
};

module.exports = consumare;

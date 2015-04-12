const assert = require("assert");
const fs = require("fs");
const path = require("path");
const storage = require("./storage");
const pkg = require("../package.json");
const hl = require("highlight.js");
const marked = require("marked");
const combyne = require("combyne");
const Promise = require("bluebird");

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
   * @param {Object} config - Contains repository name and branch name to use.
   */
  configure: function(basePath, config) {
    assert.ok(basePath != null, "Base path must be specified.")
    assert.ok(config, "Missing configuration argument.");
    assert.ok(config.content, "Missing content in configuration.");
    assert.ok(config.content.repo, "Missing repository in content.");

    // Default to the master branch.
    var branch = config.content.branch || "master";

    // Save the base path and configuration.
    this.basePath = basePath;
    this.config = config;

    // Configure the storage driver with the configuration settings.
    storage.use(basePath + config.content.repo, branch);
  },

  /**
   * Parse out a file containing metadata and content.
   *
   * @param {string} contents - The file to parse for meta data.
   * @param {Array} revs
   * @returns {Object} obj containing
   */
  parse: function(contents, revs) {
    assert.ok(typeof contents === "string", "Contents must be a string.");

    var object = { metadata: {}, contents: "" };
    var docs = contents.split("\n\n");
    var lines = docs[0].split("\n");

    // Iterate over each line
    lines.forEach(function(line) {
      var parts = line.trim().split(":");

      assert.ok(parts.length > 1, "Invalid key: val.");

      var key = parts[0];
      var val = parts.slice(1).join(":");

      try {
      object.metadata[key] = eval("(" + val + ")");
      } catch(unhandledException) {}
    });

    object.contents = docs.slice(1).join("\n\n");
    object.revs = revs;

    return object;
  },

  /**
   * meta
   *
   * @param filePath
   * @return {Promise} Resolved with the parsed document conents.
   */
  meta: function(filePath) {
    assert.ok(typeof filePath === "string", "File path must be a string.");

    return storage.file(filePath).then(function(contents) {
      assert.ok(contents, "Missing contents from file lookup.");
      return consumare.parse.apply(consumare, contents);
    });
  },

  // Take a content file path and render out the content.
  assemble: function(filePath, rev, callback) {
    var filePromise = storage.file(filePath, rev);

    // Read in the file path and apply syntax highlighting.
    return Promise.cast(filePromise).spread(function(contents, revs) {
      var parts = consumare.parse(contents);
      var tmpl = combyne(parts.contents, parts.metadata);

      var extmap = {
        ".js": "javascript",
        ".php": "php",
        ".lua": "lua",
        ".xml": "xml",
        ".coffee": "coffeescript",
        ".yaml": "coffeescript",
        ".sh": "bash"
      };

      function highlight(val, lang) {
        var type = val.split(".").pop();
        var codeBlock = "<pre><div class=\"code\"><code class=\"hljs\">";

        // Find the base path.
        var basePath = filePath.split("/").slice(0, -1).join("/");
        var assetPath = path.join("content", basePath, "assets/", val);
        var source = fs.readFileSync(assetPath).toString();
        var ext = path.extname(val);

        try {
          codeBlock += hl.highlight(extmap[ext] || "text", source).value;
          codeBlock += "</code></div></pre>";
        } catch (ex) {
          console.log(ex.stack);
          console.warn(val + " was unable to be highlighted");
        }

        return codeBlock;
      }

      tmpl.registerFilter("highlight", highlight);

      // Deprecate this?
      tmpl.registerFilter("render", highlight);

      tmpl.registerFilter("sha", function(val) {
        return rev ? val + "?rev=" + rev : val;
      });

      tmpl.registerFilter("script", function() {
        return arguments[0];
      });

      callback(marked(tmpl.render()), revs);
    }).catch(function(e) {
      console.log(e.stack);
    });
  }
};

module.exports = consumare;

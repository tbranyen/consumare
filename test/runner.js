const path = require("path");

// Expose the root path to the lib directory.
global.libpath = path.join(__dirname, "../lib/");

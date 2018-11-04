Consumare
---------

> Consume content from Git

**Stable: 2.0.0**

Maintained by Tim Branyen [@tbranyen](http://twitter.com/tbranyen).

#### Install ####

``` bash
npm install consumare
```

You may get errors with NodeGit, try and build from source if you get segfaults:

``` bash
npm install consumare --build-from-source
```

#### Configure a repository ####

``` javascript
var consumare = require("consumare");

// Assuming your Git repository is named content and your work is in the
// master branch.
consumare.configure("content", { repo: ".git", branch: "master" });
```

#### Unit tests ####

``` bash
npm test
```

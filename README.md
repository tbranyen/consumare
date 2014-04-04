Consumare
---------

> Consume content from Git

**Stable: 0.1.0**

Maintained by Tim Branyen [@tbranyen](http://twitter.com/tbranyen).

#### Install ####

``` bash
npm install consumare
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

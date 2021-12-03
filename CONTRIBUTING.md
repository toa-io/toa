# Contributing

> Please note that this project is released with a [Contributor Code of Conduct](./CONDUCT.md).
> By participating in this project you agree to abide by its terms.

## What You'll Need

1. [Node LTS](https://nodejs.org/)
2. [Docker Desktop](https://www.docker.com/get-started)
3. Approved [Bug or Feature](https://github.com/toa-io/toa/issues)

## Flow

> This project follows [GitHub's standard forking model](https://guides.github.com/activities/forking/).

To get started fork the project.

```shell
# replace with your fork's URL
$ git clone git@github.com:toa-io/toa.git
$ cd toa

# install dependencies
$ npm install

# setup dev environment
$ echo TODO

# make sure everything is ok
$ npm test
```

Commit & Push your changes, then create a Pull Request.

## Commit Messages [![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-brightgreen.svg)](https://conventionalcommits.org)

Please use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

Commit subject line should complete the sentence:
> If applied, this commit will `[add your subject line here]`

## Code Style Requirements [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

This project follows [JavaScript Standard Style](https://standardjs.com).

```shell
$ npm run lint
```

### Code Structure Requirements

These requirements may have reasonable exceptions. The point is to create as uniform code as possible and prevent some
typical mistakes.

<!--suppress ALL -->
<table>
  <tr>
    <td valign=top>Strict mode</td>
    <td>
All modules must be in <a href=https://developer.mozilla.org/en-US/docs/Web/>strict mode</a>
    </td>
  </tr>
  <tr>
    <td valign=top>Single quotes</td>
    <td>

`'like this'` not `"like that"`

`` `this is also ok if ${necessary}`  ``
   </td>
  </tr>
  <tr>
    <td valign=top>One class per file</td>
    <td>Put a class into a module with the same name in lowercase.</td>
  </tr>
  <tr>
    <td valign=top>Helper directories</td>
    <td>Put 'subclasses' into a folder with the same name as your main class.</td>
  </tr>
  <tr>
    <td valign=top>

`exports` last
    </td>
    <td>Put all exports at the end of a module.</td>
  </tr>
  <tr>
    <td valign=top>No default exports</td>
    <td>Use only named export.</td>
  </tr>
  <tr>
    <td valign=top>No 'module.exports'</td>
    <td>Use `exports.name` instead of `module.exports.name`</td>
  </tr>
</table>

### Module Structure

```javascript
'use strict'

// external dependencies
const lib1 = require('node-libs')
const lib2 = require('third-party-libs')
const { tool } = require('@toa.io/libs')

// local dependencies
const { local } = require('./local/module')

// what your module exports should be at first (public first - private last)
class Declaration {
  // public first
  pub
  
  // private last
  #priv

  constructor (arg) {}

  // public first
  method() {}

  // private last
  #method() {}

  // static properties and methods should be last event if they're public
  static method() {}
}

// private last
const CONSTANT = 'value'

const utility = () => {}

// exports last
exports.Declaration = Declaration
```

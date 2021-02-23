# Notes

## Code Style Requirements
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
1. exports last
2. no default exports
3. exports.name instead of module.exports.name
4. do not disable code style inspections
5. `'use strict'`
6. JSDoc for everything public

## Module Structure
```javascript
'use strict'

const lib1 = require('node-libs')
const lib2 = require('third-party-libs')

const { tool } = require('@kookaburra/libs')
const { local } = require('./local/module')

class Declaration {
  pub
  
  #priv

  constructor (arg) {}

  append() {}
  
  static create() {}
}

const CONSTANT = 'value'

exports.Declaration = Declaration
```

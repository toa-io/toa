# Notes

## Code Style Requirements
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
1. exports last
2. no default exports
3. exports.name instead of module.exports.name
4. `'use strict'`

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

  #fix() {}
  
  append() {}
  
  static create() {}
}

const CONSTANT = 'value'

exports.Declaration = Declaration
```
# Ok Oh Convention
Throw-catch must not be used for control flow. 
Functions optionally returning an error must follow the pattern:  
```javascript
const { ok, oh } = func()
```
```javascript
const { ok, oh, myValue, otherValue } = func()
```
In case of `ok === false` `oh.message` is expected to be defined as string.
This message text may be provided to end users.

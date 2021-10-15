# Notes

## Setup dev environment
`yarn dev`

### Debug Integration Tests
Path `integration` is not included in jest `roots` by default. To run them with your debugger, 
you should pass `--roots runtime connectors extensions integration` option to jest cli. 

For example, if you're using WebStorm, set CLI Options for Jest Template as `--roots runtime connectors extensions integration`

## Code Style Requirements
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
1. requirements may have reasonable exceptions
2. `exports` last
3. no `exports default`
4. `exports.name` instead of `module.exports.name`
5. `'use strict'`
6. single quotes

### Module Structure
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

  do() {}

  #do() {}
  
  static do() {}
}

const CONSTANT = 'value'

exports.Declaration = Declaration
```

'use strict'

const { generate } = require('randomstring')

const declaration = {
  [generate()]: 'https://toa.io'
}

exports.declaration = declaration

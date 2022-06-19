'use strict'

const { generate } = require('randomstring')

const declaration = {
  origins: {
    [generate()]: 'https://toa.io'
  }
}

exports.declaration = declaration

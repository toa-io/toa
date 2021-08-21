'use strict'

const randomstring = require('randomstring')

const set = [
  { state: { [randomstring.generate()]: randomstring.generate() } },
  { state: { [randomstring.generate()]: randomstring.generate() } },
  { state: { [randomstring.generate()]: randomstring.generate() } }
]

exports.set = set

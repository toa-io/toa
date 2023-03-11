'use strict'

const { reveal } = require('../handlers/reveal')

const builder = (yargs) => {
  yargs
    .positional('secret', {
      type: 'string'
    })
}

exports.command = 'reveal <secret>'
exports.desc = 'Print keys and values of a secret'
exports.builder = builder
exports.handler = reveal

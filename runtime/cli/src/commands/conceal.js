'use strict'

const { conceal } = require('../handlers/conceal')

const builder = (yargs) => {
  yargs
    .positional('secret', {
      type: 'string'
    })
    .positional('key', {
      type: 'string'
    })
    .positional('value', {
      type: 'string'
    })
}

exports.command = 'conceal [secret] [key] [value]'
exports.desc = 'Deploy a key with a value to a secret'
exports.builder = builder
exports.handler = conceal

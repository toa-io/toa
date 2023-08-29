'use strict'

const { key } = require('../handlers/key')

const builder = (yargs) => {
  yargs
    .option('public', {
      group: 'Command options:',
      describe: 'Generate a public/private key pair',
      type: 'boolean',
      default: false
    })
}

exports.command = 'key'
exports.desc = 'Generate a secret PASETO key'
exports.builder = builder
exports.handler = key

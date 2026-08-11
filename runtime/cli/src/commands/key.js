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
    .option('format', {
      group: 'Command options:',
      describe: 'Secret key format',
      choices: ['jwe', 'paseto'],
      default: 'jwe'
    })
}

exports.command = 'key'
exports.desc = 'Generate an encryption key'
exports.builder = builder
exports.handler = key

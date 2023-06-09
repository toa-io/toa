'use strict'

const { conceal } = require('../handlers/conceal')

const builder = (yargs) => {
  yargs
    .positional('secret', {
      type: 'string'
    })
    .positional('key-values', {
      type: 'string',
      array: true,
      desc: 'Secret key-value pairs'
    })
    .option('type', {
      group: 'Command options:',
      type: 'string',
      desc: 'Secret type',
      default: 'generic'
    })
    .option('replace', {
      group: 'Command options:',
      type: 'boolean',
      desc: 'Delele existing keys',
      default: false
    })
    .example([
      ['$0 conceal amqp-credentials username=developer'],
      ['$0 conceal amqp-credentials username=developer password=secret'],
      ['$0 conceal regcred --type docker-registry docker-server=localhost']
    ])
}

exports.command = 'conceal <secret> <key-values...>'
exports.desc = 'Deploy a secret'
exports.builder = builder
exports.handler = conceal

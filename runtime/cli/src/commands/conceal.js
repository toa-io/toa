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
    .option('namespace', {
      alias: 'n',
      group: 'Command options:',
      type: 'string',
      desc: 'Target Kubernetes namespace'
    })
    .example([
      ['$0 conceal amqp-credentials username=developer'],
      ['$0 conceal amqp-credentials username=developer password=secret'],
      ['$0 conceal amqp-credentials username=developer --namespace app']
    ])
}

exports.command = 'conceal <secret> <key-values...>'
exports.desc = 'Deploy a secret'
exports.builder = builder
exports.handler = conceal

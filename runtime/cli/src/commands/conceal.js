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
    .option('interactive', {
      alias: 'i',
      group: 'Command options:',
      describe: 'Prompt for secrets',
      type: 'boolean',
      default: false
    })
    .option('environment', {
      alias: 'e',
      group: 'Command options:',
      describe: 'Environment name for interactive mode',
      type: 'string'
    })
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      describe: 'Path to a Context for interactive mode',
      type: 'string',
      default: '.'
    })
    .example([
      ['$0 conceal -i'],
      ['$0 conceal credentials username=developer'],
      ['$0 conceal credentials username=developer password=secret'],
      ['$0 conceal credentials username=developer --namespace app']
    ])
}

exports.command = 'conceal [secret] [key-values...]'
exports.desc = 'Deploy a secret'
exports.builder = builder
exports.handler = conceal

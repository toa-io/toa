'use strict'

const { env } = require('../handlers/env')

const builder = (yargs) => {
  yargs
    .positional('environment', {
      type: 'string',
      default: 'local',
      desc: 'Environment name'
    })
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      describe: 'Path to a Context',
      type: 'string',
      default: '.'
    })
    .option('as', {
      group: 'Command options:',
      describe: 'Output file path',
      type: 'string',
      default: '.env'
    })
    .option('interactive', {
      alias: 'i',
      group: 'Command options:',
      describe: 'Prompt for secrets',
      type: 'boolean',
      default: false
    })
}

exports.command = 'env [environment]'
exports.desc = 'Select environment'
exports.builder = builder
exports.handler = env

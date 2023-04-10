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
      describe: 'Path to component',
      type: 'string',
      default: '.'
    })
}

exports.command = 'env [environment]'
exports.desc = 'Select environment'
exports.builder = builder
exports.handler = env

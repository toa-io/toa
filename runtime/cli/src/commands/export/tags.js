'use strict'

const { tags } = require('../../handlers/export/tags')

const builder = (yargs) => {
  yargs
    .positional('environment', {
      type: 'string',
      desc: 'Deployment environment'
    })
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      type: 'string',
      desc: 'Path to context',
      default: '.'
    })
    .option('mono', {
      group: 'Command options:',
      type: 'boolean',
      desc: 'Export the single-image tag'
    })
}

exports.command = ['tags <environment>']
exports.desc = 'Export image tags'
exports.builder = builder
exports.handler = tags

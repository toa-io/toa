'use strict'

const { prepare } = require('../../handlers/export/images')

const builder = (yargs) => {
  yargs
    .positional('target', {
      type: 'string',
      desc: 'Path to export to'
    })
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
}

exports.command = ['images <environment> <target>', 'imgs', 'img']
exports.desc = 'Export docker image sources'
exports.builder = builder
exports.handler = prepare

'use strict'

const { prepare } = require('../../handlers/export/images')

const builder = (yargs) => {
  yargs
    .positional('target', {
      type: 'string',
      desc: 'Path to export to'
    })
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      type: 'string',
      desc: 'Path to context',
      default: '.'
    })
}

exports.command = ['images <target>', 'img']
exports.desc = 'Export docker image sources'
exports.builder = builder
exports.handler = prepare

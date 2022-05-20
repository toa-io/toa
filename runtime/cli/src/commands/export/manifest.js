'use strict'

const { manifest } = require('../../handlers/export/manifest')

const builder = (yargs) => {
  yargs
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      type: 'string',
      desc: 'Path to component',
      default: '.'
    })
}

exports.command = 'manifest'
exports.desc = 'Print manifest'
exports.builder = builder
exports.handler = manifest

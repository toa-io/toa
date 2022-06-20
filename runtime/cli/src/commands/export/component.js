'use strict'

const { component } = require('../../handlers/export/component')

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

exports.command = ['component', 'com']
exports.desc = 'Print manifest'
exports.builder = builder
exports.handler = component

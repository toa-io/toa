'use strict'

const { mono } = require('../handlers/mono')

const builder = (yargs) => {
  yargs
    .positional('paths', {
      type: 'string',
      desc: 'Paths to components',
      default: '.'
    })
    .array('paths')
    .option('kill', {
      group: 'Command options:',
      type: 'boolean',
      desc: 'Immediate shutdown'
    })
}

exports.command = 'mono [paths...]'
exports.desc = 'Run composition and services'
exports.builder = builder
exports.handler = mono

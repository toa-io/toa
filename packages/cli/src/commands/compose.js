'use strict'

const { handler } = require('../handlers/compose')

const builder = (yargs) => {
  yargs
    .usage('Usage: kookaburra compose --path /path/to/component')
    .positional('path', {
      type: 'string',
      desc: 'Path to component',
      default: '.'
    })
    .array('path')
}

exports.command = 'compose [path...]'
exports.desc = 'Start Runtime Composition'
exports.builder = builder
exports.handler = handler

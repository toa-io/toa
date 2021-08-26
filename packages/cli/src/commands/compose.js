'use strict'

const { compose } = require('../handlers/compose')

const builder = (yargs) => {
  yargs
    .positional('path', {
      type: 'string',
      desc: 'Path to package',
      default: '.'
    })
    .array('path')
    .example([
      ['$0 compose ./first ./second', 'Paths enumeration'],
      ['$0 compose ./components/**/', 'Glob pattern'],
      ['$0 compose ./a/**/ ./b/**/', 'Glob patterns enumeration']
    ])
    .strictCommands()
}

exports.command = 'compose [path...]'
exports.desc = 'Start Runtime Composition'
exports.builder = builder
exports.handler = compose

'use strict'

const { invoke } = require('../handlers/invoke')

const builder = (yargs) => {
  yargs
    .usage('Usage: kookaburra invoke . sum --input.a=1 --input.b=2')
    .positional('path', {
      type: 'string',
      desc: 'Path to package'
    })
    .positional('operation', {
      type: 'string',
      desc: 'Operation name'
    })
    .option('input', {
      type: 'object',
      describe: 'Input object'
    })
}

// noinspection RequiredAttributes
exports.command = 'invoke <path> <operation>'
exports.desc = 'Invoke Operation'
exports.builder = builder
exports.handler = invoke

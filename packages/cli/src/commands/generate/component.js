'use strict'

const { component } = require('../../handlers/generate/component')

function builder (yargs) {
  yargs
    .positional('name', {
      describe: 'Component name',
      type: 'string'
    })
    .option('operations', {
      alias: 'o',
      type: 'string',
      describe: 'Operation names, mark with ! for transitions'
    })
    .array('operations')
    .demandOption('name')
    .usage('Usage: kookaburra generate component dummy --operations get add! remove!')
}

exports.command = ['component [name]', '$0']
exports.desc = 'Generate component'
exports.builder = builder
exports.handler = component

'use strict'

const { component } = require('../../handlers/create/component')

function builder (yargs) {
  yargs
    .positional('name', {
      describe: 'Component name',
      demandOption: true,
      type: 'string'
    })
    .option('operations', {
      alias: 'o',
      type: 'string',
      describe: 'Operation names, mark with ! for transitions'
    })
    .array('operations')
    .usage('Usage: kookaburra create component dummy --operations get add! remove!')
}

exports.command = 'component <name>'
exports.desc = 'Create component'
exports.builder = builder
exports.handler = component

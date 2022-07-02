'use strict'

const builder = (yargs) => yargs
  .commandDir('./export')
  .demandCommand()

exports.command = 'export <artifact>'
exports.desc = 'Export internal artifacts'
exports.builder = builder

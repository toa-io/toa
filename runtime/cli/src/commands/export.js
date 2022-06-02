'use strict'

const builder = (yargs) => yargs.commandDir('./export')

exports.command = 'export <artifact>'
exports.desc = 'Export internal artifacts'
exports.builder = builder

'use strict'

const builder = (yargs) => yargs.commandDir('./export')

exports.command = 'export <command>'
exports.desc = ''
exports.builder = builder

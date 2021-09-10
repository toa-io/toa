'use strict'

function builder (yargs) {
  yargs
    .usage('Usage: kookaburra create --help')
    .commandDir('create')
    .demandCommand()
    .help()
}

exports.desc = 'Generator commands'
exports.builder = builder

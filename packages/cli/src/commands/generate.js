'use strict'

function builder (yargs) {
  // noinspection HtmlDeprecatedTag
  yargs
    .usage('Usage: kookaburra generate <command>')
    .commandDir('generate')
    .demandCommand()
    .help()
}

exports.command = 'generate'
exports.desc = 'Generator commands'
exports.aliases = ['gen']
exports.builder = builder

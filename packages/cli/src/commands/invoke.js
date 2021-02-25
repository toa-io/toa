'use strict'

const { handler } = require('../handlers/invoke')

const builder = (yargs) => {
  yargs
    .usage('Usage: kookaburra invoke sum --input.a=1 --input.b=2')
    .option('input', {
      describe: 'Input object'
    })
}

exports.command = 'invoke <operation>'
exports.desc = 'Invoke operation'
exports.builder = builder
exports.handler = handler

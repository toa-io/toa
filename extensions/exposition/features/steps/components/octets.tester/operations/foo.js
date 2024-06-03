'use strict'

async function foo (input, context) {
  await context.storages.octets.annotate(input.path, 'foo', 'bar')
}

exports.effect = foo

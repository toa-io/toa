'use strict'

function foo (input, context) {
  return context.storages.octets.annotate(input.path, 'foo', 'bar')
}

exports.effect = foo

'use strict'

async function foo (input, context) {
  return { foo: 'bar' }
}

exports.effect = foo

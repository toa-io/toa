'use strict'

async function assignment (input, changeset, context) {
  const foo = context.configuration.foo

  return { foo }
}

exports.assignment = assignment

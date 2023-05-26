'use strict'

async function computation (input, context) {
  const criteria = `material==${input}`
  const query = { criteria, limit }

  // noinspection JSUnresolvedFunction
  return context.local.enumerate({ query })
}

const limit = 10

exports.computation = computation

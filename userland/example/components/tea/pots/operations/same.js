'use strict'

async function observation (input, none, context) {
  const criteria = `material==${input}`
  const query = { criteria, limit }

  // noinspection JSUnresolvedFunction
  return context.local.enumerate({ query })
}

const limit = 10

exports.observation = observation

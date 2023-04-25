'use strict'

async function computation (input, context) {
  const request = { input }

  // noinspection JSUnresolvedVariable
  return context.remote.math.calculations.add(request)
}

exports.computation = computation

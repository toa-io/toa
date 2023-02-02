'use strict'

async function observation (input, none, context) {
  const request = { input }

  // noinspection JSUnresolvedVariable
  return context.remote.math.calculations.add(request)
}

exports.observation = observation

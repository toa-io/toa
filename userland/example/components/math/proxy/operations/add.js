'use strict'

async function transition (input, _, context) {
  const request = { input }

  // noinspection JSUnresolvedVariable
  return context.remote.math.calculations.add(request)
}

exports.transition = transition

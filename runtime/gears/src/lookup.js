'use strict'

const { dirname, resolve } = require('path')

const lookup = (reference, base, directory = false) => {
  if (WELL_KNOWN[reference]) reference = WELL_KNOWN[reference]

  try {
    const path = require.resolve(reference, { paths: base ? [base] : undefined })
    return directory ? dirname(path) : path
  } catch (e) {
    return resolve(base, reference)
  }
}

lookup.directory = (reference, base) => lookup(reference, base, true)

const WELL_KNOWN = {
  '@http': '@kookaburra/bindings.http',
  '@amqp': '@kookaburra/bindings.amqp'
}

exports.lookup = lookup

'use strict'

const label = (locator, endpoint) => {
  return `${locator.name}.${endpoint.name}`
}

exports.label = label

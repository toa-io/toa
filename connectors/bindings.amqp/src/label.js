'use strict'

const label = (locator, endpoint) => {
  return `${locator.fqn}.${endpoint}`
}

exports.label = label

'use strict'

const name = (locator, endpoint) => {
  return `${locator.fqn}.${endpoint}`
}

exports.name = name

'use strict'

const { events, operations, receivers } = require('./.normalize')

const normalize = (component) => {
  operations(component)
  events(component)
  receivers(component)
}

exports.normalize = normalize

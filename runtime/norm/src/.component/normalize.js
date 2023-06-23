'use strict'

const { events, operations, extensions, receivers } = require('./.normalize')

const normalize = (component, environment) => {
  operations(component)
  events(component)
  receivers(component)
  extensions(component)
}

exports.normalize = normalize

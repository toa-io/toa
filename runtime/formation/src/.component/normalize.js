'use strict'

const { convolve } = require('@toa.io/libraries.generic')
const { events, operations, extensions } = require('./.normalize')

const normalize = (component, environment) => {
  convolve(component, environment)
  operations(component)
  events(component)
  extensions(component)
}

exports.normalize = normalize

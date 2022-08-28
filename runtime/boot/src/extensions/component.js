'use strict'

const { instances } = require('./instances')

/**
 * @param {toa.core.Component} component
 * @returns {toa.core.Component}
 */
const component = (component) => {
  let decorated = component

  for (const factory of Object.values(instances)) {
    if (factory.component !== undefined) decorated = factory.component(decorated)
  }

  return decorated
}

exports.component = component

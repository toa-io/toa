'use strict'

const { instances } = require('./instances')

/**
 * @param {toa.core.Connector} composition
 * @returns {toa.core.Connector}
 */
const manage = (composition) => {
  let managed = composition

  for (const factory of Object.values(instances)) {
    if (factory.manage !== undefined)
      managed = factory.manage(managed)
  }

  return managed
}

exports.manage = manage

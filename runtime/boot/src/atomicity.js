'use strict'

/**
 * Exclusive ownership of a slot within a group, where there is anything to coordinate through.
 * Without it nothing is owned, and whoever asked stands down — see the connector's readme.
 *
 * @param {string} group
 */
const atomicity = (group) => {
  if (process.env[VARIABLE] === undefined || process.env[VARIABLE] === '')
    return

  const { Factory } = require(MODULE)

  return new Factory().partition(group)
}

const VARIABLE = 'TOA_ATOMICITY_REDIS'
const MODULE = '@toa.io/atomicity'

exports.atomicity = atomicity

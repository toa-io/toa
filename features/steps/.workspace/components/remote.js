'use strict'

const stage = require('@toa.io/userland/stage')

/**
 * @param {string} id
 * @returns {Promise<toa.core.Component>}
 */
const remote = async (id) => {
  return stage.remote(id)
}

exports.remote = remote

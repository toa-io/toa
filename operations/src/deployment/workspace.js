'use strict'

const { directory } = require('@toa.io/filesystem')

/**
 * @param {string} type
 * @param {string} [path]
 * @return {Promise<string>}
 */
async function create (type, path) {
  if (path === undefined) path = await directory.temp('toa-' + type)
  else path = await directory.ensure(path)

  return path
}

exports.create = create

'use strict'

const boot = require('@toa.io/boot')

/**
 * @type {toa.stage.Manifest}
 */
const manifest = async (path) => {
  return boot.manifest(path)
}

exports.manifest = manifest

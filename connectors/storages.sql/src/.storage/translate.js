'use strict'

/**
 * @param {toa.core.storages.Entity} entity
 * @returns {toa.core.storages.Entity}
 */
const to = (entity) => {
  const { _version, ...rest } = entity

  return { ...rest, _version: _version + 1 }
}

exports.to = to

'use strict'

/**
 * @param {toa.core.storages.Record} entity
 * @returns {toa.core.storages.Record}
 */
const to = (entity) => {
  const { _version, ...rest } = entity

  return { ...rest, _version: _version + 1 }
}

exports.to = to

'use strict'

/**
 * @param {toa.core.storages.Entity} entity
 * @returns {toa.storages.mongo.Record}
 */
const to = (entity) => {
  const { id, _version, ...rest } = entity

  return { _id: id, _version: _version + 1, ...rest }
}

/**
 * @param {toa.storages.mongo.Record} record
 * @returns {toa.core.storages.Entity}
 */
const from = (record) => {
  if (record === undefined || record === null) return null

  const { _id, ...rest } = record

  return { id: _id, ...rest }
}

exports.to = to
exports.from = from

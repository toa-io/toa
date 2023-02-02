'use strict'

/**
 * @param {toa.core.storages.Record} entity
 * @returns {toa.mongodb.Record}
 */
const to = (entity) => {
  const { id, _version, ...rest } = entity

  return /** @type {toa.mongodb.Record} */ { _id: id, _version: _version + 1, ...rest }
}

/**
 * @param {toa.mongodb.Record} record
 * @returns {toa.core.storages.Record}
 */
const from = (record) => {
  if (record === undefined || record === null) return null

  const { _id, ...rest } = record

  return { id: _id, ...rest }
}

exports.to = to
exports.from = from

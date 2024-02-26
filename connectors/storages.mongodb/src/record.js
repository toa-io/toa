'use strict'

/**
 * @param {toa.core.storages.Record} entity
 * @returns {toa.mongodb.Record}
 */
const to = (entity) => {
  const {
    id,
    ...rest
  } = entity

  return /** @type {toa.mongodb.Record} */ { _id: id, ...rest }
}

/**
 * @param {toa.mongodb.Record} record
 * @returns {toa.core.storages.Record}
 */
const from = (record) => {
  if (record === undefined || record === null) return null

  const {
    _id,
    ...rest
  } = record

  return { id: _id, ...rest }
}

exports.to = to
exports.from = from

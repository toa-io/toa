'use strict'

function to (entity) {
  const { id, ...rest } = entity

  return /** @type {toa.mongodb.Record} */ { _id: id, ...rest }
}

function from (record) {
  if (record === undefined || record === null)
    return null

  record.id = record._id
  delete record._id

  return record
}

exports.to = to
exports.from = from

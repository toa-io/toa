'use strict'

const to = (entity) => {
  const { id, _version, ...rest } = entity

  return { _id: id, _version: _version + 1, ...rest }
}

const from = (record) => {
  if (record === undefined || record === null) return null

  const { _id, ...rest } = record

  return { id: _id, ...rest }
}

exports.to = to
exports.from = from

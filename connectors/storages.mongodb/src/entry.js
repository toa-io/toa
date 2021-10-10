'use strict'

const to = (entry) => {
  const { id, _version, ...rest } = entry

  return { _id: id, _version: _version + 1, ...rest }
}

const from = (entry) => {
  if (entry === undefined) return null

  const { _id, ...rest } = entry

  return { id: _id, ...rest }
}

exports.to = to
exports.from = from

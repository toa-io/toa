'use strict'

const to = (entry) => {
  const { id, ...rest } = entry

  return { _id: id, ...rest }
}

const from = (entry) => {
  if (entry === undefined) return

  const { _id, ...rest } = entry

  return { id: _id, ...rest }
}

exports.to = to
exports.from = from

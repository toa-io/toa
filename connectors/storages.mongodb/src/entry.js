'use strict'

const to = (entry) => {
  entry._id = entry.id
  delete entry.id

  return entry
}

const from = (entry) => {
  if (!entry) return

  entry.id = entry._id
  delete entry._id

  return entry
}

exports.to = to
exports.from = from

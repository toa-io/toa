'use strict'

const timestamp = {
  type: 'number',
  validate: () => true,
  async: false,
  compare: (a, b) => a - b && (a - b > 0 ? 1 : -1)
}

exports.name = 'timestamp'
exports.format = timestamp

'use strict'

const timestamp = {
  type: 'number',
  validate: () => true,
  async: false
}

exports.name = 'timestamp'
exports.format = timestamp

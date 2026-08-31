'use strict'

const types = {
  integer: () => 'bigint', // timestamps are stored as epoch milliseconds
  string: () => 'varchar'
}

exports.types = types

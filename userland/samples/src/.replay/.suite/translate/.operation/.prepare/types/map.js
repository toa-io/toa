'use strict'

function cast (value) {
  return new Map(Object.entries(value))
}

module.exports = cast

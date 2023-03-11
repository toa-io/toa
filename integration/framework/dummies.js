'use strict'

const path = require('path')

const locate = (dummy) => {
  return path.resolve(__dirname, '../dummies', dummy)
}

exports.locate = locate

'use strict'

const yaml = require('./yaml')

module.exports = async path => {
  return await yaml(path)
}

'use strict'

const { console } = require('openspan')

exports.effect = (input) => {
  console.debug('Received input', input)
}

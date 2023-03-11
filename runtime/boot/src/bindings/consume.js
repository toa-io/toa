'use strict'

const { LOOP } = require('./constants')
const { factory } = require('./factory')

const consume = (locator, endpoint, bindings) =>
  [LOOP].concat(bindings).map((binding) => factory(binding).consumer(locator, endpoint))

exports.consume = consume

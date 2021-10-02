'use strict'

const { LOOP, SYSTEM_BINDINGS } = require('./constants')
const { factory } = require('./factory')

const consume = (locator, endpoint, bindings) =>
  [LOOP].concat(bindings || SYSTEM_BINDINGS).map((binding) => factory(binding).consumer(locator, endpoint))

exports.consume = consume

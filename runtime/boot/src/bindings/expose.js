'use strict'

const { LOOP, SYSTEM_BINDINGS } = require('./constants')
const { factory } = require('./factory')

const expose = (exposition, bindings) => [LOOP].concat(bindings || SYSTEM_BINDINGS)
  .map((binding) => factory(binding).producer(exposition.locator, exposition.endpoints, exposition))

exports.expose = expose

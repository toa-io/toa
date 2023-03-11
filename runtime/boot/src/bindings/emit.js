'use strict'

const { factory } = require('./factory')

const emit = (binding, locator, label) => factory(binding).emitter(locator, label)

exports.emit = emit

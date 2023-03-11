'use strict'

const emit = jest.fn(async () => undefined)
const link = jest.fn()

const emitter = /** @type {toa.core.bindings.Emitter} */ { emit, link }

exports.emitter = emitter

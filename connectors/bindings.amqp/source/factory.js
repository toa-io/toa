'use strict'

const { Pointer } = require('./pointer')
const { Communication } = require('./communication')
const { Producer } = require('./producer')

/**
 * @implements {toa.core.bindings.Factory}
 */
class Factory {
  producer (locator, endpoints, component) {
    const pointer = /** @type {toa.pointer.Pointer} */ new Pointer(locator)
    const comm = new Communication(pointer)

    return new Producer(comm)
  }
}

exports.Factory = Factory

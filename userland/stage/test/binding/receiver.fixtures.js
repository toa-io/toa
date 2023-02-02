'use strict'

const receiver = /** @type {jest.MockedObject<toa.core.Receiver>} */ {
  receive: jest.fn(async () => undefined)
}

exports.receiver = receiver

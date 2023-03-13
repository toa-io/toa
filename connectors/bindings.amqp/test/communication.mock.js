'use strict'

const { generate } = require('randomstring')

/**
 * @return {jest.MockedObject<toa.amqp.Communication>}
 */
const communication = () => (
  /** @type {jest.MockedObject<toa.amqp.Communication>} */ {
    connect: jest.fn(async () => undefined),
    request: jest.fn(async () => generate()),
    reply: jest.fn(async () => undefined),
    emit: jest.fn(async () => undefined),

    link: jest.fn()
  }
)

exports.communication = communication

'use strict'

/**
 * @return {jest.MockedObject<toa.amqp.Communication>}
 */
const communication = () => (
  /** @type {jest.MockedObject<toa.amqp.Communication>} */ {
    connect: jest.fn(async () => undefined),
    reply: jest.fn(async () => undefined),

    link: jest.fn()
  }
)

exports.communication = communication

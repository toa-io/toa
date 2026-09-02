import { mock } from 'node:test'

import { generate } from 'randomstring'

/**
 * @return {toa.amqp.Communication}
 */
const communication = () => (
  /** @type {toa.amqp.Communication} */ {
    connect: mock.fn(async () => undefined),
    disconnect: mock.fn(async () => undefined),
    request: mock.fn(async () => generate()),
    reply: mock.fn(async () => undefined),
    emit: mock.fn(async () => undefined),
    consume: mock.fn(async () => undefined),
    enqueue: mock.fn(async () => undefined),
    process: mock.fn(async () => undefined),
    seal: mock.fn(async () => undefined),

    link: mock.fn()
  }
)

export { communication }

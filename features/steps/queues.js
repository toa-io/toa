import assert from 'node:assert'
import { Given, Then } from '@cucumber/cucumber'

// events emitted while a receiver isn't composed pile up in its durable queue and are
// delivered in a burst the next time it starts, so a scenario asserting on what the
// receiver has processed has to start from an empty queue
Given(
  'the {component} event queues are empty',
  /**
   * @param {string} id
   */
  async function (id) {
    const queues = await request('/queues')
    const suffix = '..' + id

    for (const { name } of queues)
      if (name.endsWith(suffix))
        await request(`/queues/%2F/${encodeURIComponent(name)}/contents`, 'DELETE')
  }
)

// what comq parks a message in, once it is one nothing will process
const PARKED = 'comq.parked.'

Given(
  'the {component} parked queues are empty',
  /**
   * @param {string} id
   */
  async function (id) {
    const queues = await request('/queues')
    const suffix = '..' + id

    for (const { name } of queues)
      if (name.startsWith(PARKED) && name.endsWith(suffix))
        await request(`/queues/%2F/${encodeURIComponent(name)}/contents`, 'DELETE')
  }
)

Then(
  '{component} parks {int} message(s) on the first delivery',
  /**
   * A message read rather than counted: the management API's totals come from the statistics
   * database and lag it by seconds. `ack_requeue_true` puts back what it reads, so asking
   * again is free.
   *
   * @param {string} id
   * @param {number} expected
   */
  async function (id, expected) {
    const suffix = '..' + id
    const deadline = Date.now() + PARKING

    let parked = []

    do {
      const queues = (await request('/queues')).filter(
        ({ name }) => name.startsWith(PARKED) && name.endsWith(suffix)
      )

      parked = []

      for (const { name } of queues)
        parked.push(
          ...(await request(`/queues/%2F/${encodeURIComponent(name)}/get`, 'POST', {
            count: 10,
            ackmode: 'ack_requeue_true',
            encoding: 'auto'
          }))
        )

      if (parked.length === expected) break

      await new Promise((resolve) => setTimeout(resolve, 100))
    } while (Date.now() < deadline)

    assert.equal(parked.length, expected, `'${id}' has ${parked.length} parked messages`)

    for (const message of parked)
      assert.equal(
        message.properties.headers?.['x-comq-attempt'],
        undefined,
        'the message was retried before it was parked'
      )
  }
)

/** how long a message may take to reach the queue it is kept in */
const PARKING = 5000

/**
 * @param {string} path
 * @param {string} [method]
 * @returns {Promise<any>}
 */
async function request(path, method = 'GET', body) {
  const response = await fetch(MANAGEMENT + path, {
    method,
    headers: {
      authorization: AUTHORIZATION,
      ...(body === undefined ? {} : { 'content-type': 'application/json' })
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  })

  if (!response.ok)
    throw new Error(
      `RabbitMQ management ${method} ${path} responded with ${response.status}`
    )

  if (method !== 'DELETE') return response.json()
}

const MANAGEMENT = 'http://localhost:31011/api'
const AUTHORIZATION = 'Basic ' + Buffer.from('developer:secret').toString('base64')

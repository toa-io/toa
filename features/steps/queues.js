import assert from 'node:assert'
import { Given, Then, When } from '@cucumber/cucumber'

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

// what comq parks a message in, once it is one nothing will process. One queue takes what
// every source parked, and a message names the queue it came from in `x-comq-queue`
const PARKED = 'comq.parked'

Given('the parked queue is empty', async function () {
  await request(`/queues/%2F/${PARKED}/contents`, 'DELETE').catch(() => {
    // nothing has been parked on this broker yet, so comq has not declared it
  })
})

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
      const messages = await request(`/queues/%2F/${PARKED}/get`, 'POST', {
        count: 100,
        ackmode: 'ack_requeue_true',
        encoding: 'auto'
      }).catch(() => [])

      parked = messages.filter(({ properties }) =>
        properties.headers?.['x-comq-queue']?.endsWith(suffix) === true
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

Then(
  '{component} consumes {int} task queue(s)',
  /**
   * Counted by consumer rather than by name: the broker of a development machine keeps
   * whatever earlier runs declared, and a queue nothing consumes is one of those.
   *
   * @param {string} id
   * @param {number} expected
   */
  async function (id, expected) {
    const deadline = Date.now() + COUNTING

    let consumed = []

    do {
      const queues = await request('/queues')

      consumed = queues
        .filter(({ name, consumers }) => isTaskQueueOf(name, id) && consumers > 0)
        .map(({ name }) => name)

      if (consumed.length === expected) break

      await new Promise((resolve) => setTimeout(resolve, 200))
    } while (Date.now() < deadline)

    assert.equal(
      consumed.length,
      expected,
      `'${id}' consumes ${consumed.length} task queue(s): ${consumed.join(', ')}`
    )
  }
)

When(
  'a task naming {token} is published to {component}',
  /**
   * What a caller running ahead of this component sends: a task for an operation it has
   * and this one does not.
   *
   * @param {string} endpoint
   * @param {string} id
   */
  async function (endpoint, id) {
    const published = await request('/exchanges/%2F/amq.default/publish', 'POST', {
      properties: {
        content_type: 'application/json',
        delivery_mode: 2,
        headers: { 'toa.io/endpoint': endpoint }
      },
      routing_key: tasksQueueOf(id),
      payload: JSON.stringify({ input: null, query: {} }),
      payload_encoding: 'string'
    })

    assert.equal(published.routed, true, `Nothing is bound to '${tasksQueueOf(id)}'`)
  }
)

Then(
  '{component} keeps the task at once, saying it named {token}',
  /**
   * @param {string} id
   * @param {string} endpoint
   */
  async function (id, endpoint) {
    const queue = tasksQueueOf(id)
    const deadline = Date.now() + PARKING

    let kept

    do {
      const messages = await request(`/queues/%2F/${PARKED}/get`, 'POST', {
        count: 100,
        ackmode: 'ack_requeue_true',
        encoding: 'auto'
      }).catch(() => [])

      kept = messages.find(
        ({ properties }) => properties.headers?.['x-comq-queue'] === queue
      )

      if (kept !== undefined) break

      await new Promise((resolve) => setTimeout(resolve, 100))
    } while (Date.now() < deadline)

    assert.notEqual(kept, undefined, `Nothing from '${queue}' is in '${PARKED}'`)

    const headers = kept.properties.headers

    assert.equal(
      headers['x-comq-attempt'],
      undefined,
      'the task was tried again before it was kept'
    )

    assert.ok(
      headers['x-comq-reason']?.includes(endpoint) === true,
      `the kept task says '${headers['x-comq-reason']}'`
    )
  }
)

/** @param {string} id */
const tasksQueueOf = (id) => id + '..tasks'

/**
 * @param {string} name
 * @param {string} id
 */
const isTaskQueueOf = (name, id) => name.startsWith(id + '.') && name.endsWith('..tasks')

/** how long a message may take to reach the queue it is kept in */
const PARKING = 5000

/** how long a consumer may take to appear in the statistics the management API reads */
const COUNTING = 10000

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

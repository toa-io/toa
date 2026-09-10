import assert from 'node:assert'
import { setTimeout as delay } from 'node:timers/promises'
import { Given, When, Then, After } from '@cucumber/cucumber'
import { transpose } from '@toa.io/generic'
import { assert as connect } from 'comq'
import { load as parse } from 'js-yaml'

import * as stage from './.workspace/components/index.js'

/**
 * The far region is this suite: it publishes to that region's own broker, and real federation
 * carries what it publishes to the one the composition converges on — and back. Two
 * compositions could not do it, because which region a deployment is comes from the
 * environment, and one process has one of those.
 */
let io

/** what the far region has been sent */
let received = []

const CHANNEL = 'convergence'
const EXTENSION = '@toa.io/extensions.convergence'

/**
 * A workspace normalizes each component from its sources, with no context to read, so what a
 * context declares of every component has to be said here. A deployment writes the normalized
 * manifest into the image, and boot reads that, so nothing says it there.
 */
Given(
  'I compose converging components:',
  /** @param {import('@cucumber/cucumber').DataTable} data */
  async function (data) {
    const references = transpose(data.raw())[0]

    await stage.composition(references, { extensions: [EXTENSION] })
  }
)

Given(
  'the {component} convergence queue is empty',
  /**
   * The queue this suite consumes, which is durable and outlives the run: a scenario that
   * fails leaves what it had not read yet, and the next one would assert on that.
   *
   * @param {string} id
   */
  async function (id) {
    await purge(`${CHANNEL}.test.${id}`)
  }
)

Given(
  'the region {string} writes to {component}:',
  /**
   * @param {string} region
   * @param {string} id
   * @param {string} yaml
   */
  async function (region, id, yaml) {
    const record = parse(yaml)

    io ??= await connect(FAR)

    await io.route(`${CHANNEL}.out`, id, { record })
  }
)

When(
  'convergence has settled',
  async function () {
    await delay(500)
  }
)

Given(
  'the region {string} is consuming {component}',
  /**
   * Bound before anything is written, because a record has nowhere to go until the far side
   * has a queue for it: federation propagates a downstream binding upstream, and until it
   * does, what is published is returned rather than held.
   *
   * @param {string} _
   * @param {string} id
   */
  async function (_, id) {
    io ??= await connect(FAR)

    await io.subscribe(`${CHANNEL}.in`, `${CHANNEL}.test.${id}`, id, (message) => {
      received.push({ id, message })
    })
  }
)

Then(
  'the region {string} is sent {component}:',
  /**
   * What the composition published, read from the far broker: its `convergence.in` is
   * federated from the one the composition publishes to. By component, because a scenario
   * that converges several is delivered several.
   *
   * @param {string} region
   * @param {string} id
   * @param {string} yaml
   */
  async function (region, id, yaml) {
    const expected = parse(yaml)
    const sent = () => received.filter((one) => one.id === id)

    for (let i = 0; i < 60 && sent().length === 0; i++) await delay(100)

    assert.notEqual(sent().length, 0, `Nothing of '${id}' reached the region '${region}'`)

    const { record } = sent().at(-1).message

    for (const [key, value] of Object.entries(expected))
      assert.deepEqual(record[key], value, `'${key}' of the record sent to '${region}'`)
  }
)

After(async function () {
  await io?.close()

  io = undefined
  received = []
})

/** @param {string} queue */
async function purge(queue) {
  await fetch(`${MANAGEMENT}/queues/%2F/${encodeURIComponent(queue)}/contents`, {
    method: 'DELETE',
    headers: { authorization: AUTHORIZATION }
  }).catch(() => undefined)
}

/** the broker of the region this suite plays */
const FAR = 'amqp://developer:secret@localhost:31015'
const MANAGEMENT = 'http://localhost:31016/api'
const AUTHORIZATION = 'Basic ' + Buffer.from('developer:secret').toString('base64')

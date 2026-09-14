import assert from 'node:assert'
import { Then } from '@cucumber/cucumber'
import { timeout } from '@toa.io/generic'

import * as stage from './.workspace/components/index.js'

/**
 * A receiver has its own consumer, which a halt closes and a rebuild opens again. What says
 * it is consuming is a change it was not told about directly arriving as one it counts.
 */
Then(
  'the {component} eventually counts the change',
  /**
   * @param {string} id
   * @this {toa.features.Context}
   */
  async function (id) {
    const subject = this.reply?.id

    assert.ok(subject !== undefined, 'Nothing was written to be counted')

    const remote = await stage.remote(id)

    try {
      await until(async () => {
        const reply = await remote.invoke('observe', { query: { id: subject } })

        return (reply?.output ?? reply)?.count > 0
      }, `${id} never counted the change`)
    } finally {
      await remote.disconnect()
    }
  }
)

/**
 * A pulse is called from the clock rather than by anyone, and the count is the build's own —
 * so one that came back counts up from where the new build started, not from where the old
 * one stopped.
 */
Then(
  'the {token} is called on its cadence again',
  /**
   * @param {string} id
   * @this {toa.features.Context}
   */
  async function (id) {
    const remote = await stage.remote(id)

    /*
     * The component cannot report nought without breaking its own output contract — `n` is
     * the cycle of the last call and there has not been one — so a refusal here is the
     * answer `0`, and any other refusal is the scenario's to fail on.
     */
    const calls = async () => {
      try {
        const reply = await remote.invoke('calls', { input: { least: 1 } })

        return (reply?.output ?? reply)?.calls ?? 0
      } catch (error) {
        if (error?.cause?.output?.calls === 0) return 0

        throw error
      }
    }

    try {
      // it rests on atomicity, which agrees a slot over two consecutive intervals
      await until(async () => (await calls()) > 0, `${id} was never called`)

      const first = await calls()

      await until(async () => (await calls()) > first, `${id} was called once and no more`)
    } finally {
      await remote.disconnect()
    }
  }
)

/**
 * A delayed call is dispatched by a scan the metronome runs on its own period, which a halt
 * takes down with everything else. What says it is scanning again is a row coming due and
 * being called.
 */
Then(
  'the {token} eventually marks {token}',
  /**
   * @param {string} id
   * @param {string} note
   * @this {toa.features.Context}
   */
  async function (id, note) {
    const remote = await stage.remote(`default.${id}`)

    try {
      await until(async () => {
        const reply = await remote.invoke('marks', {})

        return ((reply?.output ?? reply) ?? []).includes(note)
      }, `${id} never marked '${note}'`)
    } finally {
      await remote.disconnect()
    }
  }
)

/**
 * @param {() => Promise<boolean>} condition
 * @param {string} failure
 */
async function until(condition, failure) {
  const deadline = Date.now() + LIMIT

  while (Date.now() < deadline) {
    if (await condition()) return

    await timeout(POLL)
  }

  assert.fail(failure)
}

const LIMIT = 40_000
const POLL = 500

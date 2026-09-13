import assert from 'node:assert'
import { Then } from '@cucumber/cucumber'
import { deliveries } from '@toa.io/core'

const DEADLINE = 5000
const POLL = 50

/**
 * What the process is handling. The scenario boots the composition in this process, so the
 * count is this process's own.
 *
 * @returns {number}
 */
function handling() {
  return deliveries.inflight()
}

Then(
  'the process is eventually handling {int} delivery/deliveries',
  /**
   * A delivery is published, routed and dispatched before it is handled, so the rising edge
   * is waited for rather than read.
   *
   * @param {number} count
   */
  async function (count) {
    const deadline = Date.now() + DEADLINE
    let read = handling()

    while (read !== count && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, POLL))

      read = handling()
    }

    assert.equal(read, count, `The process is handling ${read}, not ${count}`)
  }
)

Then(
  'the process is handling nothing',
  /**
   * Read rather than waited for: the count drops before the reply is published, so by the
   * time a caller has its answer the handler is already uncounted.
   */
  function () {
    const read = handling()

    assert.equal(read, 0, `The process is handling ${read}`)
  }
)

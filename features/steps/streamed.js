import assert from 'node:assert'
import { Then, When } from '@cucumber/cucumber'

/**
 * A request to the port streamed calls are served on, made by hand rather than by a caller: what
 * a caller would never send is what reaches the port all the same.
 */
When(
  'a request to {string} on the streamed calls port carries {string} at {string}',
  /**
   * @param {string} path
   * @param {string} header
   * @param {string} at
   * @this {toa.features.Context}
   */
  async function (path, header, at) {
    const response = await fetch(`http://127.0.0.1:31006${path}`, {
      method: 'POST',
      headers: { 'toa-request': header, 'toa-stream': at },
      body: 'bytes'
    })

    await response.arrayBuffer()

    this.streamed = response.status
  }
)

Then(
  'it is answered {int}',
  /**
   * @param {number} status
   * @this {toa.features.Context}
   */
  function (status) {
    assert.equal(this.streamed, status)
  }
)

Then(
  'no object of the process has a {string}',
  /** @param {string} property */
  function (property) {
    assert.equal(property in {}, false, `Every object of the process has '${property}'`)
  }
)

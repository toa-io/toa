import assert from 'node:assert'
import { When, Then } from '@cucumber/cucumber'
import { exceptions } from '@toa.io/core'
import { halt, restore } from '@toa.io/userland/stage'

When(
  'the process goes quiet',
  /**
   * Stands in for what a halt signal does, which this stage has not got yet.
   */
  async function () {
    await halt()
  }
)

When('the process is working again', async function () {
  await restore()
})

Then(
  'invoking {token} is refused as disposed',
  /**
   * @param {string} endpoint
   * @this {toa.features.Context}
   */
  async function (endpoint) {
    const component = /** @type {import('@toa.io/core').Component} */ this.connector

    await assert.rejects(
      () => component.invoke(endpoint, {}),
      (error) => error.code === exceptions.codes.Disposed
    )
  }
)

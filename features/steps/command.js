import assert from 'node:assert/strict'
import { timeout } from '@toa.io/generic'

import { execute } from './.command/execute.js'

import { When, Then } from '@cucumber/cucumber'

When(
  'I run {command}',
  /**
   * @param {string} command
   * @return {Promise<void>}
   */
  async function (command) {
    if (this.process) await this.process

    this.process = execute.call(this, command)

    // a program that exits is awaited, one that keeps running is awaited until it falls
    // quiet, and one that does neither is given a bound
    await Promise.any([timeout(GRACE), this.process, this.settled])
  }
)

// as a process that crashes leaves it: no shutdown, nothing withdrawn
When('I kill execution', async function () {
  this.controller.kill()

  await this.process
})

When('I abort execution', async function () {
  this.controller.abort()

  await this.process

  assert.equal(this.aborted, true, 'Program exited before abortion')
})

Then('program should exit', async function () {
  await this.process
})

Then(
  'program should exit with code {int}',
  /**
   * @param {number} code
   * @this {toa.features.Context}
   */
  async function (code) {
    await this.process

    assert.equal(this.exitCode, code, `Program exit code is not ${code}\n${this.stderr}`)
  }
)

/** What a program that neither exits nor falls quiet is given. */
const GRACE = 10000

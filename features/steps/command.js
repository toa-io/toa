'use strict'

const assert = require('node:assert/strict')
const { timeout } = require('@toa.io/generic')

const { execute } = require('./.command/execute')

const { When, Then } = require('@cucumber/cucumber')

When('I run {command}',
  /**
   * @param {string} command
   * @return {Promise<void>}
   */
  async function (command) {
    if (this.process) await this.process

    this.process = execute.call(this, command)

    const grace = timeout(10000)

    await Promise.any([grace, this.process])
  })

When('I abort execution', async function () {
  this.controller.abort()

  await this.process

  assert.equal(this.aborted, true, 'Program exited before abortion')
})

Then('program should exit', async function () {
  await this.process
})

Then('program should exit with code {int}',
  /**
   * @param {number} code
   * @this {toa.features.Context}
   */
  async function (code) {
    await this.process
    assert.equal(this.exitCode, code, `Program exit code is not ${code}\n${this.stderr}`)
  })

'use strict'

const assert = require('node:assert')
const { Then } = require('@cucumber/cucumber')

Then('{word} should be version',
  /**
   * @param {string} channel
   * @this {toa.features.cli.Context}
   */
  function (channel) {
    const { version } = require('@toa.io/runtime')

    assert.equal(this[channel], version)
  })

Then('{word} should contain {int} line(s)', function (channel, lines) {
  assert.equal(this[channel + 'Lines'].length, lines, `${channel} contains ${this[channel].length} lines, ${lines} expected`)
})

Then('{word} should be empty', function (channel) {
  assert.equal(this[channel], '')
})

Then('program should exit', async function () {
  await this.process
})

Then('{word} should contain lines:',
  function (channel, lines) {
    const queries = lines.split('\n').map((line) => line.trim())

    for (const query of queries) {
      const found = this[channel + 'Lines'].find((actual) => compare(actual, query))

      assert.notEqual(found, undefined, 'Line not found: ' + query)
    }
  })

Then('{word} should be: {string}',
  function (channel, line) {
    const actual = this[channel]
    const equal = compare(actual, line)

    assert.equal(equal, true)
  })

/**
 * @param {string} reference
 * @param {string} line
 * @returns {boolean}
 */
const compare = (reference, line) => {
  const request = line.trim()
  const actual = reference.trim().substring(0, request.length)

  return actual === request
}

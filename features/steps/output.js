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

Then('{word} should contain line(s):',
  function (channel, lines) {
    find(this, channel, lines)
  })

Then('{word} should contain line(s) once:',
  function (channel, lines) {
    find(this, channel, lines, 1)
  })

Then('{word} should be: {string}',
  function (channel, line) {
    const actual = this[channel]
    const equal = compare(actual, line)

    assert.equal(equal, true)
  })

/**
 * @param {toa.features.Context} context
 * @param {string} channel
 * @param {string} lines
 * @param {number} [exact]
 * @returns {number[]}
 */
const find = (context, channel, lines, exact = undefined) => {
  const queries = lines.split('\n').map((line) => line.trim())

  /** @type {number[]} */
  const count = []

  for (const query of queries) {
    const output = context[channel + 'Lines']
    let matches = 0

    for (const line of output) {
      const similar = compare(line, query)

      if (similar) matches++
    }

    count.push(matches)

    assert.notEqual(matches, 0, 'Line not found: ' + query)

    if (exact !== undefined) {
      assert.equal(matches, exact, 'Line found multiple times: ' + query)
    }
  }

  return count
}

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

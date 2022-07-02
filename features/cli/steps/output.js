'use strict'

const assert = require('node:assert')
const { Then } = require('@cucumber/cucumber')

Then('{word} line {int} should contain version', function (channel, line) {
  const { version } = require('@toa.io/runtime')

  assert.equal(this[channel + 'Lines'][line - 1], version)
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

Then('{word} should contain lines:', function (channel, lines) {
  const queries = lines.split('\n').map((line) => line.trim())

  for (const query of queries) {
    const found = this[channel + 'Lines'].find((actual) => actual.trim().substring(0, query.length) === query)

    assert.notEqual(found, undefined, 'Line not found: ' + query)
  }
})

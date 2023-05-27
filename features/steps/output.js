'use strict'

const assert = require('node:assert')
const { Then } = require('@cucumber/cucumber')

Then('{word} should be the version',
  /**
   * @param {string} channel
   * @this {toa.features.Context}
   */
  async function (channel) {
    const { version } = require('@toa.io/runtime')

    await this.process

    assert.equal(this[channel], version)
  })

Then('{word} should contain {int} line(s)', async function (channel, lines) {
  await this.process

  assert.equal(this[channel + 'Lines'].length, lines, `${channel} contains ${this[channel].length} lines, ${lines} expected`)
})

Then('{word} should be empty', async function (channel) {
  await this.process

  assert.equal(this[channel], '')
})

Then('{word} should contain line(s):',
  async function (channel, lines) {
    await this.process

    find(this, channel, lines)
  })

Then('{word} should not contain line(s):',
  async function (channel, lines) {
    await this.process

    find(this, channel, lines, undefined, true)
  })

Then('{word} should contain line(s) once:',
  async function (channel, lines) {
    await this.process

    find(this, channel, lines, 1)
  })

Then('{word} should be: {string}',
  async function (channel, line) {
    await this.process

    const actual = this[channel]
    const equal = compare(actual, line)

    assert.equal(equal, true)
  })

/**
 * @param {toa.features.Context} context
 * @param {string} channel
 * @param {string} lines
 * @param {number} [exact]
 * @param {boolean} [reverse]
 * @returns {number[]}
 */
const find = (context, channel, lines, exact = undefined, reverse = false) => {
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

    assert[reverse ? 'equal' : 'notEqual'](matches, 0, 'Line not found: ' + query)

    if (exact !== undefined) {
      assert[reverse ? 'notEqual' : 'equal'](matches, exact, 'Line found multiple times: ' + query)
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
  const search = reference.trim()
  const request = line.trim()
  const escaped = request.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')
  const expression = escaped.replaceAll(/<[^>]{1,32}>/g, substituteExpression)
  const rx = new RegExp(`^${expression}`)

  return rx.test(search)
}

function substituteExpression (expression) {
  if (!(expression in expressions)) return expression
  else return expressions[expression]
}

const expressions = {
  '<\\.\\.\\.>': '.+'
}

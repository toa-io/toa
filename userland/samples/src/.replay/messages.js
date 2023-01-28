'use strict'

const { binding } = require('@toa.io/userland/stage').binding

const translate = require('./translate')

/**
 * @param {toa.samples.messages.Set} messages
 * @param {any} test
 * @param {boolean} autonomous
 * @param {string} component
 * @return {Promise<void>}
 */
const messages = async (messages, test, autonomous, component) => {
  for (const [label, samples] of Object.entries(messages)) {
    await test.test(label, message(label, samples, autonomous, component))
  }
}

/**
 * @param {string} label
 * @param {toa.samples.Message[]} samples
 * @param {boolean} autonomous
 * @param {string} component
 * @returns {function}
 */
const message = (label, samples, autonomous, component) =>
  async (test) => {
    let n = 0

    for (const sample of samples) {
      n++

      const message = translate.message(sample, autonomous, component)
      const name = sample.title ?? 'Sample #' + n

      await test.test(name, async () => binding.emit(label, message))
    }
  }

exports.messages = messages

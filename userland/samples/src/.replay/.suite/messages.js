'use strict'

const { binding } = require('@toa.io/userland/stage').binding

const translate = require('./translate')

/**
 * @param {toa.samples.messages.Set} messages
 * @param {boolean} autonomous
 * @return {Function}
 */
const messages = (messages, autonomous) =>
  async (test) => {
    for (const [label, samples] of Object.entries(messages)) {
      await test.test(label, message(label, samples, autonomous))
    }
  }

/**
 * @param {string} label
 * @param {toa.samples.Message[]} samples
 * @param {boolean} autonomous
 * @returns {function}
 */
const message = (label, samples, autonomous) =>
  async (test) => {
    let n = 0

    for (const sample of samples) {
      n++

      const message = translate.message(sample, autonomous)
      const name = sample.title ?? 'Sample #' + n

      await test.test(name, async () => binding.emit(label, message))
    }
  }

exports.messages = messages

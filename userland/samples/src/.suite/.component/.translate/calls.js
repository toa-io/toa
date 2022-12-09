'use strict'

const { defined } = require('@toa.io/libraries/generic')

/**
 * @param {toa.samples.operations.declaration.context.Calls} calls
 * @returns {toa.samples.operations.context.Calls}
 */
const calls = (calls) => {
  const output = {}

  for (let [endpoint, samples] of Object.entries(calls)) {
    if (!Array.isArray(samples)) samples = [samples]

    const target = []

    output[endpoint] = target

    for (const sample of samples) {
      const translation = call(sample)

      target.push(translation)
    }
  }

  return output
}

/**
 * @param {toa.samples.declaration.context.Call} call
 * @returns {toa.samples.Call}
 */
const call = (call) => {
  let request
  let reply

  const sample = {}
  const { input, query, output } = call

  if (input !== undefined || query !== undefined) request = defined({ input, query })
  if (output !== undefined) reply = { output }
  if (request !== undefined) sample.request = request
  if (reply !== undefined) sample.reply = reply

  return sample
}

exports.calls = calls

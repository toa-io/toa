'use strict'

const { defined } = require('@toa.io/libraries/generic')

/**
 * @param {toa.samples.operation.Calls} calls
 * @returns {toa.sampling.request.context.Calls}
 */
const calls = (calls) => {
  /** @type {toa.sampling.request.context.Calls} */
  const output = {}

  for (let [endpoint, samples] of Object.entries(calls)) {
    if (!Array.isArray(samples)) samples = [samples]

    const target = []

    for (const sample of samples) {
      const translation = call(sample)

      target.push(translation)
    }

    output[endpoint] = target
  }

  return output
}

/**
 * @param {toa.samples.operation.Call} call
 * @returns {toa.sampling.request.context.Call}
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

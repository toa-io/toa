'use strict'

/**
 * @param {toa.samples.declaration.context.Calls} calls
 * @returns {toa.samples.context.Calls}
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
  const { input, output } = call
  const request = input === undefined ? undefined : { input }
  const reply = output === undefined ? undefined : { output }
  const sample = {}

  if (request !== undefined) sample.request = request
  if (reply !== undefined) sample.reply = reply

  return sample
}

exports.calls = calls

'use strict'

const { resolve } = require('node:path')
const { load } = require('@toa.io/libraries/schema')

const path = resolve(__dirname, 'sample.cos.yaml')
const schema = load(path)

/**
 * @param {toa.samples.Declaration} declaration
 * @returns {toa.samples.Sample}
 */
const translate = (declaration) => {
  schema.validate(declaration)

  const { title, input, output, context } = declaration
  const request = { input }
  const reply = { output }

  let ctx

  if (context !== undefined) {
    const local = calls(context.local)

    if (local !== undefined) ctx = { local }
  }

  /** @type {toa.samples.Sample} */
  const sample = { title, request, reply }

  if (ctx) sample.context = ctx

  return sample
}

/**
 * @param {toa.samples.declaration.context.Calls} calls
 * @returns {toa.samples.context.Calls | undefined}
 */
const calls = (calls) => {
  if (calls === undefined) return

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

  return {
    request: { input },
    reply: { output }
  }
}

exports.translate = translate

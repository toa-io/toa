'use strict'

const { resolve } = require('node:path')
const { defined, empty } = require('@toa.io/libraries/generic')
const { load } = require('@toa.io/libraries/schema')

const path = resolve(__dirname, 'sample.cos.yaml')
const schema = load(path)

/**
 * @param {toa.samples.Declaration} declaration
 * @returns {toa.samples.Sample}
 */
const translate = (declaration) => {
  schema.validate(declaration)

  const { title, input, output, local, remote, current, next } = declaration
  const request = { input }
  const reply = { output }
  const storage = { current, next }

  /** @type {toa.samples.Context} */
  let context = {}

  if (local !== undefined) context.local = calls(local)
  if (remote !== undefined) context.remote = calls(remote)

  /** @type {toa.samples.Sample} */
  const sample = { title, request, reply, context, storage }

  cleanup(sample)

  return sample
}

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

/**
 * @param {toa.samples.Sample} sample
 */
const cleanup = (sample) => {
  for (const [key, value] of Object.entries(sample)) {
    if (value === undefined || empty(defined(value))) delete sample[key]
  }
}

exports.translate = translate

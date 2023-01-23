'use strict'

const { resolve } = require('node:path')
const { load } = require('@toa.io/libraries/schema')
const norm = require('./.operation')

const path = resolve(__dirname, './.operation/sample.cos.yaml')
const schema = load(path)

/**
 * @param {toa.samples.Operation} declaration
 * @returns {toa.sampling.request.Sample}
 */
const operation = (declaration) => {
  norm.prepare(declaration)
  schema.validate(declaration)

  const { title, input, output, local, remote, current, next, extensions } = declaration
  const request = { input }
  const reply = { output }
  const storage = { current, next }

  /** @type {toa.sampling.request.Context} */
  let context = {}

  /** @type {toa.sampling.request.Events} */
  let events

  if (local !== undefined) context.local = norm.calls(local)
  if (remote !== undefined) context.remote = norm.calls(remote)
  if (declaration.events !== undefined) events = norm.events(declaration.events)

  const sample = /** @type {toa.sampling.request.Sample} */ {
    title,
    request,
    reply,
    context,
    storage,
    events,
    extensions
  }

  norm.cleanup(sample)

  return sample
}

exports.operation = operation

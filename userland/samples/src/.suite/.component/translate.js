'use strict'

const { resolve } = require('node:path')
const { load } = require('@toa.io/libraries/schema')
const norm = require('./.translate')

const path = resolve(__dirname, 'sample.cos.yaml')
const schema = load(path)

/**
 * @param {toa.samples.operations.Declaration} declaration
 * @returns {toa.samples.Sample}
 */
const translate = (declaration) => {
  norm.prepare(declaration)
  schema.validate(declaration)

  const { title, input, output, local, remote, current, next, extensions } = declaration
  const request = { input }
  const reply = { output }
  const storage = { current, next }

  /** @type {toa.samples.operations.Context} */
  let context = {}

  /** @type {toa.samples.messages.Set} */
  let events

  if (local !== undefined) context.local = norm.calls(local)
  if (remote !== undefined) context.remote = norm.calls(remote)
  if (declaration.events !== undefined) events = norm.events(declaration.events)

  /** @type {toa.samples.Sample} */
  const sample = { title, request, reply, context, storage, events, extensions }

  norm.cleanup(sample)

  return sample
}

exports.translate = translate

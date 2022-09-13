'use strict'

const { resolve } = require('node:path')
const { load } = require('@toa.io/libraries/schema')
const normalize = require('./.translate')

const path = resolve(__dirname, 'sample.cos.yaml')
const schema = load(path)

/**
 * @param {toa.samples.Declaration} declaration
 * @returns {toa.samples.Sample}
 */
const translate = (declaration) => {
  normalize.prepare(declaration)
  schema.validate(declaration)

  const { title, input, output, local, remote, current, next, extensions } = declaration
  const request = { input }
  const reply = { output }
  const storage = { current, next }

  /** @type {toa.samples.Context} */
  let context = {}

  if (local !== undefined) context.local = normalize.calls(local)
  if (remote !== undefined) context.remote = normalize.calls(remote)

  /** @type {toa.samples.Sample} */
  const sample = { title, request, reply, context, storage, extensions }

  normalize.cleanup(sample)

  return sample
}

exports.translate = translate

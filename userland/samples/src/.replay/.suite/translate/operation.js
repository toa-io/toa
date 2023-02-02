'use strict'

const transform = require('./.operation')
const { schemas } = require('./schemas')

const schema = schemas.schema('operation')

/**
 * @param {toa.samples.Operation} declaration
 * @param {boolean} autonomous
 * @returns {toa.sampling.Request}
 */
const operation = (declaration, autonomous) => {
  transform.prepare(declaration)
  schema.validate(declaration)

  const { title, input, output, local, remote, current, next, extensions } = declaration
  const reply = { output }
  const storage = { current, next }

  /** @type {toa.sampling.request.Context} */
  let context = {}

  /** @type {toa.sampling.request.Events} */
  let events

  if (local !== undefined) context.local = transform.calls(local)
  if (remote !== undefined) context.remote = transform.calls(remote)
  if (declaration.events !== undefined) events = transform.events(declaration.events)

  const sample = /** @type {toa.sampling.request.Sample} */ {
    authentic: true,
    autonomous,
    title,
    reply,
    context,
    storage,
    events,
    extensions
  }

  transform.cleanup(sample)

  return { input, sample }
}

exports.operation = operation

'use strict'

const { resolve } = require('node:path')
const { load } = require('@toa.io/libraries/schema')
const { match } = require('@toa.io/libraries/generic')
const { SampleException, ReplyException } = require('./exceptions')

const path = resolve(__dirname, 'sample.cons.yaml')
const schema = load(path)

/**
 * @param {toa.sampling.Sample} sample
 */
const validate = (sample) => {
  if (sample === undefined) return

  const error = schema.fit(sample)

  if (error !== null) return new SampleException(error)
}

/**
 * @param {toa.sampling.Sample} sample
 * @param {toa.core.Reply} reply
 */
const verify = (sample, reply) => {
  const matches = match(reply, sample.reply)

  if (matches === false) return new ReplyException('reply mismatch')
}

exports.validate = validate
exports.verify = verify

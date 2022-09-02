'use strict'

const { resolve } = require('node:path')
const { load } = require('@toa.io/libraries/schema')
const { match } = require('@toa.io/libraries/generic')
const { SampleException, ReplyException } = require('./exceptions')

const path = resolve(__dirname, 'sample.cos.yaml')
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
 * @returns {ReplyException | null}
 */
const verify = (sample, reply) => {
  const matches = match(reply, sample.reply)

  if (matches === false) return new ReplyException('reply mismatch')
  else return null
}

exports.validate = validate
exports.verify = verify

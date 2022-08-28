'use strict'

const { exceptions: { SystemException } } = require('@toa.io/core')

class SamplingException extends SystemException {
  constructor (code, message) {
    message = 'Sampling: ' + message

    const error = { code, message }

    super(error)
  }
}

class SampleException extends SamplingException {
  constructor (error) {
    super(RANGE + 1, error.message)
  }
}

class ReplyException extends SamplingException {
  constructor (message) {
    super(RANGE + 2, message)
  }
}

const RANGE = 1000

exports.SampleException = SampleException
exports.ReplyException = ReplyException

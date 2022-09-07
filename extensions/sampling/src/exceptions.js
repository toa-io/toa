'use strict'

const { exceptions: { Exception } } = require('@toa.io/core')

class SamplingException extends Exception {
  constructor (code, message) {
    message = 'Sampling: ' + message

    super(code, message)
  }
}

class SampleException extends SamplingException {
  constructor (error) {
    super(RANGE + 1, error.message)
  }
}

class ReplayException extends SamplingException {
  constructor (message) {
    super(RANGE + 2, message)
  }
}

const RANGE = 1000

exports.SampleException = SampleException
exports.ReplayException = ReplayException

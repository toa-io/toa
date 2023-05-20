'use strict'

const { diff } = require('jest-diff')
const { exceptions: { Exception } } = require('@toa.io/core')

class SamplingException extends Exception {
  constructor (code, message) {
    message = 'Sampling: ' + message

    super(code, message)
  }
}

class SampleException extends SamplingException {
  constructor (message) {
    super(RANGE + 1, message)
  }
}

class ReplayException extends SamplingException {
  constructor (message, actual, expected) {
    super(RANGE + 2, message)

    if (actual !== undefined && expected !== undefined) this.diff = diff(expected, actual, DIFF_OPTIONS)
  }
}

const RANGE = 1000

const DIFF_OPTIONS = {
  aColor: (t) => t,
  bColor: (t) => t,
  changeColor: (t) => t,
  commonColor: (t) => t,
  patchColor: (t) => t
}

exports.SampleException = SampleException
exports.ReplayException = ReplayException

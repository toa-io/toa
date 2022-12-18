'use strict'

const tap = require('tap')
const { AfterAll } = require('@cucumber/cucumber')

AfterAll(() => {
  tap.end()

  // monkey patch to prevent tap setting exitCode=1
  // required for scenarios where failed tests are expected
  process.removeAllListeners('beforeExit')
  process.removeAllListeners('exit')
})

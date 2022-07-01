'use strict'

const assert = require('node:assert')
const { resolve } = require('node:path')

const { BeforeAll, Before } = require('@cucumber/cucumber')

BeforeAll(() => {
  process.env.TOA_ENV = 'local'
  process.env.TOA_DEBUG = '1'
})

Before(function () {
  process.chdir(ROOT)

  assert.equal(process.cwd(), ROOT)

  delete this.cwd
})

const ROOT = resolve(__dirname, '../../../')

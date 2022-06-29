'use strict'

const { BeforeAll } = require('@cucumber/cucumber')

BeforeAll(() => {
  process.env.TOA_ENV = 'local'
  process.env.TOA_DEBUG = '1'
})

'use strict'

const { BeforeAll, Before } = require('@cucumber/cucumber')

BeforeAll(() => {
  process.env.TOA_ENV = 'local'
  process.env.TOA_DEBUG = '1'
})

Before(function () {
  delete this.cwd
})

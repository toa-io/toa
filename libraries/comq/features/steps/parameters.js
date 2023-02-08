'use strict'

const { defineParameterType } = require('@cucumber/cucumber')

defineParameterType({
  name: 'token',
  regexp: /`(\w+)`/,
  transformer: (token) => token
})

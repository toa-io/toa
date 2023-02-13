'use strict'

const { defineParameterType } = require('@cucumber/cucumber')

defineParameterType({
  name: 'token',
  regexp: /`(\w+)`/,
  transformer: (token) => token
})

defineParameterType({
  name: 'quantity',
  regexp: /\d+(?:.\d+)?[^\d\W]*/,
  transformer: (value) => value
})

defineParameterType({
  name: 'number',
  regexp: /\d+(?:.\d+)?/,
  transformer: (value) => Number(value)
})

'use strict'

const { defineParameterType } = require('@cucumber/cucumber')

defineParameterType({
  name: 'operation',
  regexp: /`(\w+)`/,
  transformer: (name) => name
})

defineParameterType({
  name: 'component',
  regexp: /`(\w+.\w+)`/,
  transformer: (id) => id
})

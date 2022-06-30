'use strict'

const { defineParameterType } = require('@cucumber/cucumber')

defineParameterType({
  name: 'helm-artifact',
  regexp: /Chart|values/,
  transformer: (artifact) => artifact
})

'use strict'

const { defineParameterType } = require('@cucumber/cucumber')

defineParameterType({
  name: 'path',
  regexp: /\.\/[^'\s]*|\/toa(?:\/\w+)*\/?/,
  transformer: (path) => path
})

defineParameterType({
  name: 'component',
  regexp: /`(\w+.\w+)`/,
  transformer: (name) => name
})

defineParameterType({
  name: 'label',
  regexp: /\w+.\w+.\w+/,
  transformer: (name) => name
})

defineParameterType({
  name: 'token',
  regexp: /`(\w+)`/,
  transformer: (token) => token
})

defineParameterType({
  name: 'command',
  regexp: /`(.+)`/,
  transformer: (cmd) => cmd
})

defineParameterType({
  name: 'helm-artifact',
  regexp: /Chart|values/,
  transformer: (artifact) => artifact
})

defineParameterType({
  name: 'storage',
  regexp: /PostgreSQL/,
  transformer: (name) => name
})

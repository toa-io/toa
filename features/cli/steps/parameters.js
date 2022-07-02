'use strict'

const { defineParameterType } = require('@cucumber/cucumber')

defineParameterType({
  name: 'path',
  regexp: /\.\/[^'\s]*/,
  transformer: (path) => path
})

defineParameterType({
  name: 'component',
  regexp: /\w+.\w+/,
  transformer: (name) => name
})

defineParameterType({
  name: 'command',
  regexp: /`toa (.+)`/,
  transformer: (cmd) => 'toa ' + cmd
})

defineParameterType({
  name: 'arguments',
  regexp: /./,
  transformer: (string) => string
})

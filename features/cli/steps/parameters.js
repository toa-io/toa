'use strict'

const { resolve } = require('node:path')
const { defineParameterType } = require('@cucumber/cucumber')

defineParameterType({
  name: 'path',
  regexp: /\.\/[^'\s]*/,
  transformer: (path) => resolve(__dirname, '../../../', path)
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

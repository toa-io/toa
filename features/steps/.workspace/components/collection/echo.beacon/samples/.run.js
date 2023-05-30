'use strict'

const { resolve, join } = require('node:path')
const { components } = require('@toa.io/userland/samples')

;(async () => {
  await components([resolve('..')])
})()

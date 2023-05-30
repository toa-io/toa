'use strict'

const { resolve, join } = require('node:path')
const dotenv = require('dotenv')
const { components } = require('@toa.io/userland/samples')

;(async () => {
  await components([resolve('..')])
})()

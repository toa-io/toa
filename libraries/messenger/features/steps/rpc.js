'use strict'

const { join } = require('node:path')
const { Given } = require('@cucumber/cucumber')

Given('function {token} is replying {token} request queue',
  async function (func, queue) {
    const ref = join('./functions', func)
    const mod = require(ref)
    const reply = mod[func]

    console.log(reply)
  })

'use strict'

const { join } = require('node:path')
const { directory } = require('@toa.io/libraries/generic')
const { Before, After } = require('@cucumber/cucumber')

Before(async function () {
  this.directory = await directory.temp()

  const context = join(this.directory, 'context')

  await directory.ensure(context)
})

After(async function () {
  if (this.directory !== undefined) {
    await directory.remove(this.directory)
    this.directory = undefined
  }
})

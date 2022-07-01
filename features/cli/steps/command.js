'use strict'

const assert = require('node:assert')

const { execute } = require('./.command/execute')

const { When } = require('@cucumber/cucumber')

When('I run {command}', function (command) {
  this.process = execute.call(this, command)
})

When('abort', async function () {
  this.controller.abort()

  await this.process

  assert.equal(this.aborted, true, 'Program exited before abortion')
})

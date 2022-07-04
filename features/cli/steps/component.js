'use strict'

const { directory } = require('@toa.io/libraries/filesystem')

const { Given } = require('@cucumber/cucumber')

const { set } = require('./directory')
const { copy } = require('./.components')

Given('I have a component {component}',
  async function (component) {
    const temp = await directory.temp()

    await directory.ensure(temp)
    await copy(component, temp)

    set(this, temp)
  })

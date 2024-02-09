'use strict'

const { Given, After, Before } = require('@cucumber/cucumber')
const { parse } = require('@toa.io/yaml')
const { encode } = require('@toa.io/generic')

Given('an environment variable {token} is set to {string}',
  setEnv)

Given('an encoded environment variable {token} is set to:',
  function (name, yaml) {
    const value = parse(yaml)
    const encoded = encode(value)

    setEnv.call(this, name, encoded)
  })

function setEnv (name, value) {
  this.env.push(name)

  process.env[name] = value
}

Before(
  /**
   * @this {toa.features.Context}
   */
  function () {
    this.env = []
  })

After(
  /**
   * @this {toa.features.Context}
   */
  function () {
    for (const variable of this.env)
      delete process.env[variable]
  })

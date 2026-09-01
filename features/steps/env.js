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
  // what it was, not that it was set: a scenario overriding one the suite relies on
  // must leave it as it found it
  this.env.push([name, process.env[name]])

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
    // in reverse, so a variable set more than once comes back to what it was before the first
    for (const [name, value] of this.env.reverse())
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
  })

'use strict'

const { Given, After } = require('@cucumber/cucumber')
const { parse } = require('@toa.io/yaml')
const { encode } = require('msgpackr')

Given('an environment variable {token} is set to {string}',
  setEnv)

Given('an encoded environment variable {token} is set to:',
  function (name, yaml) {
    const value = parse(yaml)
    const encoded = encode(value).toString('base64')

    setEnv.call(this, name, encoded)
  })

function setEnv (name, value) {
  this.env ??= []
  this.env.push(name)

  process.env[name] = value
}

After(
  /**
   * @this {toa.features.Context}
   */
  function () {
    if (this.env !== undefined)
      for (const variable of this.env)
        delete process.env[variable]
  })

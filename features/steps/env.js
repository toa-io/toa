'use strict'

const { Given, After } = require('@cucumber/cucumber')
const { parse } = require('@toa.io/yaml')
const { encode } = require('msgpackr')

Given('an encoded environment variable {token} is set to:',
  function (name, yaml) {
    const value = parse(yaml)
    const encoded = encode(value).toString('hex')

    this.env ??= []
    this.env.push(name)

    process.env[name] = encoded
  })

After(
  /**
   * @this {toa.features.Context}
   */
  function () {
    if (this.env !== undefined)
      for (const variable of this.env)
        delete process.env[variable]
  })

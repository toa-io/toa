'use strict'

const { split } = require('@toa.io/yaml')
const { Given } = require('@cucumber/cucumber')

Given('I have (an )integration sample(s) of {endpoint} operation:',
  /**
   * @param {string} label
   * @param {string} yaml
   * @this {toa.samples.features.Context}
   */
  function (label, yaml) {
    const [namespace, name, endpoint] = label.split('.')
    const samples = /** @type {toa.samples.Message[]} */ split(yaml)

    this.autonomous = false
    this.component = namespace + '.' + name
    this.operation = { endpoint, samples }
  })

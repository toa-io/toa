'use strict'

const { split } = require('@toa.io/libraries/yaml')
const { Given } = require('@cucumber/cucumber')

Given('I have (a )sample(s) for {token} operation of {component}:',
  /**
   * @param {string} endpoint
   * @param {string} component
   * @param {string} yaml
   * @this {toa.samples.features.Context}
   */
  function (endpoint, component, yaml) {
    const samples = /** @type {toa.samples.Declaration[]} */ split(yaml)

    this.component = component
    this.operation = { endpoint, samples }
  })

Given('I have (a )message {label} sample(s) for {component}:',
  /**
   * @param {string} endpoint
   * @param {string} component
   * @param {string} yaml
   * @this {toa.samples.features.Context}
   */
  function (endpoint, component, yaml) {
    const samples = /** @type {toa.samples.Declaration[]} */ split(yaml)

    this.component = component
    this.operation = { endpoint, samples }
  })

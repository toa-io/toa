'use strict'

const components = require('./.workspace/components')
const samples = require('./.workspace/samples')
const context = require('./.workspace/context')

const { Given } = require('@cucumber/cucumber')

Given('I have a component {component}',
  async function (component) {
    await components.copy([component], this.cwd)
  })

Given('I have components:',
  /**
   * @param {import('@cucumber/cucumber').DataTable} table
   */
  async function (table) {
    const list = table.transpose().raw()[0]

    await components.copy(list, this.cwd)
  })

Given('I have a context',
  /**
   * @this {toa.features.Context}
   */
  async function () {
    await context.template(this.cwd)
  })

Given('I have a context with:',
  /**
   * @param {string} [additions]
   * @this {toa.features.Context}
   */
  async function (additions) {
    await context.template(this.cwd, additions)
  })

Given('I have integration samples',
  /**
   * @this {toa.features.Context}
   */
  async function () {
    await samples.copy(this.cwd)
  })

'use strict'

const { copy } = require('./.workspace/components')
const { template } = require('./.workspace/context')

const { Given } = require('@cucumber/cucumber')

Given('I have a component {component}',
  async function (component) {
    await copy([component], this.cwd)
  })

Given('I have components:',
  /**
   * @param {import('@cucumber/cucumber').DataTable} table
   */
  async function (table) {
    const components = table.transpose().raw()[0]

    await copy(components, this.cwd)
  })

Given('I have a context',
  /**
   * @this {toa.features.Context}
   */
  async function () {
    await template(this.cwd)
  })

Given('I have a context with:',
  /**
   * @param {string} [additions]
   * @returns {Promise<void>}
   */
  async function (additions) {
    await template(this.cwd, additions)
  })

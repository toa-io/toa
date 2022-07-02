'use strict'

const { resolve } = require('node:path')

const { Given } = require('@cucumber/cucumber')

Given('my working directory is {path}',
  /**
   * @param {string} path
   * @this {toa.features.cli.Context}
   */
  function (path) {
    const target = resolve(this.cwd, path)

    set(this, target)
  })

/**
 * @param {toa.features.cli.Context} context
 * @param {string} path
 */
const set = (context, path) => {
  process.chdir(path)
  context.cwd = path
}

exports.set = set

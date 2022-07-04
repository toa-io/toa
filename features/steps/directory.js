'use strict'

const { resolve } = require('node:path')

const { Given } = require('@cucumber/cucumber')

Given('my working directory is {path}',
  /**
   * @param {string} path
   * @this {toa.features.Context}
   */
  function (path) {
    const target = path === '/toa' ? ROOT : resolve(this.cwd, path)

    set(this, target)
  })

/**
 * @param {toa.features.Context} context
 * @param {string} path
 */
const set = (context, path) => {
  process.chdir(path)
  context.cwd = path
}

const ROOT = resolve(__dirname, '../../')

exports.set = set

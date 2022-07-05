'use strict'

const assert = require('node:assert')
const { resolve } = require('node:path')
const { file } = require('@toa.io/libraries/filesystem')
const { Given, Then } = require('@cucumber/cucumber')

Given('my working directory is {path}',
  /**
   * @param {string} path
   * @this {toa.features.Context}
   */
  function (path) {
    const target = path === '/toa' ? ROOT : resolve(this.cwd, path)

    process.chdir(target)

    this.cwd = target
  })

Then('the file {path} should contain exact line {string}',
  /**
   * @param {string} relative
   * @param {string} line
   * @this {toa.features.Context}
   */
  async function (relative, line) {
    const pattern = resolve(this.cwd, relative)
    const paths = await file.glob(pattern)

    assert.equal(paths.length > 1, false, `Ambiguous file pattern '${relative}'`)
    assert.equal(paths.length === 0, false, 'File not found')

    const path = paths[0]
    const lines = await file.lines(path)
    const found = lines.some((item) => item === line)

    assert.equal(found, true, `Line '${line}' not found in '${relative}'`)
  })

const ROOT = resolve(__dirname, '../../')

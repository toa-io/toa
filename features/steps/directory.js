'use strict'

const assert = require('node:assert')
const { resolve } = require('node:path')
const { directory, file } = require('@toa.io/filesystem')
const { Given, Then } = require('@cucumber/cucumber')

Given('my working directory is {path}',
  /**
   * @param {string} path
   * @this {toa.features.Context}
   */
  async function (path) {
    let target

    if (path.substring(0, 4) === '/toa') target = toa(path)
    else target = await pattern(this.cwd, path)

    process.chdir(target)

    this.cwd = target
  })

Then('the file {path} contains exact line {string}',
  /**
   * @param {string} relative
   * @param {string} line
   * @this {toa.features.Context}
   */
  async function (relative, line) {
    const lines = await read.call(this, relative)
    const found = lines.some((item) => item === line)

    assert.equal(found, true, `Line '${line}' not found in '${relative}'`)
  })

Then('the file {path} contains line starting with {string}',
  /**
   * @param {string} relative
   * @param {string} prefix
   * @this {toa.features.Context}
   */
  async function (relative, prefix) {
    const lines = await read.call(this, relative)
    const found = lines.some((item) => item.startsWith(prefix))

    assert.equal(found, true, `Line starting with '${prefix}' not found in '${relative}'`)
  })

/**
 * @param {string} relative
 * @this {toa.features.Context}
 * @return {Promise<string[]>}
 */
async function read (relative) {
  const pattern = resolve(this.cwd, relative)
  const paths = await file.glob(pattern)

  check(paths)

  return file.lines(paths[0])
}

/**
 * @param {string} cwd
 * @param {string} path
 * @return {Promise<string>}
 */
async function pattern (cwd, path) {
  const pattern = resolve(cwd, path)
  const paths = await directory.glob(pattern)

  check(paths)

  return paths[0]
}

/**
 * @param {string[]} paths
 */
const check = (paths) => {
  assert.equal(paths.length > 1, false, 'Ambiguous pattern')
  assert.equal(paths.length === 0, false, 'File not found')
}

/**
 * @param {string} path
 * @returns {string}
 */
const toa = (path) => {
  const relative = path.substring(5)

  return resolve(ROOT, relative)
}

const ROOT = resolve(__dirname, '../../')

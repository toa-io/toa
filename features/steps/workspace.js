'use strict'

const assert = require('node:assert')
const { join } = require('node:path')
const dotenv = require('dotenv')
const { diff } = require('jest-diff')
const { subtract } = require('@toa.io/generic')
const { file } = require('@toa.io/filesystem')
const components = require('./.workspace/components')
const context = require('./.workspace/context')

const {
  Given,
  Then,
  After
} = require('@cucumber/cucumber')

Given('I have a component {component}',
  async function(component) {
    await components.copy([component], this.cwd)
  })

Given('I have components:',
  /**
   * @param {import('@cucumber/cucumber').DataTable} table
   */
  async function(table) {
    const list = table.transpose().raw()[0]

    await components.copy(list, this.cwd)
  })

Given('I have a context',
  /**
   * @this {toa.features.Context}
   */
  async function() {
    await context.template(this.cwd)
  })

Given('I have a context with:',
  /**
   * @param {string} [additions]
   * @this {toa.features.Context}
   */
  async function(additions) {
    await context.template(this.cwd, additions)
  })

Then('the environment contains:',
  /**
   * @param {string} [search]
   * @this {toa.features.Context}
   */
  async function(search) {
    const searchLines = search.split('\n')
    const path = join(this.cwd, ENV_FILE)
    const contents = await file.read(path)
    const existingLines = contents.split('\n')
    const diffLines = subtract(searchLines, existingLines)

    assert.equal(diffLines.length, 0,
      'Environment does not contain at least one of the given lines.\n' +
      diff(searchLines, existingLines))
  })

Then('I update an environment with:',
  /**
   * @param {string} update
   * @this {toa.features.Context}
   */
  async function(update) {
    await updateEnv.call(this, update, ENV_FILE)
  })

Then('I update an environment file {label} with:',
  /**
   * @param {string} envFile
   * @param {string} update
   * @this {toa.features.Context}
   */
  async function(envFile, update) {
    await updateEnv.call(this, update, envFile)
  })

Given('environment variables:',
  function(contents) {
    const vars = dotenv.parse(contents)

    for (const [name, value] of Object.entries(vars)) {
      VARS.set(name, process.env[name])
      process.env[name] = value
    }
  })

After(function() {
  for (const [key, value] of VARS) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }

  VARS.clear()
})

async function updateEnv (update, envFile) {
  const path = join(this.cwd, envFile)
  const contents = await file.read(path)
  const oldVars = dotenv.parse(contents)
  const newVars = dotenv.parse(update)
  const merged = { ...oldVars, ...newVars }
  const envLines = Object.entries(merged).map(([key, value]) => `${key}=${value}`)
  const mergedLines = envLines.join('\n')

  await file.write(path, mergedLines)
}

const ENV_FILE = '.env'
const VARS = new Map()

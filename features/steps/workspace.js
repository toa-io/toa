import assert from 'node:assert'
import { join } from 'node:path'
import dotenv from 'dotenv'
import { diff } from 'jest-diff'
import { subtract } from '@toa.io/generic'
import { readFile, writeFile } from 'node:fs/promises'
import * as components from './.workspace/components/index.js'
import * as context from './.workspace/context.js'

import { Given, Then, After } from '@cucumber/cucumber'

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

Given('the context has no {token} annotation',
  /**
   * @param {string} key
   * @this {toa.features.Context}
   */
  async function(key) {
    await context.remove(this.cwd, key)
  })

Then('the environment contains:',
  /**
   * @param {string} [search]
   * @this {toa.features.Context}
   */
  async function(search) {
    const searchLines = search.split('\n')
    const path = join(this.cwd, ENV_FILE)
    const contents = await readFile(path, 'utf8')
    const existingLines = contents.split('\n')
    const diffLines = subtract(searchLines, existingLines)

    assert.equal(diffLines.length, 0,
      'Environment does not contain at least one of the given lines.\n' +
      diff(searchLines, existingLines))
  })

Then('the environment variable {word} starts with {string}',
  /**
   * @param {string} name
   * @param {string} prefix
   * @this {toa.features.Context}
   */
  async function (name, prefix) {
    const path = join(this.cwd, ENV_FILE)
    const contents = await readFile(path, 'utf8')
    const vars = dotenv.parse(contents)

    assert.equal(typeof vars[name], 'string', `Environment variable ${name} is not set`)
    assert.equal(vars[name].startsWith(prefix), true,
      `Environment variable ${name} does not start with '${prefix}': ${vars[name]}`)
  })

Then('I update an environment with:',
  /**
   * @param {string} update
   * @this {toa.features.Context}
   */
  async function(update) {
    await updateEnv.call(this, update, ENV_FILE)
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
  const contents = await readFile(path, 'utf8')
  const oldVars = dotenv.parse(contents)
  const newVars = dotenv.parse(update)
  const merged = { ...oldVars, ...newVars }
  const envLines = Object.entries(merged).map(([key, value]) => `${key}=${value}`)
  const mergedLines = envLines.join('\n')

  await writeFile(path, mergedLines, 'utf8')
}

const ENV_FILE = '.env'
const VARS = new Map()

import assert from 'node:assert'
import { join } from 'node:path'
import dotenv from 'dotenv'
import { diff } from 'jest-diff'
import { environment, subtract } from '@toa.io/generic'
import { appendFile, mkdir, readFile, symlink, writeFile } from 'node:fs/promises'
import * as components from './.workspace/components/index.js'
import * as context from './.workspace/context.js'

import { Given, Then, After } from '@cucumber/cucumber'

Given('I have a component {component}', async function (component) {
  await components.copy([component], this.cwd)
})

Given(
  'I have components:',
  /**
   * @param {import('@cucumber/cucumber').DataTable} table
   */
  async function (table) {
    const list = table.transpose().raw()[0]

    await components.copy(list, this.cwd)
  }
)

Given(
  'the file {word} of {component} changes',
  /**
   * @param {string} file
   * @param {string} component
   * @this {toa.features.Context}
   */
  async function (file, component) {
    await appendFile(join(this.cwd, 'components', component, file), '\n# changed\n', 'utf8')
  }
)

/** What a linked directory of the workspace holds, as the component's own sources. */
const LINKED = "export const linked = 'the linked source'\n"

Given(
  '{component} links sources of the workspace',
  /**
   * Sources a component keeps outside its own directory: a directory of the workspace, linked in
   * at `shared`, as two components sharing code keep it.
   *
   * @param {string} component
   * @this {toa.features.Context}
   */
  async function (component) {
    const shared = join(this.cwd, 'shared')

    await mkdir(shared, { recursive: true })
    await writeFile(join(shared, 'linked.js'), LINKED, 'utf8')

    // as it is written, not as it resolves: the link is the component's, and a copy of the
    // component is expected to carry it
    await symlink(join('..', '..', 'shared'), join(this.cwd, 'components', component, 'shared'))
  }
)

Given(
  'the sources of {component} change',
  /**
   * A version is a hash of a component's sources, so whatever changes them changes it.
   *
   * @param {string} component
   * @this {toa.features.Context}
   */
  async function (component) {
    const path = join(this.cwd, 'components', component, 'manifest.toa.yaml')

    await appendFile(path, '\n# changed\n', 'utf8')
  }
)

Given(
  'I have a context',
  /**
   * @this {toa.features.Context}
   */
  async function () {
    await context.template(this.cwd)
  }
)

Given(
  'I have a context with:',
  /**
   * @param {string} [additions]
   * @this {toa.features.Context}
   */
  async function (additions) {
    await context.template(this.cwd, additions)
  }
)

Given(
  'the context has no {token} annotation',
  /**
   * @param {string} key
   * @this {toa.features.Context}
   */
  async function (key) {
    await context.remove(this.cwd, key)
  }
)

Then(
  'the environment contains:',
  /**
   * @param {string} [search]
   * @this {toa.features.Context}
   */
  async function (search) {
    const searchLines = search.split('\n')
    const path = join(this.cwd, ENV_FILE)
    const contents = await readFile(path, 'utf8')
    const existingLines = contents.split('\n')
    const diffLines = subtract(searchLines, existingLines)

    assert.equal(
      diffLines.length,
      0,
      'Environment does not contain at least one of the given lines.\n' +
        diff(searchLines, existingLines)
    )
  }
)

Then(
  'the environment does not contain:',
  /**
   * @param {string} [search]
   * @this {toa.features.Context}
   */
  async function (search) {
    const searchLines = search.split('\n').filter((line) => line !== '')
    const path = join(this.cwd, ENV_FILE)
    const contents = await readFile(path, 'utf8')
    const existingLines = contents.split('\n')
    const found = searchLines.filter((line) =>
      existingLines.some((existing) => existing.includes(line))
    )

    assert.equal(
      found.length,
      0,
      'Environment contains lines it should not.\n' + diff(searchLines, found)
    )
  }
)

Then(
  'the environment variable {word} starts with {string}',
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
    assert.equal(
      vars[name].startsWith(prefix),
      true,
      `Environment variable ${name} does not start with '${prefix}': ${vars[name]}`
    )
  }
)

Then(
  'the environment variable {word} contains {string}',
  /**
   * @param {string} name
   * @param {string} substring
   * @this {toa.features.Context}
   */
  async function (name, substring) {
    const path = join(this.cwd, ENV_FILE)
    const contents = await readFile(path, 'utf8')
    const vars = dotenv.parse(contents)

    assert.equal(typeof vars[name], 'string', `Environment variable ${name} is not set`)
    assert.equal(
      vars[name].includes(substring),
      true,
      `Environment variable ${name} does not contain '${substring}': ${vars[name]}`
    )
  }
)

Then(
  'I update an environment with:',
  /**
   * @param {string} update
   * @this {toa.features.Context}
   */
  async function (update) {
    await updateEnv.call(this, update, ENV_FILE)
  }
)

Given('environment variables:', function (contents) {
  const vars = dotenv.parse(contents)

  for (const [name, value] of Object.entries(vars)) {
    VARS.set(name, environment.get(name))
    environment.set(name, value)
  }
})

After(function () {
  for (const [key, value] of VARS) {
    if (value === undefined) environment.delete(key)
    else environment.set(key, value)
  }

  VARS.clear()
})

async function updateEnv(update, envFile) {
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

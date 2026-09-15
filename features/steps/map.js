import assert from 'node:assert'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { load as parse } from 'js-yaml'
import { match } from '@toa.io/generic'
import { contract } from '@toa.io/core'
import { Given, Then } from '@cucumber/cucumber'

import * as stage from '@toa.io/userland/stage'
import * as components from './.workspace/components/index.js'

Given(
  'the component map states:',
  /**
   * What a component provides, as this process is given it, by the sources it is the contract
   * of. Two of them may carry one locator — a component and the same component after a change —
   * and the map is what says which of the two a caller is held to.
   *
   * @param {import('@cucumber/cucumber').DataTable} table
   */
  async function (table) {
    const references = table.transpose().raw()[0]
    const contracts = {}

    for (const reference of references) {
      const manifest = await components.load(reference)

      assert.ok(manifest.version !== undefined, `'${reference}' has no version`)

      contracts[manifest.locator.id] = contract.component(manifest)
    }

    stage.map(contracts)
  }
)

Then(
  'the map states for {component}:',
  /**
   * @param {string} id
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function (id, yaml) {
    const entry = await read.call(this, id)
    const expected = parse(yaml)

    assert.equal(match(entry, expected), true, `'${id}' does not state ${yaml}`)
  }
)

Then(
  'the map states no {label} of {component}',
  /**
   * @param {string} key a path within the contract, `entity.storage`
   * @param {string} id
   * @this {toa.features.Context}
   */
  async function (key, id) {
    let value = await read.call(this, id)

    for (const segment of key.split('.')) value = value?.[segment]

    assert.equal(value, undefined, `'${id}' states '${key}': ${JSON.stringify(value)}`)
  }
)

/**
 * @param {string} id
 * @this {toa.features.Context}
 * @returns {Promise<import('@toa.io/core').Contract>}
 */
async function read(id) {
  const contents = await readFile(join(this.cwd, FILE), 'utf8')
  const map = JSON.parse(contents)

  assert.ok(id in map, `The map states nothing of '${id}'`)

  return map[id]
}

const FILE = '.map.json'

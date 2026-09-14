import assert from 'node:assert'
import { Given } from '@cucumber/cucumber'

import * as stage from '@toa.io/userland/stage'
import * as components from './.workspace/components/index.js'

Given(
  'the component map names:',
  /**
   * Which version of a component a lookup in this process asks for, by the sources it is the
   * version of. Two of them may carry one locator — a component and the same component after a
   * change — and the map is what says which of the two answers.
   *
   * @param {import('@cucumber/cucumber').DataTable} table
   */
  async function (table) {
    const references = table.transpose().raw()[0]
    const versions = {}

    for (const reference of references) {
      const manifest = await components.load(reference)

      assert.ok(manifest.version !== undefined, `'${reference}' has no version`)

      versions[manifest.locator.id] = manifest.version
    }

    stage.map(versions)
  }
)

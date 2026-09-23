import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { readFileSync } from 'node:fs'
import { it } from 'node:test'
import assert from 'node:assert/strict'

import { yaml as jsyaml } from '@toa.io/generic'
import { contract } from '@toa.io/core'

/*
 * A contract leaves out what the root prototype gives every entity, and `@toa.io/core` is what
 * puts it back — where the prototype is not installed, so it holds a copy of that declaration.
 * This is what keeps the copy the same as what a component is actually collapsed with.
 */

const path = dirname(createRequire(import.meta.url).resolve('@toa.io/prototype'))
const prototype = jsyaml.load(readFileSync(join(path, 'manifest.toa.yaml'), 'utf8'))

it('should state the system properties the prototype gives', () => {
  const { id, ...system } = prototype.entity.properties

  assert.deepStrictEqual(system, contract.SYSTEM)
  assert.deepStrictEqual(id, contract.ID)
})

it('should require every one of them, and nothing else', () => {
  assert.deepStrictEqual(prototype.entity.required, [
    'id',
    ...Object.keys(contract.SYSTEM)
  ])
})

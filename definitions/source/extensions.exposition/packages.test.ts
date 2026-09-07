import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { installs } from './packages.js'
import { components } from './components.js'

const require = createRequire(import.meta.url)

const root = dirname(require.resolve('@toa.io/extensions.exposition/package.json'))

describe('what the gateway brings', () => {
  it('is what its components declare', () => {
    const declared: Record<string, string> = {}

    for (const label of components().labels) {
      const manifest = join(root, 'components', label.replace('-', '.'), 'package.json')

      if (!existsSync(manifest)) continue

      Object.assign(declared, JSON.parse(readFileSync(manifest, 'utf8')).dependencies)
    }

    assert.ok(Object.keys(declared).length > 0, 'no component declares anything')
    assert.deepEqual(installs(undefined), declared)
  })

  it('is nothing a component that declares the extension needs', () => {
    assert.deepEqual(installs({ manifest: [] }), {})
  })
})

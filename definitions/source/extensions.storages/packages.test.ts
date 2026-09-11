import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

import { packages, installs } from './packages.ts'
import { secrets } from './secrets.ts'
import type { Instance } from './deployment.ts'

const require = createRequire(import.meta.url)

const manifest = JSON.parse(
  readFileSync(require.resolve('@toa.io/extensions.storages/package.json'), 'utf8')
) as { peerDependencies?: Record<string, string> }

const instance = (manifest: string[]): Instance => ({ manifest }) as Instance

describe('the table', () => {
  it('states a provider Toa has', () => {
    for (const provider of Object.keys(packages)) assert.ok(provider in secrets)
  })

  it('states every provider', () => {
    for (const provider of Object.keys(secrets)) assert.ok(provider in packages)
  })

  it('states what the extension declares, at the version it declares', () => {
    const peers = manifest.peerDependencies ?? {}
    const stated: Record<string, string> = {}

    for (const entry of Object.values(packages)) Object.assign(stated, entry)

    assert.deepEqual(stated, peers)
  })
})

describe('the component that serves every storage', () => {
  /*
  `exposition.octets` declares `storages: ~`, so it reaches whichever storages an application
  annotates — and the image the release publishes for the gateway is built once, for every
  application, when none of them is known. So it carries every provider's packages.
  */
  it('declares every provider a storage can name', () => {
    const octets = JSON.parse(
      readFileSync(
        require.resolve('@toa.io/extensions.exposition/components/exposition.octets/package.json'),
        'utf8'
      )
    ) as { dependencies: Record<string, string> }

    const every: Record<string, string> = {}

    for (const entry of Object.values(packages)) Object.assign(every, entry)

    assert.deepEqual(octets.dependencies, every)
  })
})

describe('what a component installs', () => {
  const annotation = {
    pictures: { provider: 'cloudinary' },
    uploads: { provider: 's3' },
    scratch: { provider: 'tmp' }
  }

  it('is the packages of the storages it names', () => {
    assert.deepEqual(installs(instance(['pictures']), annotation), packages.cloudinary)
  })

  it('is nothing where the provider needs nothing', () => {
    assert.deepEqual(installs(instance(['scratch']), annotation), {})
  })

  it('is every provider where it names no storage', () => {
    assert.deepEqual(installs(instance([]), annotation), {
      ...packages.cloudinary,
      ...packages.s3
    })
  })

  it('is nothing where nothing is annotated', () => {
    assert.deepEqual(installs(instance(['pictures']), undefined), {})
  })

  it('ignores a storage the annotation does not declare', () => {
    assert.deepEqual(installs(instance(['absent']), annotation), {})
  })
})

import { it, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { declare, format } from './format.js'

let root

before(async () => {
  root = await mkdtemp(join(tmpdir(), 'format-'))
})

after(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('format', () => {
  it('should read the nearest manifest above', async () => {
    const workspace = join(root, 'modules')
    const component = join(workspace, 'components', 'one')

    await mkdir(component, { recursive: true })
    await writeFile(join(workspace, 'package.json'), JSON.stringify({ type: 'module' }))

    assert.strictEqual(format(component), 'module')
  })

  it('should default to commonjs', async () => {
    const workspace = join(root, 'scripts')
    const component = join(workspace, 'components', 'one')

    await mkdir(component, { recursive: true })
    await writeFile(join(workspace, 'package.json'), JSON.stringify({ name: 'scripts' }))

    assert.strictEqual(format(component), 'commonjs')
  })
})

describe('declare', () => {
  it('should state the format the component was written under', async () => {
    const workspace = join(root, 'stated')
    const source = join(workspace, 'components', 'one')
    const target = join(root, 'image', 'one')

    await mkdir(source, { recursive: true })
    await mkdir(target, { recursive: true })
    await writeFile(join(workspace, 'package.json'), JSON.stringify({ type: 'module' }))

    await declare(source, target, 'default-one')

    const manifest = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))

    assert.strictEqual(manifest.type, 'module')
    assert.strictEqual(manifest.name, 'default-one')
    assert.strictEqual(manifest.private, true)
  })

  it('should leave a manifest the component ships alone', async () => {
    const source = join(root, 'own', 'components', 'one')
    const target = join(root, 'image', 'own')

    await mkdir(source, { recursive: true })
    await mkdir(target, { recursive: true })

    const own = JSON.stringify({ name: 'own', dependencies: { matchacho: '0.6.0' } })

    await writeFile(join(target, 'package.json'), own)
    await declare(source, target, 'default-own')

    assert.strictEqual(await readFile(join(target, 'package.json'), 'utf8'), own)
  })
})

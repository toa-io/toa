import { it, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Locator } from '@toa.io/core'
import { revive } from '@toa.io/norm'

import { declare, format, normalized } from './format.js'

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

describe('normalized', () => {
  it('should write what a process reads instead of normalizing', async () => {
    const target = join(root, 'image', 'normalized')

    await mkdir(target, { recursive: true })

    const component = {
      name: 'tasks',
      namespace: 'todos',
      version: 'abcdef12',
      operations: { compute: { type: 'computation' } },
      path: '/workspace/components/todos.tasks',
      locator: new Locator('tasks', 'todos'),
      packages: { cloudinary: '2.11.0' }
    }

    await normalized(component, target)

    const carried = JSON.parse(
      await readFile(join(target, 'manifest.toa.json'), 'utf8')
    )

    // where the manifest is, and what only a deploy reads, are not what it declares
    assert.ok(!('path' in carried))
    assert.ok(!('locator' in carried))
    assert.ok(!('packages' in carried))

    const read = revive(carried, '/composition/todos-tasks')

    assert.deepStrictEqual(read.operations, component.operations)
    assert.strictEqual(read.version, component.version)
    assert.strictEqual(read.path, '/composition/todos-tasks')
    assert.strictEqual(read.locator.id, 'todos.tasks')
  })
})

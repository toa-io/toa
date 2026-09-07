import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'

/** @type {typeof import('./environment.js').environment} */
let environment

before(async () => {
  // set before the module loads: what the shell handed the process
  process.env.TOA_ENVIRONMENT_TEST_SHELL = 'shell'
  ;({ environment } = await import('./environment.js'))
})

after(() => {
  environment.delete('TOA_ENVIRONMENT_TEST_SHELL')
})

describe('loading', () => {
  it('should absorb TOA_* variables from process.env', () => {
    assert.equal(environment.get('TOA_ENVIRONMENT_TEST_SHELL'), 'shell')
    assert.equal(process.env.TOA_ENVIRONMENT_TEST_SHELL, undefined)
  })
})

describe('get', () => {
  it('should fall back to process.env', () => {
    process.env.TOA_ENVIRONMENT_TEST_FALLBACK = 'fallback'

    assert.equal(environment.get('TOA_ENVIRONMENT_TEST_FALLBACK'), 'fallback')
    assert.equal(environment.has('TOA_ENVIRONMENT_TEST_FALLBACK'), true)

    delete process.env.TOA_ENVIRONMENT_TEST_FALLBACK

    assert.equal(environment.get('TOA_ENVIRONMENT_TEST_FALLBACK'), undefined)
    assert.equal(environment.has('TOA_ENVIRONMENT_TEST_FALLBACK'), false)
  })

  it('should treat an empty string as a value', () => {
    environment.set('TOA_ENVIRONMENT_TEST_EMPTY', '')

    assert.equal(environment.get('TOA_ENVIRONMENT_TEST_EMPTY'), '')
    assert.equal(environment.has('TOA_ENVIRONMENT_TEST_EMPTY'), true)

    environment.delete('TOA_ENVIRONMENT_TEST_EMPTY')
  })
})

describe('set and delete', () => {
  it('should keep a TOA_* variable out of process.env', () => {
    process.env.TOA_ENVIRONMENT_TEST_SET = 'before'
    environment.set('TOA_ENVIRONMENT_TEST_SET', 'after')

    assert.equal(environment.get('TOA_ENVIRONMENT_TEST_SET'), 'after')
    assert.equal(process.env.TOA_ENVIRONMENT_TEST_SET, undefined)

    environment.delete('TOA_ENVIRONMENT_TEST_SET')

    assert.equal(environment.get('TOA_ENVIRONMENT_TEST_SET'), undefined)
  })

  it('should put any other variable into process.env', () => {
    environment.set('ENVIRONMENT_TEST_OTHER', 'other')

    assert.equal(process.env.ENVIRONMENT_TEST_OTHER, 'other')
    assert.equal(environment.get('ENVIRONMENT_TEST_OTHER'), 'other')

    environment.delete('ENVIRONMENT_TEST_OTHER')

    assert.equal(process.env.ENVIRONMENT_TEST_OTHER, undefined)
  })
})

describe('absorb', () => {
  it('should move TOA_* variables, the later replacing the earlier', () => {
    environment.set('TOA_ENVIRONMENT_TEST_ABSORB', 'earlier')
    process.env.TOA_ENVIRONMENT_TEST_ABSORB = 'later'
    process.env.ENVIRONMENT_TEST_STAYS = 'stays'

    environment.absorb()

    assert.equal(environment.get('TOA_ENVIRONMENT_TEST_ABSORB'), 'later')
    assert.equal(process.env.TOA_ENVIRONMENT_TEST_ABSORB, undefined)
    assert.equal(process.env.ENVIRONMENT_TEST_STAYS, 'stays')

    environment.delete('TOA_ENVIRONMENT_TEST_ABSORB')
    environment.delete('ENVIRONMENT_TEST_STAYS')
  })

  it('should absorb entries without overriding what is set', () => {
    environment.set('TOA_ENVIRONMENT_TEST_KEPT', 'kept')
    process.env.ENVIRONMENT_TEST_KEPT = 'kept'

    environment.absorbEntries({
      TOA_ENVIRONMENT_TEST_KEPT: 'overridden',
      TOA_ENVIRONMENT_TEST_ADDED: 'added',
      ENVIRONMENT_TEST_KEPT: 'overridden',
      ENVIRONMENT_TEST_ADDED: 'added'
    })

    assert.equal(environment.get('TOA_ENVIRONMENT_TEST_KEPT'), 'kept')
    assert.equal(environment.get('TOA_ENVIRONMENT_TEST_ADDED'), 'added')
    assert.equal(process.env.TOA_ENVIRONMENT_TEST_ADDED, undefined)
    assert.equal(process.env.ENVIRONMENT_TEST_KEPT, 'kept')
    assert.equal(process.env.ENVIRONMENT_TEST_ADDED, 'added')

    for (const name of [
      'TOA_ENVIRONMENT_TEST_KEPT',
      'TOA_ENVIRONMENT_TEST_ADDED',
      'ENVIRONMENT_TEST_KEPT',
      'ENVIRONMENT_TEST_ADDED'
    ])
      environment.delete(name)
  })
})

describe('entries', () => {
  it('should list the store over process.env, by prefix', () => {
    environment.set('TOA_ENVIRONMENT_TEST_ENTRY', 'stored')
    process.env.ENVIRONMENT_TEST_ENTRY = 'plain'

    const all = environment.entries()
    const own = environment.entries('TOA_ENVIRONMENT_TEST_')

    assert.equal(all.TOA_ENVIRONMENT_TEST_ENTRY, 'stored')
    assert.equal(all.ENVIRONMENT_TEST_ENTRY, 'plain')
    assert.deepEqual(Object.keys(own).sort(), [
      'TOA_ENVIRONMENT_TEST_ENTRY',
      'TOA_ENVIRONMENT_TEST_SHELL'
    ])

    environment.delete('TOA_ENVIRONMENT_TEST_ENTRY')
    environment.delete('ENVIRONMENT_TEST_ENTRY')
  })
})

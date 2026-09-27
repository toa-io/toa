import { it, describe, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { references, verify } from './secrets.js'

describe('references', () => {
  it('should reference a secret by name and key', () => {
    const variables = [
      { name: 'TOA_CONTEXT', value: 'todos' },
      { name: 'USERNAME', secret: { name: 'toa-mongodb.default', key: 'username' } },
      { name: 'PASSWORD', secret: { name: 'toa-mongodb.default', key: 'password' } }
    ]

    assert.deepStrictEqual(references(variables), [
      'toa-mongodb.default/username',
      'toa-mongodb.default/password'
    ])
  })

  it('should not reference an optional key', () => {
    const variables = [
      { name: 'KEY', secret: { name: 'toa-tokens', key: 'key0', optional: true } },
      { name: 'USERNAME', secret: { name: 'toa-mongodb.default', key: 'username' } }
    ]

    assert.deepStrictEqual(references(variables), ['toa-mongodb.default/username'])
  })

  it('should reference a key read by two workloads once', () => {
    const secret = { name: 'toa-mongodb.default', key: 'username' }

    assert.deepStrictEqual(references([{ name: 'A', secret }, { name: 'B', secret }]), [
      'toa-mongodb.default/username'
    ])
  })

  it('should reference the image pull secret by name', () => {
    const variables = [
      { name: 'USERNAME', secret: { name: 'toa-mongodb.default', key: 'username' } }
    ]

    assert.deepStrictEqual(references(variables, 'registry-credentials'), [
      'registry-credentials',
      'toa-mongodb.default/username'
    ])
  })

  it('should reference nothing where nothing is secret', () => {
    assert.deepStrictEqual(references([{ name: 'TOA_ENV', value: 'production' }]), [])
  })

  it('should reference no pull secret where a context names none', () => {
    // as the chart reads it: `credentials: ~` renders no `imagePullSecrets`
    assert.deepStrictEqual(references([], null), [])
    assert.deepStrictEqual(references([], ''), [])
  })
})

describe('verify', () => {
  /** @type {string} what `kubectl` answers */
  let secrets

  /** @type {toa.operations.Process} */
  let process

  beforeEach(() => {
    secrets = ''
    process = /** @type {toa.operations.Process} */ {
      execute: mock.fn(async () => secrets)
    }
  })

  it('should read the namespace deployed into', async () => {
    secrets = 'toa-mongodb.default password username'

    await verify(process, ['toa-mongodb.default/username'], { namespace: 'acme' })

    const [cmd, args, options] = process.execute.mock.calls[0].arguments

    assert.strictEqual(cmd, 'kubectl')
    assert.deepStrictEqual(args.slice(0, 2), ['get', 'secrets'])
    assert.deepStrictEqual(args.slice(-2), ['-n', 'acme'])
    assert.deepStrictEqual(options, { silently: true })
  })

  it('should read the current namespace where none is given', async () => {
    await verify(process, [], {})

    assert.strictEqual(process.execute.mock.callCount(), 0)

    await verify(process, ['toa-mongodb.default/username'], {}).catch(() => {})

    const [, args] = process.execute.mock.calls[0].arguments

    assert.strictEqual(args.includes('-n'), false)
  })

  it('should name every key that is not deployed', async () => {
    secrets = 'toa-amqp-context.default password username'

    await assert.rejects(
      verify(
        process,
        [
          'toa-amqp-context.default/username',
          'toa-mongodb.default/username',
          'toa-mongodb.default/password'
        ],
        {}
      ),
      {
        message:
          'Secrets are not deployed: toa-mongodb.default/username, ' +
          'toa-mongodb.default/password'
      }
    )
  })

  it('should name the key a deployed secret lacks', async () => {
    secrets = 'toa-mongodb.default username'

    await assert.rejects(
      verify(process, ['toa-mongodb.default/username', 'toa-mongodb.default/password'], {}),
      { message: 'Secrets are not deployed: toa-mongodb.default/password' }
    )
  })

  it('should name a secret referenced by name alone', async () => {
    secrets = 'toa-mongodb.default password username'

    await assert.rejects(verify(process, ['registry-credentials'], {}), {
      message: 'Secrets are not deployed: registry-credentials'
    })

    secrets = 'registry-credentials .dockerconfigjson'

    await verify(process, ['registry-credentials'], {})
  })

  it('should pass where the cluster holds every key', async () => {
    secrets =
      'default-token\ntoa-amqp-context.default password username\n' +
      'toa-mongodb.default password username'

    await verify(
      process,
      [
        'toa-amqp-context.default/username',
        'toa-amqp-context.default/password',
        'toa-mongodb.default/username',
        'toa-mongodb.default/password'
      ],
      {}
    )
  })

  it('should not read the cluster where nothing is secret', async () => {
    await verify(process, [], { namespace: 'acme' })

    assert.strictEqual(process.execute.mock.callCount(), 0)
  })

  it('should fail as the error it is where the cluster cannot be read', async () => {
    process.execute = mock.fn(async () => {
      throw new Error('Command failed with exit code 1: kubectl get secrets')
    })

    await assert.rejects(verify(process, ['toa-mongodb.default/username'], {}), {
      message: /^Command failed/
    })
  })
})

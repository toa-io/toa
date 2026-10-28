import { afterEach, it } from 'node:test'
import assert from 'node:assert/strict'

import { credentials } from './settings.ts'

const VARIABLES = [
  'TOA_CHRONICLES',
  'TOA_CHRONICLES_BROKER_USERNAME',
  'TOA_CHRONICLES_BROKER_PASSWORD',
  'TOA_CHRONICLES_STORE_USERNAME',
  'TOA_CHRONICLES_STORE_PASSWORD',
  'TOA_DEV'
]

afterEach(() => {
  for (const name of VARIABLES) delete process.env[name]
})

const STORE = { provider: 'clickhouse', url: 'http://ch.example.com:8123' }

function deploy(store: object | undefined, keys: Record<string, string>): void {
  process.env.TOA_CHRONICLES = JSON.stringify({ broker: 'amqp://rmq.example.com', store })

  for (const [key, value] of Object.entries(keys))
    process.env[`TOA_CHRONICLES_${key.toUpperCase()}`] = value
}

it('should be the users of the broker and of the store', () => {
  deploy(STORE, {
    broker_username: 'shop',
    broker_password: 'b',
    store_username: 'shop',
    store_password: 's'
  })

  assert.deepEqual(credentials(), {
    broker: { username: 'shop', password: 'b' },
    store: { username: 'shop', password: 's' }
  })
})

it('should be the user of the broker alone where no store is named', () => {
  deploy(undefined, { broker_username: 'shop', broker_password: 'b' })

  assert.deepEqual(credentials(), { broker: { username: 'shop', password: 'b' } })
})

it("should throw where a store is named and its user's are not set", () => {
  deploy(STORE, { broker_username: 'shop', broker_password: 'b' })

  assert.throws(() => credentials(), /STORE_USERNAME/)
})

it("should throw where the broker's user is not set", () => {
  deploy(undefined, {})

  assert.throws(() => credentials(), /BROKER_USERNAME,BROKER_PASSWORD\}/)
})

import { randomBytes } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { EncryptJWT } from 'jose'
import type { Client } from './client.ts'

/** The authority the gateway is annotated with, and the host it answers for it. */
export const AUTHORITY = 'bench'
export const HOST = 'bench.local'

/** The identity every token is issued to. */
export const USER = '0123456789abcdef0123456789abcdef'

/** What `small` answers, which a check compares against. */
export const SMALL = 'a1b2c3d4e5f60718293a4b5c6d7e8f90'

export const ITEM = {
  title: 'A benchmark item',
  summary: 'An item of fifteen fields, the width of a typical record',
  status: 'open',
  owner: 'bench',
  region: 'eu-west',
  language: 'en',
  url: 'https://bench.local/items/1',
  rank: 7,
  count: 42,
  score: 0.83,
  price: 19.99,
  due: 1789000000000,
  public: true,
  archived: false,
  tags: ['alpha', 'beta', 'gamma']
}

export interface Files {
  item: string
  tools: string
}

export interface Tokens {
  fresh: string
  aged: string
}

/** A key for `identity.tokens`: 256 bits, base64url. */
export function key(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * A token as the gateway issues one. A fresh token is served as it is; an aged one is older than
 * the `refresh` the gateway is configured with, so every request that carries it is answered with
 * a new one.
 */
export async function tokens(secret: string): Promise<Tokens> {
  return {
    fresh: await token(secret, 0),
    aged: await token(secret, 2 * DAY)
  }
}

export async function files(directory: string): Promise<Files> {
  const item = join(directory, 'item.json')
  const tools = join(directory, 'tools.json')

  await writeFile(item, JSON.stringify(ITEM))
  await writeFile(tools, JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }))

  return { item, tools }
}

/** Creates `count` items and answers the id of one of them. */
export async function seed(client: Client, count: number): Promise<string> {
  let id: string | undefined
  let next = 0

  async function worker(): Promise<void> {
    while (next < count) {
      next++

      const reply = await client.send({
        method: 'POST',
        path: '/bench/items/',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(ITEM)
      })

      if (reply.status !== 201)
        throw new Error(`Seeding answered ${reply.status}: ${JSON.stringify(reply.body)}`)

      id ??= (reply.body as { id: string }).id
    }
  }

  await Promise.all(Array.from({ length: 16 }, worker))

  return id!
}

async function token(secret: string, age: number): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  return await new EncryptJWT({ identity: { id: USER, roles: ['bench'] } })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM', typ: 'JWT', kid: 'key0' })
    .setIssuer(AUTHORITY)
    .setIssuedAt(now - age)
    .setExpirationTime(now + 30 * DAY)
    .encrypt(new Uint8Array(Buffer.from(secret, 'base64url')))
}

const DAY = 86_400

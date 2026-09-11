import { SMALL, USER } from './fixtures.ts'
import type { Reply } from './client.ts'
import type { Files, Tokens } from './fixtures.ts'

export type Protocol = 'h1' | 'h2c'
export type ProcessName = 'gateway' | 'bench' | 'peer'

export interface Fixtures {
  tokens: Tokens
  files: Files
  /** an item that exists on the side being measured */
  item: string
}

export interface Scenario {
  id: string
  protocol: Protocol
  method: 'GET' | 'POST'
  path: (fixtures: Fixtures) => string
  headers?: (fixtures: Fixtures) => Record<string, string>
  /** the file of the body, for load; its content, for a check */
  body?: (fixtures: Fixtures) => string
  status: number
  /** what a correct reply looks like; a message where it looks otherwise */
  check: (reply: Reply, fixtures: Fixtures) => string | null
  /** the processes the request passes through, which get a verdict */
  processes: ProcessName[]
  /** where a base revision may lack what the scenario needs, what that is */
  requires?: string
  /** whether the scenario reads the items seeded before it */
  seeded?: boolean
  optional?: boolean
}

export const scenarios: Scenario[] = [
  small('small', 'h1'),
  small('small.h2c', 'h2c'),
  {
    id: 'observe',
    protocol: 'h1',
    method: 'GET',
    path: ({ item }) => `/bench/items/${item}/`,
    status: 200,
    check: (reply, { item }) => expect((reply.body as { id?: string })?.id === item, reply),
    processes: ['gateway', 'bench'],
    seeded: true
  },
  list('list.1000', 'h1'),
  list('list.1000.h2c', 'h2c'),
  {
    id: 'create',
    protocol: 'h1',
    method: 'POST',
    path: () => '/bench/items/',
    headers: () => ({ 'content-type': 'application/json' }),
    body: ({ files }) => files.item,
    status: 201,
    check: (reply) => expect(typeof (reply.body as { id?: string })?.id === 'string', reply),
    processes: ['gateway', 'bench', 'peer']
  },
  {
    id: 'chain',
    protocol: 'h1',
    method: 'GET',
    path: () => '/bench/chain/',
    status: 200,
    check: (reply) => expect((reply.body as { n?: number })?.n === 2, reply),
    processes: ['gateway', 'bench', 'peer']
  },
  {
    id: 'token.id',
    protocol: 'h1',
    method: 'GET',
    path: () => `/bench/users/${USER}/`,
    headers: ({ tokens }) => ({ authorization: `Token ${tokens.fresh}` }),
    status: 200,
    check: (reply) =>
      expect(
        (reply.body as { id?: string })?.id === USER && reply.headers.authorization === undefined,
        reply
      ),
    processes: ['gateway', 'bench']
  },
  {
    id: 'token.role',
    protocol: 'h1',
    method: 'GET',
    path: () => '/bench/role/',
    headers: ({ tokens }) => ({ authorization: `Token ${tokens.fresh}` }),
    status: 200,
    check: (reply) => expect((reply.body as { id?: string })?.id === SMALL, reply),
    processes: ['gateway', 'bench']
  },
  {
    id: 'token.aged',
    protocol: 'h1',
    method: 'GET',
    path: () => `/bench/users/${USER}/`,
    headers: ({ tokens }) => ({ authorization: `Token ${tokens.aged}` }),
    status: 200,
    check: (reply) =>
      expect(String(reply.headers.authorization ?? '').startsWith('Token '), reply),
    processes: ['gateway', 'bench']
  },
  {
    id: 'mcp.tools.list',
    protocol: 'h1',
    method: 'POST',
    path: () => '/.mcp',
    headers: () => ({ 'content-type': 'application/json' }),
    body: ({ files }) => files.tools,
    status: 200,
    check: (reply) =>
      expect(
        ((reply.body as { result?: { tools?: unknown[] } })?.result?.tools?.length ?? 0) >= 22,
        reply
      ),
    processes: ['gateway'],
    requires: '`mcp`'
  },
  {
    ...list('list.1000.msgpack', 'h1'),
    headers: () => ({ accept: 'application/msgpack' }),
    check: (reply) =>
      expect(String(reply.headers['content-type']).startsWith('application/msgpack'), reply),
    optional: true
  }
]

export function select(ids: string[] | undefined): Scenario[] {
  if (ids === undefined) return scenarios.filter((scenario) => scenario.optional !== true)

  const unknown = ids.filter((id) => !scenarios.some((scenario) => scenario.id === id))

  if (unknown.length > 0) throw new Error(`Unknown scenarios: ${unknown.join(', ')}`)

  return scenarios.filter((scenario) => ids.includes(scenario.id))
}

function small(id: string, protocol: Protocol): Scenario {
  return {
    id,
    protocol,
    method: 'GET',
    path: () => '/bench/small/',
    status: 200,
    check: (reply) => expect((reply.body as { id?: string })?.id === SMALL, reply),
    processes: ['gateway', 'bench']
  }
}

function list(id: string, protocol: Protocol): Scenario {
  return {
    id,
    protocol,
    method: 'GET',
    path: () => '/bench/items/?limit=1000',
    status: 200,
    check: (reply) =>
      expect(Array.isArray(reply.body) && (reply.body as unknown[]).length === 1000, reply),
    processes: ['gateway', 'bench'],
    seeded: true
  }
}

function expect(ok: boolean, reply: Reply): string | null {
  if (ok) return null

  const body = Buffer.isBuffer(reply.body)
    ? `${reply.body.length} bytes`
    : JSON.stringify(reply.body)?.slice(0, 200)

  return `answered ${reply.status} with ${body}`
}

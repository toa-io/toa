import { describe as suite, it } from 'node:test'
import assert from 'node:assert/strict'

import { Explorer } from './Explorer.ts'
import { Server } from '../MCP/Server.ts'
import { Tree } from '../RTD/Tree.ts'
import type * as http from '../HTTP/index.ts'
import type { EndpointsFactory } from '../Endpoint.ts'
import type { DirectiveFactory } from '../RTD/Directives.ts'

const tree = new Tree(
  { routes: [], methods: [], directives: [] },
  {} as unknown as EndpointsFactory,
  {} as unknown as DirectiveFactory
)

const context = (authority: string) =>
  ({ authority, request: { method: 'OPTIONS' } }) as unknown as http.Context

const mcp = new Server({ name: 'Teapots', hosts: { nex: 'MCP.toa.io' } }, tree)

suite('discovery explorer', () => {
  it('should name the MCP host of the authority asked', async () => {
    const { body } = await new Explorer(tree, mcp).process(context('nex'))

    assert.equal((body as { mcp?: string }).mcp, 'https://mcp.toa.io')
  })

  it('should name none for an authority without one', async () => {
    const { body } = await new Explorer(tree, mcp).process(context('dev'))

    assert.equal('mcp' in (body as object), false)
  })

  it('should name none where MCP is not served', async () => {
    const { body } = await new Explorer(tree, null).process(context('nex'))

    assert.equal('mcp' in (body as object), false)
  })
})

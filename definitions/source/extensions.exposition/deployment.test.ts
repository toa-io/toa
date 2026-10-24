import { it } from 'node:test'
import assert from 'node:assert/strict'

import { deployment } from './deployment.ts'
import type { Annotation } from './Annotation.ts'

const annotation: Annotation = {
  authorities: { nex: 'nex.toa.io', eu: 'nex.eu' },
  mcp: { name: 'Teapots', hosts: { nex: 'mcp.nex.toa.io' } }
}

it('should render every host into the ingress', () => {
  const { services } = deployment(null, annotation)

  assert.deepEqual(services![0].ingress!.hosts, [
    'nex.toa.io',
    'nex.eu',
    'mcp.nex.toa.io'
  ])
})

it('should refuse an MCP host of an undeclared authority', () => {
  const foreign: Annotation = {
    authorities: { nex: 'nex.toa.io' },
    mcp: { name: 'Teapots', hosts: { eu: 'mcp.nex.eu' } }
  }

  assert.throws(() => deployment(null, foreign), /undeclared authority 'eu'/)
})

it('should refuse censor as it was, a header and its values', () => {
  const old = { ...annotation, censor: { header: 'cf-ipcountry', values: ['RU'] } }

  assert.throws(
    () => deployment(null, old as any),
    /`exposition.censor` is the list of countries, and `exposition.country` names the header/
  )
})

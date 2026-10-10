import { it } from 'node:test'
import assert from 'node:assert/strict'

import * as schemas from './schemas.ts'

const authorities = { nex: 'nex.toa.io' }

it('should require ip with bouncer', () => {
  assert.throws(() => schemas.annotation.validate({ authorities, bouncer: {} }))
  assert.doesNotThrow(() =>
    schemas.annotation.validate({ authorities, bouncer: {}, ip: 'x-real-ip' })
  )
  assert.doesNotThrow(() => schemas.annotation.validate({ authorities, ip: 'x-real-ip' }))
})

it('should default nothing in bouncer', () => {
  assert.doesNotThrow(() =>
    schemas.annotation.validate({
      authorities,
      ip: 'x-real-ip',
      bouncer: { attempts: 5 }
    })
  )
  assert.throws(() =>
    schemas.annotation.validate({
      authorities,
      ip: 'x-real-ip',
      bouncer: { attempts: 0 }
    })
  )
})

it('should require a header and a value in censor', () => {
  const header = 'cf-ipcountry'

  assert.doesNotThrow(() =>
    schemas.annotation.validate({ authorities, censor: { header, values: ['RU'] } })
  )
  assert.throws(() =>
    schemas.annotation.validate({ authorities, censor: { values: ['RU'] } })
  )
  assert.throws(() => schemas.annotation.validate({ authorities, censor: { header } }))
  assert.throws(() =>
    schemas.annotation.validate({ authorities, censor: { header, values: [] } })
  )
})

it('should take an MCP host per authority', () => {
  assert.doesNotThrow(() =>
    schemas.annotation.validate({
      authorities,
      mcp: { name: 'Teapots', hosts: { nex: 'mcp.nex.toa.io' } }
    })
  )
  assert.throws(() =>
    schemas.annotation.validate({
      authorities,
      mcp: { name: 'Teapots', hosts: { nex: ['mcp.nex.toa.io'] } }
    })
  )
  assert.throws(() =>
    schemas.annotation.validate({
      authorities,
      mcp: { name: 'Teapots', host: 'mcp.nex.toa.io' }
    })
  )
})

it('should take a web manifest over https, or http on a loopback host', () => {
  for (const manifest of [
    'https://teapots.example/manifest.json',
    'http://localhost:8000/manifest.json',
    'http://127.0.0.1/manifest.json',
    'http://[::1]:8000/manifest.json'
  ])
    assert.doesNotThrow(
      () =>
        schemas.annotation.validate({ authorities, mcp: { name: 'Teapots', manifest } }),
      manifest
    )

  for (const manifest of [
    'http://teapots.example/manifest.json',
    'http://localhost.teapots.example/manifest.json',
    'ftp://teapots.example/manifest.json',
    '/manifest.json',
    ''
  ])
    assert.throws(
      () =>
        schemas.annotation.validate({ authorities, mcp: { name: 'Teapots', manifest } }),
      manifest
    )
})

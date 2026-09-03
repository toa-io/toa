import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { merge } from './merge.js'

// a service is named the way it is deployed by the time it reaches `merge`
const service = (name, extra = {}) => ({ group: 'group', name: `group-${name}`, version: '0', ...extra })

it('should merge services of all dependencies', () => {
  const merged = merge([
    { services: [service('one', { port: 8000 })] },
    { services: [service('two', { port: 8001 })] }
  ])

  assert.strictEqual(merged.services.length, 2)
})

/*
 * A workload that hosts services puts them in one process, so a port is claimed once
 * within one. Services in separate pods share nothing.
 */
describe('port reservation', () => {
  const hosted = (name, extra = {}) => service(name, { workload: ['mono'], ...extra })

  it('should reject two services of one workload claiming one port', () => {
    const dependencies = [
      { services: [hosted('one', { port: 8000 })] },
      { services: [hosted('two', { port: 8000 })] }
    ]

    assert.throws(() => merge(dependencies), (error) => /Port 8000 is claimed by both 'group-one' and 'group-two' in 'mono'/.test(error.message))
  })

  it('should allow two workloads to claim one port', () => {
    const dependencies = [
      { services: [service('one', { port: 8000, workload: ['edge'] })] },
      { services: [service('two', { port: 8000, workload: ['inner'] })] }
    ]

    assert.doesNotThrow(() => merge(dependencies))
  })

  it('should reserve the ports of a service in every workload running it', () => {
    const dependencies = [
      { services: [service('one', { port: 8000, workload: ['edge', 'inner'] })] },
      { services: [service('two', { port: 8000, workload: ['inner'] })] }
    ]

    assert.throws(() => merge(dependencies), (error) => /Port 8000 is claimed by both 'group-one' and 'group-two' in 'inner'/.test(error.message))
  })

  it('should allow two services deployed on their own to claim one port', () => {
    const dependencies = [
      { services: [service('one', { port: 8000 })] },
      { services: [service('two', { port: 8000 })] }
    ]

    assert.doesNotThrow(() => merge(dependencies))
  })

  it('should reject a service claiming the port of the readiness probe', () => {
    const dependencies = [
      { probe: { path: '/.ready', port: 8001 } },
      { services: [service('one', { port: 8001 })] }
    ]

    assert.throws(() => merge(dependencies), (error) => /Port 8001 is claimed by both the readiness probe and 'group-one'/.test(error.message))
  })

  it('should reject a probe claiming the port of another service of the workload', () => {
    const dependencies = [
      { services: [hosted('one', { port: 8000 })] },
      { services: [hosted('two', { port: 8002, probe: { path: '/.ready', port: 8000 } })] }
    ]

    assert.throws(() => merge(dependencies), (error) => /Port 8000 is claimed by both 'group-one' and the readiness probe of 'group-two' in 'mono'/.test(error.message))
  })

  it('should allow a service to probe its own port', () => {
    const dependencies = [
      { services: [service('one', { port: 8000, probe: { path: '/.ready', port: 8000 } })] }
    ]

    assert.doesNotThrow(() => merge(dependencies))
  })

  it('should ignore services without a port', () => {
    const dependencies = [
      { services: [service('one'), service('two')] }
    ]

    assert.doesNotThrow(() => merge(dependencies))
  })

  it('should ignore a disabled probe', () => {
    const dependencies = [
      { probe: false, services: [service('one', { port: 8000, probe: false })] }
    ]

    assert.doesNotThrow(() => merge(dependencies))
  })
})

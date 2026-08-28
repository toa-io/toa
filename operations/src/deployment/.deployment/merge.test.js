'use strict'

const { merge } = require('./merge')

const service = (name, extra = {}) => ({ group: 'group', name, version: '0', ...extra })

it('should merge services of all dependencies', () => {
  const merged = merge([
    { services: [service('one', { port: 8000 })] },
    { services: [service('two', { port: 8001 })] }
  ])

  expect(merged.services).toHaveLength(2)
})

/*
 * In Kubernetes these are separate pods, but `toa mono` and a local run put every
 * service in one process.
 */
describe('port reservation', () => {
  it('should reject two services claiming one port', () => {
    const dependencies = [
      { services: [service('one', { port: 8000 })] },
      { services: [service('two', { port: 8000 })] }
    ]

    expect(() => merge(dependencies))
      .toThrow("Port 8000 is claimed by both 'group-one' and 'group-two'")
  })

  it('should reject a service claiming the port of the readiness probe', () => {
    const dependencies = [
      { probe: { path: '/.ready', port: 8001 } },
      { services: [service('one', { port: 8001 })] }
    ]

    expect(() => merge(dependencies))
      .toThrow("Port 8001 is claimed by both the readiness probe and 'group-one'")
  })

  it('should reject a probe claiming the port of another service', () => {
    const dependencies = [
      { services: [service('one', { port: 8000 })] },
      { services: [service('two', { port: 8002, probe: { path: '/.ready', port: 8000 } })] }
    ]

    expect(() => merge(dependencies))
      .toThrow("Port 8000 is claimed by both 'group-one' and the readiness probe of 'group-two'")
  })

  it('should allow a service to probe its own port', () => {
    const dependencies = [
      { services: [service('one', { port: 8000, probe: { path: '/.ready', port: 8000 } })] }
    ]

    expect(() => merge(dependencies)).not.toThrow()
  })

  it('should ignore services without a port', () => {
    const dependencies = [
      { services: [service('one'), service('two')] }
    ]

    expect(() => merge(dependencies)).not.toThrow()
  })

  it('should ignore a disabled probe', () => {
    const dependencies = [
      { probe: false, services: [service('one', { port: 8000, probe: false })] }
    ]

    expect(() => merge(dependencies)).not.toThrow()
  })
})

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import * as schemas from './schemas.js'

describe('throttle', () => {
  const rest = { requests: 1, interval: 1 }

  it('should validate key', () => {
    assert.doesNotThrow(() => schemas.throttle.validate({ key: 'ip', ...rest }))
  })

  it('should validate every key component', () => {
    for (const key of ['ip', 'path', 'route', 'identity'])
      assert.doesNotThrow(() => schemas.throttle.validate({ key, ...rest }))

    assert.doesNotThrow(() => schemas.throttle.validate({ key: { segment: 'id' }, ...rest }))
    assert.doesNotThrow(() => schemas.throttle.validate({
      key: ['route', { segment: 'id' }],
      ...rest
    }))
  })

  it('should reject an unknown key component', () => {
    assert.throws(() => schemas.throttle.validate({ key: 'header', ...rest }))
    assert.throws(() => schemas.throttle.validate({ key: { header: 'x-real-ip' }, ...rest }))
  })

  it('should reject a declaration it no longer honours', () => {
    // metering earns the budget back rather than locking a key out, so a `cooldown`
    // left behind is not something to ignore quietly
    assert.throws(() => schemas.throttle.validate({ key: 'ip', cooldown: 1, ...rest }))
  })
})

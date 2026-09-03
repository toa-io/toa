import { it } from 'node:test'
import assert from 'node:assert/strict'

import * as schemas from './schemas.js'

const authorities = { nex: 'nex.toa.io' }

it('should require ip with bouncer', () => {
  assert.throws(() => schemas.annotation.validate({ authorities, bouncer: {} }))
  assert.doesNotThrow(() => schemas.annotation.validate({ authorities, bouncer: {}, ip: 'x-real-ip' }))
  assert.doesNotThrow(() => schemas.annotation.validate({ authorities, ip: 'x-real-ip' }))
})

it('should default nothing in bouncer', () => {
  assert.doesNotThrow(() => schemas.annotation.validate({ authorities, ip: 'x-real-ip', bouncer: { attempts: 5 } }))
  assert.throws(() => schemas.annotation.validate({ authorities, ip: 'x-real-ip', bouncer: { attempts: 0 } }))
})

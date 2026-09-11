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
  assert.throws(() => schemas.annotation.validate({ authorities, censor: { values: ['RU'] } }))
  assert.throws(() => schemas.annotation.validate({ authorities, censor: { header } }))
  assert.throws(() =>
    schemas.annotation.validate({ authorities, censor: { header, values: [] } })
  )
})

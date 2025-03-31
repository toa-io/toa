import * as schemas from './schemas'

describe('throttle', () => {
  const rest = { requests: 1, interval: 1, cooldown: 1 }

  it('should validate key', () => {
    expect(() => schemas.throttle.validate({ key: 'ip', ...rest })).not.toThrow()
  })
})

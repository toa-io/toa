import * as schemas from './schemas'

describe('throttle', () => {
  const rest = { requests: 1, interval: 1, cooldown: 1 }

  it('should validate key', () => {
    expect(() => schemas.throttle.validate({ key: 'ip', ...rest })).not.toThrow()
  })

  it('should validate every key component', () => {
    for (const key of ['ip', 'path', 'route', 'identity'])
      expect(() => schemas.throttle.validate({ key, ...rest })).not.toThrow()

    expect(() => schemas.throttle.validate({ key: { segment: 'id' }, ...rest })).not.toThrow()
    expect(() => schemas.throttle.validate({
      key: ['route', { segment: 'id' }],
      ...rest
    })).not.toThrow()
  })

  it('should reject an unknown key component', () => {
    expect(() => schemas.throttle.validate({ key: 'header', ...rest })).toThrow()
    expect(() => schemas.throttle.validate({ key: { header: 'x-real-ip' }, ...rest })).toThrow()
  })
})

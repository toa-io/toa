import * as schemas from './schemas'

const ok = {
  a: {
    provider: 'tmp',
    directory: 'ok'
  },
  b: {
    provider: 'fs',
    path: 'ok'
  },
  c: {
    provider: 's3',
    bucket: 'ok'
  },
  d: {
    provider: 'mem'
  }
}

const oh = [
  {
    whatever: {
      provider: 'non-existent'
    }
  },
  {
    whatever: {
      provider: 'fs'
    }
  },
  {
    whatever: {
      provider: 'tmp',
      extra: true
    }
  },
  {
    whatever: {

      provider: 's3'
    }
  },
  {
    whatever: {
      provider: 'mem',
      extra: true
    }
  }
]

it('should pass', () => {
  expect(() => schemas.annotation.validate(ok)).not.toThrow()
})

it.each(oh)('should fail', (value) => {
  expect(() => schemas.annotation.validate(value)).toThrow()
})

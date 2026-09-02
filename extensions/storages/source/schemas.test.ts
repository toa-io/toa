import * as schemas from './schemas.js'

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
    bucket: 'my-bucket'
  },
  e: {
    provider: 'spaces',
    space: 'my-space',
    region: 'nyc3'
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
      provider: 'spaces',
      space: 'my-space'
    }
  }
]

it('should pass', () => {
  expect(() => schemas.annotation.validate(ok)).not.toThrow()
})

it.each(oh)('should fail', (value) => {
  expect(() => schemas.annotation.validate(value)).toThrow()
})

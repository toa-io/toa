const assets = {}

assets.schema = {
  properties: {
    foo: {
      type: 'string'
    },
    bar: {
      type: 'number'
    },
    baz: {
      type: 'number',
      default: 100
    }
  },
  required: ['foo']
}

assets.samples = {
  ok: {
    all: {
      foo: 'bar',
      bar: 12,
      baz: 23
    },
    required: {
      foo: 'bar'
    }
  },
  invalid: {
    type: {
      foo: 12
    },
    required: {
      bar: 12
    }
  }
}

export default assets

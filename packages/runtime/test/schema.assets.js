export const schema = {
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

export const samples = {
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

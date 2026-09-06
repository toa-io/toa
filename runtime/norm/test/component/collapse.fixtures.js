import { generate } from 'randomstring'

const entity = {
  manifest: {
    entity: {
      properties: {
        foo: {
          type: 'string'
        },
        bar: {
          type: 'integer'
        }
      },
      required: ['foo']
    }
  },
  prototype: {
    entity: {
      properties: {
        foo: {
          minLength: 1
        },
        baz: {
          type: 'boolean'
        }
      },
      required: ['baz']
    }
  },
  result: {
    entity: {
      properties: {
        foo: {
          type: 'string',
          minLength: 1
        },
        bar: {
          type: 'integer'
        },
        baz: {
          type: 'boolean'
        }
      },
      required: ['foo', 'baz']
    }
  }
}

const operations = {
  manifest: {
    operations: {
      add: {
        bridge: 'b',
        query: false
      },
      get: {
        bridge: 'b'
      },
      find: {
        bridge: 'b'
      }
    }
  },
  prototype: {
    prototype: null,
    path: generate(),
    operations: {
      add: {
        bridge: 'a'
      },
      find: {
        bridge: 'a'
      },
      observe: {
        bridge: 'a',
        input: 'object'
      }
    }
  },
  result: {
    prototype: {
      prototype: null,
      operations: {
        add: {
          bridge: 'a'
        },
        find: {
          bridge: 'a'
        },
        observe: {
          bridge: 'a'
        }
      }
    },
    operations: {
      add: {
        bridge: 'b',
        query: false
      },
      get: {
        bridge: 'b'
      },
      find: {
        bridge: 'b'
      },
      observe: {
        input: 'object'
      }
    }
  }
}

const remotes = {
  manifest: {
    remotes: ['a', 'b']
  },
  prototype: {
    remotes: ['c', 'd']
  },
  result: {
    remotes: ['a', 'b', 'c', 'd']
  }
}

export const samples = { entity, operations, remotes }

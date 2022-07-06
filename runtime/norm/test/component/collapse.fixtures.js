'use strict'

const { generate } = require('randomstring')

const entity = {
  manifest: {
    entity: {
      schema: {
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
    }
  },
  prototype: {
    entity: {
      schema: {
        properties: {
          foo: {
            default: 'ok'
          },
          baz: {
            type: 'boolean'
          }
        },
        required: ['baz']
      }
    }
  },
  result: {
    entity: {
      schema: {
        properties: {
          foo: {
            type: 'string',
            default: 'ok'
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
      path: expect.any(String),
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

exports.samples = { entity, operations, remotes }

export const source = {
  entity: {
    properties: {
      foo: {
        type: 'string'
      }
    }
  },
  operations: {
    transit: {
      input: {
        properties: {
          foo: {
            type: 'string'
          }
        }
      },
      output: {
        properties: {
          bar: {
            type: 'string'
          }
        }
      }
    },
    create: {
      forward: 'transit',
      query: false
    }
  }
}

export const target = {
  entity: {
    properties: {
      foo: {
        type: 'string'
      }
    }
  },
  operations: {
    transit: {
      input: {
        properties: {
          foo: {
            type: 'string'
          }
        }
      },
      output: {
        properties: {
          bar: {
            type: 'string'
          }
        }
      }
    },
    create: {
      forward: 'transit',
      query: false,
      input: {
        properties: {
          foo: {
            type: 'string'
          }
        }
      },
      output: {
        properties: {
          bar: {
            type: 'string'
          }
        }
      }
    }
  }
}

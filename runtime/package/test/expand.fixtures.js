'use strict'

const source = {
  entity: {
    schema: {
      properties: {
        foo: 'string'
      }
    }
  },
  operations: {
    add: {
      input: {
        properties: {
          foo: 'integer',
          bar: {
            type: 'array',
            items: {
              properties: {
                baz: 'string'
              }
            }
          },
          baz: {
            type: 'array',
            items: '~foo'
          }
        },
        id: null
      },
      output: {
        properties: {
          foo: 'integer',
          bar: {
            type: 'array',
            items: {
              properties: {
                baz: 'string'
              }
            }
          },
          baz: {
            type: 'array',
            items: '~foo'
          }
        },
        id: null
      }
    }
  },
  receivers: {
    event: 'transit'
  }
}

const target = {
  entity: {
    schema: {
      properties: {
        foo: {
          type: 'string'
        }
      }
    }
  },
  operations: {
    add: {
      input: {
        properties: {
          foo: {
            type: 'integer'
          },
          bar: {
            type: 'array',
            items: {
              properties: {
                baz: {
                  type: 'string'
                }
              }
            }
          },
          baz: {
            type: 'array',
            items: '~foo'
          }
        },
        id: null
      },
      output: {
        properties: {
          foo: {
            type: 'integer'
          },
          bar: {
            type: 'array',
            items: {
              properties: {
                baz: {
                  type: 'string'
                }
              }
            }
          },
          baz: {
            type: 'array',
            items: '~foo'
          }
        },
        id: null
      }
    }
  },
  receivers: {
    event: {
      transition: 'transit'
    }
  }
}

exports.source = source
exports.target = target

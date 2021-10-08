'use strict'

const source = {
  entity: {
    schema: {
      properties: {
        id: {
          type: 'id'
        },
        foo: {
          type: 'string'
        },
        bar: '~foo'
      }
    }
  },
  operations: {
    transit: {
      input: {
        properties: {
          foo: null,
          bar: '~foo',
          baz1: {
            type: 'array',
            items: '~foo'
          },
          baz2: {
            type: 'array',
            items: {
              properties: {
                foo: null,
                bar: '~foo'
              }
            }
          }
        }
      },
      output: {
        properties: {
          bar: '~foo'
        }
      }
    },
    create: {
      forward: 'transit',
      query: false
    }
  }
}

const target = {
  entity: {
    schema: {
      properties: {
        id: {
          $ref: 'https://schemas.kookaburra.dev/0.0.0/definitions#/definitions/id'
        },
        foo: {
          type: 'string'
        },
        bar: {
          type: 'string'
        }
      }
    }
  },
  operations: {
    transit: {
      input: {
        properties: {
          foo: {
            type: 'string'
          },
          bar: {
            type: 'string'
          },
          baz1: {
            type: 'array',
            items: {
              type: 'string'
            }
          },
          baz2: {
            type: 'array',
            items: {
              properties: {
                foo: {
                  type: 'string'
                },
                bar: {
                  type: 'string'
                }
              }
            }
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
          },
          bar: {
            type: 'string'
          },
          baz1: {
            type: 'array',
            items: {
              type: 'string'
            }
          },
          baz2: {
            type: 'array',
            items: {
              properties: {
                foo: {
                  type: 'string'
                },
                bar: {
                  type: 'string'
                }
              }
            }
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

exports.source = source
exports.target = target

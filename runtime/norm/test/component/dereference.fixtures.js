'use strict'

const source = {
  entity: {
    schema: {
      properties: {
        foo: {
          type: 'string'
        },
        bar: {
          type: 'string',
          default: '.foo'
        }
      }
    }
  },
  operations: {
    transit: {
      input: {
        properties: {
          foo: {
            type: 'string',
            default: '.'
          },
          bar: {
            type: 'string',
            default: '.foo'
          },
          baz1: {
            type: 'array',
            items: {
              type: 'string',
              default: '.foo'
            }
          },
          baz2: {
            type: 'array',
            items: {
              properties: {
                foo: {
                  type: 'string',
                  default: '.'
                },
                bar: {
                  type: 'string',
                  default: '.foo'
                }
              }
            }
          }
        }
      },
      output: {
        properties: {
          bar: {
            type: 'string',
            default: '.foo'
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

const target = {
  entity: {
    schema: {
      properties: {
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

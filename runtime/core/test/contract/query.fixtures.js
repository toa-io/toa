'use strict'

const samples = {
  simple: {
    query: {
      criteria: 'name==Eddie'
    },
    parsed: {
      criteria: {
        type: 'COMPARISON',
        left: { type: 'SELECTOR', selector: 'name' },
        operator: '==',
        right: { type: 'VALUE', value: 'Eddie' }
      }
    },
    properties: {
      name: {
        type: 'string'
      }
    }
  },

  extended: {
    query: {
      criteria: 'flag==true;volume>2.1'
    },
    parsed: {
      criteria: {
        type: 'LOGIC',
        left: {
          type: 'COMPARISON',
          left: { type: 'SELECTOR', selector: 'flag' },
          operator: '==',
          right: { type: 'VALUE', value: true }
        },
        operator: ';',
        right: {
          type: 'COMPARISON',
          left: { type: 'SELECTOR', selector: 'volume' },
          operator: '>',
          right: { type: 'VALUE', value: 2.1 }
        }
      }
    },
    properties: {
      flag: {
        type: 'boolean'
      },
      volume: {
        type: 'number'
      }
    }
  },

  abc: {
    properties: {
      a: {
        type: 'string'
      },
      b: {
        type: 'string'
      },
      c: {
        type: 'string'
      }
    }
  },

  id: {
    query: {
      id: '123',
      criteria: 'name==Eddie'
    },
    parsed: {
      criteria: {
        type: 'LOGIC',
        left: {
          type: 'COMPARISON',
          left: {
            type: 'SELECTOR',
            selector: 'id'
          },
          operator: '==',
          right: {
            type: 'VALUE',
            value: '123'
          }
        },
        operator: ';',
        right: {
          type: 'COMPARISON',
          left: {
            type: 'SELECTOR',
            selector: 'name'
          },
          operator: '==',
          right: {
            type: 'VALUE',
            value: 'Eddie'
          }
        }
      }
    }
  }
}

exports.samples = samples

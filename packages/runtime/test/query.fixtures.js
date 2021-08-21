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
    options: {

    },
    properties: {
      name: {
        type: 'string'
      }
    }
  },

  types: {
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
    options: {

    },
    properties: {
      flag: {
        type: 'boolean'
      },
      volume: {
        type: 'number'
      }
    }
  }
}

exports.samples = samples

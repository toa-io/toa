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
    schema: {
      fit: jest.fn(() => true)
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
    schema: {
      fit: jest.fn((value) => {
        value.flag = value.flag === 'true'
        value.volume = Number(value.volume)
      })
    }
  }
}

exports.samples = samples

const path = require('path')

const root = path.dirname(require.resolve('@kookaburra/dummies'))

const locator = { forename: 'calculator' }
const operations = [
  {
    algorithm: require(path.resolve(root, './calculator/operations/sum')),
    name: 'sum',
    type: 'transition',
    schema: {
      properties: {
        a: {
          type: 'number'
        },
        b: {
          type: 'number'
        }
      },
      required: ['a', 'b']
    },
    http: [
      {
        path: '/sums'
      }
    ]
  },
  {
    algorithm: require(path.resolve(root, './calculator/operations/multi')),
    name: 'multi',
    type: 'transition',
    schema: {
      properties: {
        a: {
          type: 'number'
        },
        b: {
          type: 'number'
        }
      },
      required: ['a', 'b']
    },
    http: [
      {
        path: '/multiplications'
      }
    ]
  },
  {
    algorithm: require(path.resolve(root, './calculator/operations/div')),
    name: 'div',
    type: 'transition',
    schema: {
      properties: {
        a: {
          type: 'number'
        },
        b: {
          type: 'number',
          exclusiveMinimum: 0
        }
      },
      required: ['a', 'b']
    },
    http: [
      {
        path: '/divisions'
      }
    ]
  }
]

exports.path = exports.path = path.resolve(root, 'calculator')
exports.locator = locator
exports.operations = operations

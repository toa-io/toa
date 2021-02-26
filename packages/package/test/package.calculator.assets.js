const path = require('path')

const root = path.dirname(require.resolve('@kookaburra/dummies'))

const locator = { forename: 'calculator' }
const algorithms = {
  sum: {
    func: require(path.resolve(root, './calculator/operations/sum')),
    name: 'sum',
    type: 'observation',
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
    }
  },
  pow: {
    func: require(path.resolve(root, './calculator/operations/pow')),
    name: 'pow',
    type: 'observation',
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
    }
  },
  div: {
    func: require(path.resolve(root, './calculator/operations/div')),
    name: 'div',
    type: 'observation',
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
    }
  }

}

exports.path = exports.path = path.resolve(root, 'calculator')
exports.locator = locator
exports.algorithms = algorithms

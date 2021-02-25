const path = require('path')

const dummiesPath = path.dirname(require.resolve('@kookaburra/dummies'))

const manifest = { name: 'calculator' }
const algorithms = []

algorithms.push({
  func: require(path.resolve(dummiesPath, './calculator/operations/sum')),
  name: 'sum',
  type: 'observation',
  manifest: {
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
  }
})

algorithms.push({
  func: require(path.resolve(dummiesPath, './calculator/operations/pow')),
  name: 'pow',
  type: 'observation',
  manifest: {
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
  }
})

algorithms.push({
  func: require(path.resolve(dummiesPath, './calculator/operations/div')),
  name: 'div',
  type: 'observation',
  manifest: {
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
})

exports.manifest = manifest
exports.algorithms = algorithms

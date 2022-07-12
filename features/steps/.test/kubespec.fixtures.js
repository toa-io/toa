'use strict'

const { generate } = require('randomstring')

const { random } = require('@toa.io/libraries/generic')
const { dump } = require('@toa.io/libraries/yaml')

const spec = () => {
  const kind = generate()
  const name = generate()

  return {
    kind,
    metadata: {
      name
    },
    spec: {
      template: {
        spec: {
          containers: [
            {
              name: generate(),
              image: generate(),
              env: [
                {
                  name: generate(),
                  value: generate()
                }
              ]
            }
          ]
        }
      }
    }
  }
}

const specs = []
let yaml = ''

for (let i = 0; i < random(5) + 5; i++) {
  const sample = spec()

  specs.push(sample)
  yaml += dump(sample) + '---\n'
}

exports.specs = specs
exports.yaml = yaml

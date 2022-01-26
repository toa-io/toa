'use strict'

const { repeat, random } = require('@toa.io/gears')
const { generate } = require('randomstring')

const components = repeat(() => ({
  domain: generate(),
  name: generate(),
  locator: {
    id: generate(),
    label: generate()
  },
  version: random(10) + '.' + random(20) + '.' + random(30)
}), random(10) + 5)

const context = {
  registry: generate(),
  components,
  compositions: []
}

let unused = components.length

while (1) {
  const use = random(3) + 1
  const index = components.length - unused

  if (use >= unused) break

  context.compositions.push({
    name: generate(),
    components: components.slice(index, index + use)
      .map((component) => component.locator.id)
  })

  unused -= use
}

const instantiate = jest.fn(() => generate())

exports.context = context
exports.instantiate = instantiate

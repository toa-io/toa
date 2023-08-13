'use strict'

const { generate } = require('randomstring')
const { random } = require('@toa.io/generic')

const manifest = {}
const originCount = random(5) + 2

for (let j = 0; j < originCount; j++) {
  const origin = generate()

  manifest[origin] = ['amqp://' + generate()]
}

exports.manifest = manifest

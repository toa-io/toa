'use strict'

const boot = require('@toa.io/boot')
const { stage } = require('./stage')

/** @type {toa.userland.staging.Composition} */
const composition = async (paths) => {
  const composition = await boot.composition(paths)

  await composition.connect()
  stage.compositions.push(composition)
}

exports.composition = composition

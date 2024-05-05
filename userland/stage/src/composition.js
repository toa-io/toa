'use strict'

const boot = require('@toa.io/boot')
const { state } = require('./state')

/** @type {toa.stage.Composition} */
const composition = async (paths, options) => {
  const composition = await boot.composition(paths, options)

  await composition.connect()

  state.compositions.push(composition)
}

exports.composition = composition

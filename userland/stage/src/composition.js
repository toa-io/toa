'use strict'

const boot = require('@toa.io/boot')
const { state } = require('./state')

const binding = require.resolve('./binding')

/** @type {toa.stage.Composition} */
const composition = async (paths) => {
  const options = { bindings: [binding] }
  const composition = await boot.composition(paths, options)

  await composition.connect()

  state.compositions.push(composition)
}

exports.composition = composition

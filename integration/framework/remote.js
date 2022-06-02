'use strict'

const boot = require('@toa.io/boot')
const { Locator } = require('@toa.io/core')

const remote = async (id) => {
  const locator = new Locator(id)
  const remote = await boot.remote(locator)
  await remote.connect()

  return remote
}

exports.remote = remote

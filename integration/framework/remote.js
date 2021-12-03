'use strict'

const { Locator } = require('@toa.io/core')

const boot = require('../../runtime/boot/src')

const remote = async (id) => {
  const locator = new Locator(id)
  const remote = await boot.remote(locator)
  await remote.connect()

  return remote
}

exports.remote = remote

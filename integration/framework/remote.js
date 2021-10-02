'use strict'

const boot = require('../../runtime/boot/src/remote')

const remote = async (id, binding) => {
  const remote = await boot.remote(id, binding && [binding])
  await remote.connect()

  return remote
}

exports.remote = remote

'use strict'

const boot = require('../../runtime/boot/src/remote')

const remote = async (fqn, binding) => {
  return boot.remote(fqn, binding && [binding])
}

exports.remote = remote

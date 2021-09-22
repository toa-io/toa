'use strict'

const { Context } = require('@kookaburra/core')

const boot = require('./index')

const context = (remotes) => {
  const promises = remotes?.map((remote) => boot.promise.promise('remote', remote))
  const context = new Context(promises)

  if (promises) Promise.all(promises).then((remotes) => context.depends(remotes))

  return context
}

exports.context = context

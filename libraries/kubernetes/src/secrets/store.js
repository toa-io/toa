'use strict'

const { execute } = require('@toa.io/libraries/command')
const { remap, encode, patch } = require('@toa.io/libraries/generic')

const { get } = require('./get')

/** @type {toa.kubernetes.secrets.Store} */
const store = async (name, values) => {
  const command = 'kubectl apply -f -'
  const data = remap(values, encode)

  /** @type {toa.kubernetes.secrets.Declaration} */
  const declaration = (await get(name)) ?? BLANK

  declaration.metadata.name = name

  patch(declaration.data, data)

  const input = JSON.stringify(declaration)

  await execute(command, input)
}

const BLANK = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: { name: '' },
  data: {},
  type: 'Opaque'
}

exports.store = store

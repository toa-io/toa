'use strict'

async function get (input, context) {
  return await context.storages[input.storage].get(input.path, { range: input.range, agent: input.agent })
}

exports.effect = get

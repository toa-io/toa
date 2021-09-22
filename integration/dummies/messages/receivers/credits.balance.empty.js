'use strict'

async function coupling (payload, local) {
  local.add({ sender: 'system', text: `${payload.user} is out of credits` })
}

module.exports = coupling

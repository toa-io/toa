'use strict'

/*
kubectl get pods -o=custom-columns='NAME:.metadata.name,CPU_REQUEST:.spec.containers[*].resources.requests.cpu,CPU_LIMIT:.spec.containers[*].resources.limits.cpu,MEM_REQUEST:.spec.containers[*].resources.requests.memory,MEM_LIMIT:.spec.containers[*].resources.limits.memory'
*/

const { spawn } = require('node:child_process')

const limits = async (argv) => {
  const args = [
    'get',
    'pods',
    '-o=custom-columns=NAME:.metadata.name,CPU:.spec.containers[*].resources.requests.cpu,:.spec.containers[*].resources.limits.cpu,MEM:.spec.containers[*].resources.requests.memory,:.spec.containers[*].resources.limits.memory'
  ]

  await spawn('kubectl', args, { stdio: 'inherit' })
}

exports.limits = limits

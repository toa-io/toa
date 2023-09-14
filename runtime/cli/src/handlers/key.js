'use strict'

const { V3 } = require('paseto')

async function key (argv) {
  const purpose = argv.public ? 'public' : 'local'
  const key = await V3.generateKey(purpose, { format: 'paserk' })

  if (argv.public) {
    console.log(key.secretKey)
    console.log(key.publicKey)
  } else
    console.log(key)
}

exports.key = key

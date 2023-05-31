'use strict'

const { file } = require('@toa.io/filesystem')

async function setup () {
  const path = process.env.TOA_ENV_FILE ?? await file.dot('env')

  if (path !== undefined) require('dotenv').config({ path })
}

if (!('TOA_ENV' in process.env)) {
  (async () => {
    await setup()
  })()
}

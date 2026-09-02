import dotenv from 'dotenv'
import findUp from 'find-up'

async function setup () {
  const path = await findUp('.env')

  if (path !== undefined) dotenv.config({ path })
}

if (!('TOA_ENV' in process.env)) {
  (async () => {
    await setup()
  })()
}

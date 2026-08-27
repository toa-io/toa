import { setDefaultTimeout } from '@cucumber/cucumber'
import { encode } from '@toa.io/generic'

process.env.TOA_DEV = '1'

/*
 * The extension factory reads the environment once, and the bootloader caches
 * factories per process — so the context level of the annotation is fixed for
 * a whole run. `npm run features` therefore makes a pass per configuration.
 */
process.env.TOA_INTROSPECTION = encode({
  samples: process.env.TOA_INTROSPECTION_SAMPLES === '1',
  interval: Number(process.env.TOA_INTROSPECTION_INTERVAL ?? 1),
  threshold: 64
})

setDefaultTimeout(60 * 1000)

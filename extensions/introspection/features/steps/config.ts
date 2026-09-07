import { setDefaultTimeout } from '@cucumber/cucumber'
import { environment } from '@toa.io/generic'

environment.set('TOA_DEV', '1')

// a reply is checked against what the operation declares, so the suite runs Toa under the
// contract it asks applications to keep
if (!environment.has('TOA_ENV')) environment.set('TOA_ENV', 'local')

/*
 * The extension factory reads the environment once, and the bootloader caches
 * factories per process — so the context level of the annotation is fixed for
 * a whole run. `npm run features` therefore makes a pass per configuration.
 */
environment.set(
  'TOA_INTROSPECTION',
  JSON.stringify({
    samples: environment.get('TOA_INTROSPECTION_SAMPLES') === '1',
    interval: Number(environment.get('TOA_INTROSPECTION_INTERVAL') ?? 1),
    threshold: 64,

    // `ui.feature` starts its own server; the explorer must not take the port first
    ui: false
  })
)

setDefaultTimeout(60 * 1000)

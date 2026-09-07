import { setDefaultTimeout } from '@cucumber/cucumber'
import { environment } from '@toa.io/generic'

environment.set('TOA_DEV', '1')

// a reply is checked against what the operation declares, so the suite runs Toa under the
// contract it asks applications to keep
if (!environment.has('TOA_ENV')) environment.set('TOA_ENV', 'local')

// the streams component boots inside the service, and without a variable it would wait
// for the values service, which these features do not run
if (!environment.has('TOA_CONFIGURATION_REALTIME_STREAMS'))
  environment.set('TOA_CONFIGURATION_REALTIME_STREAMS', '{}')

setDefaultTimeout(60 * 1000)

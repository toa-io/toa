import { setDefaultTimeout } from '@cucumber/cucumber'

process.env.TOA_DEV = '1'

// a reply is checked against what the operation declares, so the suite runs Toa under the
// contract it asks applications to keep
process.env.TOA_ENV ??= 'local'

// the streams component boots inside the service, and without a variable it would wait
// for the values service, which these features do not run
process.env.TOA_CONFIGURATION_REALTIME_STREAMS ??= '{}'

setDefaultTimeout(60 * 1000)

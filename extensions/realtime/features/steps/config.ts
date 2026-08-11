import { setDefaultTimeout } from '@cucumber/cucumber'

process.env.TOA_DEV = '1'

setDefaultTimeout(60 * 1000)

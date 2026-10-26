import { browser } from '$app/env'
import { rc as realtime } from '#/realtime/rc.js'
import { rc as iam } from '#/iam/rc.js'

if (browser) {
  iam()
  realtime()
}

// The explorer serves a directory of static files; routing belongs to the client.
export const ssr = false
export const prerender = false

export const trailingSlash = 'always'

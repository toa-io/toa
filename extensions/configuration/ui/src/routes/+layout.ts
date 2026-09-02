import { rc as realtime } from '@/realtime/rc'
import { rc as iam } from '@/iam/rc'
import { browser } from '$app/environment'

if (browser) {
  iam()
  realtime()
}

// The explorer serves a directory of static files; routing belongs to the client.
export const ssr = false
export const prerender = false

export const trailingSlash = 'always'

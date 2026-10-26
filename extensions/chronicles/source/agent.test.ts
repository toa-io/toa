import { it } from 'node:test'
import assert from 'node:assert/strict'

import { classify } from './agent.ts'

const agents: Array<[string, string | null, string | null, string]> = [
  [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    'Chrome',
    'Windows',
    'desktop'
  ],
  [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
    'Edge',
    'Windows',
    'desktop'
  ],
  [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
    'Safari',
    'macOS',
    'desktop'
  ],
  [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0',
    'Firefox',
    'macOS',
    'desktop'
  ],
  [
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/115.0.0.0',
    'Opera',
    'Linux',
    'desktop'
  ],
  [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    'Safari',
    'iOS',
    'mobile'
  ],
  [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.0.0 Mobile/15E148 Safari/604.1',
    'Chrome',
    'iOS',
    'mobile'
  ],
  [
    'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    'Safari',
    'iOS',
    'tablet'
  ],
  [
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
    'Chrome',
    'Android',
    'mobile'
  ],
  [
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    'Chrome',
    'Android',
    'tablet'
  ],
  [
    'Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
    'Samsung Internet',
    'Android',
    'mobile'
  ],
  [
    'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    'Chrome',
    'ChromeOS',
    'desktop'
  ],
  [
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    null,
    null,
    'bot'
  ],
  [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36',
    'Chrome',
    'Windows',
    'bot'
  ],
  ['curl/8.7.1', null, null, 'bot'],
  [
    // iOS 26, whose Safari says the system is 18.6
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
    'Safari',
    'iOS',
    'mobile'
  ],
  [
    // an iPad, as its Safari says by default
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
    'Safari',
    'macOS',
    'desktop'
  ],
  [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/141.0.0.0 Version/26.0 Mobile/15E148 Safari/604.1',
    'Edge',
    'iOS',
    'mobile'
  ],
  [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/144.0 Mobile/15E148 Safari/605.1.15',
    'Firefox',
    'iOS',
    'mobile'
  ],
  [
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 EdgA/141.0.0.0',
    'Edge',
    'Android',
    'mobile'
  ],
  [
    'Mozilla/5.0 (Android 15; Mobile; rv:144.0) Gecko/144.0 Firefox/144.0',
    'Firefox',
    'Android',
    'mobile'
  ]
]

it('should tell the browser, the system and the device of what browsers send', () => {
  for (const [agent, browser, os, device] of agents)
    assert.deepEqual(classify(agent), { browser, os, device }, agent)
})

it('should tell nothing of no agent', () => {
  assert.deepEqual(classify(undefined), { browser: null, os: null, device: null })
  assert.deepEqual(classify(''), { browser: null, os: null, device: null })
})

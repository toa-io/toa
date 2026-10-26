/**
 * What a client is, as its `user-agent` says, in the few words a question of who visits asks for:
 * the browser, the operating system and the kind of device, by name and without versions — which
 * browsers freeze or leave out, and which make an agent more of a fingerprint. Each is the first of
 * its list that matches, so a name another agent copies comes after the one that copies it: Edge
 * says Chrome and Safari, Chrome says Safari. What matches nothing is `null`.
 *
 * Safari on an iPad says it is a Mac, as it has since iPadOS 13, and nothing the request carries
 * says otherwise: it is a desktop running macOS here.
 */
export function classify(agent: unknown): Classified {
  if (typeof agent !== 'string' || agent === '')
    return { browser: null, os: null, device: null }

  return {
    browser: first(BROWSERS, agent),
    os: first(SYSTEMS, agent),
    device: first(DEVICES, agent) ?? 'desktop'
  }
}

export interface Classified {
  browser: string | null
  os: string | null
  device: string | null
}

function first(list: Array<[string, RegExp]>, agent: string): string | null {
  return list.find(([, pattern]) => pattern.test(agent))?.[0] ?? null
}

const BROWSERS: Array<[string, RegExp]> = [
  ['Edge', /\bEdg(e|A|iOS)?\//],
  ['Opera', /\bOPR\/|\bOPT\/|\bOpera\b/],
  ['Samsung Internet', /\bSamsungBrowser\//],
  ['Firefox', /\bFirefox\/|\bFxiOS\//],
  ['Chrome', /(\b|Headless)Chrome\/|\bCriOS\//],
  ['Safari', /\bVersion\/[\d.]+.*\bSafari\//]
]

const SYSTEMS: Array<[string, RegExp]> = [
  ['Windows', /\bWindows\b/],
  ['iOS', /\b(iPhone|iPad|iPod)\b/],
  ['macOS', /\bMac OS X\b|\bMacintosh\b/],
  ['Android', /\bAndroid\b/],
  ['ChromeOS', /\bCrOS\b/],
  ['Linux', /\bLinux\b/]
]

// a desktop is what is none of these, so it is not listed
const DEVICES: Array<[string, RegExp]> = [
  [
    'bot',
    /bot\b|crawl|spider|slurp|preview|headless|^curl\/|^wget\/|^python-|^go-http|^okhttp/i
  ],
  ['tablet', /\biPad\b|\bTablet\b|\bAndroid\b(?!.*\bMobile\b)/],
  ['mobile', /\bMobile\b|\biPhone\b|\biPod\b/]
]

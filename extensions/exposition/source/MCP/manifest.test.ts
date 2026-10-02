import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Manifest, icons, type Icon } from './manifest.ts'

const URL = 'https://teapots.example/app/manifest.json'

describe('icons', () => {
  it('should resolve a source against the manifest', () => {
    assert.deepEqual(icons({ icons: [{ src: 'icon.png' }, { src: '/root.png' }] }, URL), [
      { src: 'https://teapots.example/app/icon.png' },
      { src: 'https://teapots.example/root.png' }
    ])
  })

  it('should take the type as the MIME type, and split the sizes', () => {
    assert.deepEqual(
      icons({ icons: [{ src: '/a.png', type: 'image/png', sizes: ' 48x48  96X96 any ' }] }, URL),
      [{ src: 'https://teapots.example/a.png', mimeType: 'image/png', sizes: ['48x48', '96x96', 'any'] }]
    )
  })

  it('should leave out a size that is no size', () => {
    assert.deepEqual(icons({ icons: [{ src: '/a.png', sizes: 'huge 0' }] }, URL), [
      { src: 'https://teapots.example/a.png' }
    ])
  })

  it('should show only an icon meant to be shown as it is', () => {
    const shown = icons(
      {
        icons: [
          { src: '/plain.png' },
          { src: '/any.png', purpose: 'any' },
          { src: '/both.png', purpose: 'monochrome any' },
          { src: '/mask.png', purpose: 'maskable' },
          { src: '/mono.png', purpose: 'monochrome' }
        ]
      },
      URL
    ).map((icon) => icon.src)

    assert.deepEqual(shown, [
      'https://teapots.example/plain.png',
      'https://teapots.example/any.png',
      'https://teapots.example/both.png'
    ])
  })

  it('should show only an icon of the manifest\'s origin', () => {
    const shown = icons(
      {
        icons: [
          { src: 'https://teapots.example/same.png' },
          { src: 'https://cdn.teapots.example/sub.png' },
          { src: 'http://teapots.example/plain.png' },
          { src: 'https://teapots.example:8443/port.png' },
          { src: 'data:image/png;base64,AAAA' },
          { src: '//elsewhere.example/icon.png' }
        ]
      },
      URL
    ).map((icon) => icon.src)

    assert.deepEqual(shown, ['https://teapots.example/same.png'])
  })

  it('should show only an image', () => {
    const shown = icons(
      {
        icons: [
          { src: '/a.svg', type: 'image/svg+xml' },
          { src: '/a.txt', type: 'text/plain' },
          { src: '/a.html', type: 'text/html' }
        ]
      },
      URL
    ).map((icon) => icon.src)

    assert.deepEqual(shown, ['https://teapots.example/a.svg'])
  })

  it('should leave out what is not an icon', () => {
    assert.deepEqual(
      icons({ icons: [null, 'icon.png', {}, { src: 1 }, { src: '' }, { src: 'http://[' }] }, URL),
      []
    )
  })

  it('should find none in what lists none', () => {
    for (const document of [{}, { icons: {} }, { icons: 'icon.png' }, [], null, 'manifest'])
      assert.deepEqual(icons(document, URL), [], JSON.stringify(document))
  })
})

describe('Manifest', () => {
  const MINUTE = 60_000

  let fetch: ReturnType<typeof mock.fn>
  let shown: Icon[][]
  let manifest: Manifest

  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout'] })
    shown = []
  })

  afterEach(async () => {
    await manifest.disconnect()
    mock.timers.reset()
  })

  function start(...replies: Array<Response | Error>): Promise<void> {
    fetch = mock.fn(async () => {
      const reply = replies.length > 1 ? replies.shift()! : replies[0]

      if (reply instanceof Error) throw reply

      return reply.clone()
    })

    manifest = new Manifest(URL, (icons) => shown.push(icons), fetch as unknown as typeof globalThis.fetch)

    return manifest.connect()
  }

  async function settle(): Promise<void> {
    for (let i = 0; i < 10; i++) await new Promise((resolve) => setImmediate(resolve))
  }

  function json(value: unknown, init?: ResponseInit): Response {
    return new Response(JSON.stringify(value), init)
  }

  const ICON = { src: '/icon.png', type: 'image/png', sizes: '512x512' }
  const SHOWN = [{ src: 'https://teapots.example/icon.png', mimeType: 'image/png', sizes: ['512x512'] }]

  it('should not wait for the first read', async () => {
    let release!: () => void

    fetch = mock.fn(
      () => new Promise<Response>((resolve) => (release = () => resolve(json({ icons: [ICON] }))))
    )

    manifest = new Manifest(URL, (icons) => shown.push(icons), fetch as unknown as typeof globalThis.fetch)

    await manifest.connect()

    assert.equal(fetch.mock.callCount(), 1)
    assert.deepEqual(shown, [])

    release()
    await settle()

    assert.deepEqual(shown, [SHOWN])
  })

  it('should read it without following a redirect, as a manifest', async () => {
    await start(json({ icons: [ICON] }))
    await settle()

    const [url, init] = fetch.mock.calls[0].arguments as [string, RequestInit]

    assert.equal(url, URL)
    assert.equal(init.redirect, 'error')
    assert.match(new Headers(init.headers).get('accept') ?? '', /application\/manifest\+json/)
    assert.ok(init.signal instanceof AbortSignal)
  })

  it('should read it again every half hour', async () => {
    await start(json({ icons: [ICON] }), json({ icons: [{ src: '/new.png' }] }))
    await settle()

    mock.timers.tick(29 * MINUTE)
    await settle()
    assert.equal(fetch.mock.callCount(), 1)

    mock.timers.tick(MINUTE)
    await settle()
    assert.equal(fetch.mock.callCount(), 2)
    assert.deepEqual(shown.at(-1), [{ src: 'https://teapots.example/new.png' }])
  })

  it('should say nothing of icons that did not change', async () => {
    await start(json({ icons: [ICON] }))
    await settle()

    mock.timers.tick(30 * MINUTE)
    await settle()

    assert.equal(fetch.mock.callCount(), 2)
    assert.deepEqual(shown, [SHOWN])
  })

  it('should retry sooner until it reads one', async () => {
    await start(new Error('refused'), new Response('', { status: 503 }), json({ icons: [ICON] }))
    await settle()

    mock.timers.tick(MINUTE)
    await settle()
    assert.equal(fetch.mock.callCount(), 2)

    mock.timers.tick(MINUTE)
    await settle()
    assert.equal(fetch.mock.callCount(), 2)

    mock.timers.tick(MINUTE)
    await settle()
    assert.equal(fetch.mock.callCount(), 3)
    assert.deepEqual(shown, [SHOWN])
  })

  it('should retry no less often than every half hour', async () => {
    await start(new Error('refused'))
    await settle()

    for (let delay = 1; delay < 30; delay *= 2) {
      mock.timers.tick(delay * MINUTE)
      await settle()
    }

    const count = fetch.mock.callCount()

    mock.timers.tick(30 * MINUTE)
    await settle()

    assert.equal(fetch.mock.callCount(), count + 1)
  })

  it('should keep the icons of the last read that did not fail', async () => {
    await start(json({ icons: [ICON] }), new Error('refused'), new Response('{', { status: 200 }))
    await settle()

    mock.timers.tick(30 * MINUTE)
    await settle()
    mock.timers.tick(30 * MINUTE)
    await settle()

    assert.equal(fetch.mock.callCount(), 3)
    assert.deepEqual(shown, [SHOWN])
  })

  it('should show none where the manifest lists none any more', async () => {
    await start(json({ icons: [ICON] }), json({ name: 'Teapots' }))
    await settle()

    mock.timers.tick(30 * MINUTE)
    await settle()

    assert.deepEqual(shown, [SHOWN, []])
  })

  it('should not read a manifest over 16 KiB', async () => {
    const large = JSON.stringify({ icons: [ICON], padding: 'x'.repeat(16 * 1024) })

    await start(new Response(large))
    await settle()

    assert.deepEqual(shown, [])
  })

  it('should not read what is not JSON', async () => {
    await start(new Response('<html>'), json([ICON]))
    await settle()

    assert.deepEqual(shown, [])
  })

  it('should stop reading once disconnected', async () => {
    await start(json({ icons: [ICON] }))
    await settle()
    await manifest.disconnect()

    mock.timers.tick(60 * MINUTE)
    await settle()

    assert.equal(fetch.mock.callCount(), 1)
  })
})

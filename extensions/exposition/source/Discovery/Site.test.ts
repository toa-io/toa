import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import * as path from 'node:path'
import * as fs from 'node:fs'
import * as os from 'node:os'

import { Site } from './Site.ts'
import * as http from '../HTTP/index.ts'
import type { Input, Output } from '../io.ts'

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'discovery-'))

fs.mkdirSync(path.join(root, '_app', 'immutable'), { recursive: true })
fs.writeFileSync(path.join(root, 'index.html'), 'the page\n')
fs.writeFileSync(path.join(root, 'favicon.ico'), 'icon')
fs.writeFileSync(path.join(root, '_app', 'immutable', 'asset.js'), 'export {}\n')

const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'discovery-empty-'))

const site = new Site(root)

const input = (url: string, method = 'GET'): Input =>
  ({
    request: { method, headers: {} },
    url: new URL(url, 'http://nex.toa.io')
  }) as unknown as Input

const header = (output: Output, name: string): string | null =>
  output?.headers?.get(name) ?? null

describe('discovery site', () => {
  it('should leave a path outside its prefix alone', () => {
    assert.equal(site.intercept(input('/')), null)
    assert.equal(site.intercept(input('/pots/')), null)
  })

  it('should not claim a path that merely starts like its own', () => {
    assert.equal(site.intercept(input('/.discoveryable/')), null)
  })

  it('should send the bare path to the directory it is', () => {
    const output = site.intercept(input('/.discovery'))

    assert.equal(output?.status, 302)
    assert.equal(header(output, 'location'), '/.discovery/')
  })

  it('should keep the query when it redirects', () => {
    const output = site.intercept(input('/.discovery?at=/pots'))

    assert.equal(header(output, 'location'), '/.discovery/?at=/pots')
  })

  it('should serve the page', () => {
    const output = site.intercept(input('/.discovery/'))

    assert.equal(output?.status, 200)
    assert.equal(header(output, 'content-type'), 'text/html; charset=utf-8')
    assert.equal(header(output, 'cache-control'), 'no-cache')
  })

  it('should always carry a content-type and a stream', () => {
    // a stream without one is framed as `multipart/*`, and the page arrives as an envelope
    for (const url of ['/.discovery/', '/.discovery/_app/immutable/asset.js']) {
      const output = site.intercept(input(url))

      assert.ok(output?.headers?.has('content-type'), url)
      assert.ok(output?.body instanceof Readable, url)
    }
  })

  it('should hold a hashed asset forever and an icon for a day', () => {
    assert.equal(
      header(site.intercept(input('/.discovery/_app/immutable/asset.js')), 'cache-control'),
      'public, max-age=31536000, immutable'
    )
    assert.equal(
      header(site.intercept(input('/.discovery/favicon.ico')), 'cache-control'),
      'public, max-age=86400'
    )
  })

  it('should fall back to the page for anything that could be a route', () => {
    const output = site.intercept(input('/.discovery/pots/:id'))

    assert.equal(header(output, 'content-type'), 'text/html; charset=utf-8')
  })

  it('should refuse an asset that is not there', () => {
    // a missing asset is missing, however much a route can look like one
    assert.throws(
      () => site.intercept(input('/.discovery/_app/immutable/gone.js')),
      http.NotFound
    )
  })

  it('should refuse a path that climbs out of the root', () => {
    /*
     * An encoded separator is what reaches here: `..` and `%2e%2e` are dot segments and the
     * URL parser has already collapsed them, but `%2f` keeps a segment whole through it and
     * decodes to one afterwards.
     */
    for (const url of [
      '/.discovery/%2f%2e%2e%2f%2e%2e%2fpackage.json',
      '/.discovery/a%2f..%2f..%2fpackage.json',
      '/.discovery/%2e%2e%2fpackage.json'
    ])
      assert.throws(() => site.intercept(input(url)), http.NotFound, url)
  })

  it('should never see a dot segment, which the URL parser collapses first', () => {
    // `/.discovery/%2e%2e/x` is `/x`, which is not this prefix and not ours to answer
    assert.equal(site.intercept(input('/.discovery/%2e%2e/%2e%2e/package.json')), null)
    assert.equal(site.intercept(input('/.discovery/../../package.json')), null)
  })

  it('should report the length a GET would have returned, and open no stream', () => {
    const output = site.intercept(input('/.discovery/', 'HEAD'))

    assert.equal(output?.status, 200)
    assert.equal(header(output, 'content-length'), '9')
    assert.equal(output?.body, undefined)
  })

  it('should leave OPTIONS on the prefix to the tree', () => {
    // it needs the identity, which is resolved after this stage
    assert.equal(site.intercept(input('/.discovery', 'OPTIONS')), null)
    assert.equal(site.intercept(input('/.discovery/', 'OPTIONS')), null)
  })

  it('should refuse every other method', () => {
    assert.throws(() => site.intercept(input('/.discovery/', 'POST')), http.MethodNotAllowed)
    assert.throws(
      () => site.intercept(input('/.discovery/favicon.ico', 'OPTIONS')),
      http.MethodNotAllowed
    )
  })

  it('should say so where the page is not built', () => {
    const output = new Site(empty).intercept(input('/.discovery/'))

    assert.equal(output?.status, 503)
    assert.equal(header(output, 'content-type'), 'text/plain; charset=utf-8')
    assert.ok(output?.body instanceof Readable)
  })
})

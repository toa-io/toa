# One preflight per URL

## Design concept

A page on another origin asks the gateway once per URL what it may send there, and is told
everything: any method the gateway serves, any request header, for as long as a browser keeps the
answer. What it may read is every header of every reply. None of it depends on which origin asks,
so none of it is computed per request and a cache keeps one copy of a reply for all origins.

### Guarantees

**What a preflight permits**

1. A preflight is answered `204` with `access-control-allow-origin: *`, the methods the gateway
   serves, `access-control-allow-headers: *, authorization` and `access-control-max-age: 86400`.
2. The answer is the same for every URL, origin and requested method or header, so one preflight
   of a URL covers every later request to it.
3. An `OPTIONS` without `access-control-request-method` is not a preflight _(today)_.

**What a reply carries**

4. Every reply carries `access-control-allow-origin: *` and `access-control-expose-headers: *`,
   whatever its status and whether or not the request named an origin. That includes the `503`
   of a gateway that is not working, and the `400` and `501` of a request it does not route.
5. No reply carries `access-control-allow-credentials`, and none varies on `origin`, unless the
   application maps that header itself.

**What is not promised**

6. A request sent with credentials — `credentials: 'include'`, `withCredentials` — is refused by
   the browser.
7. A preflight is not shared between URLs: that is the browser's cache, keyed by URL.

## The changes, by area

1. **Server.** The two reply headers are set on the response before anything else is decided.
2. **`cors` interceptor.** Answers the preflight and nothing else. The registry directives added
   their request headers to is gone, with every call to it.
3. **`map:headers`.** A mapped `origin` is a header the reply varies on, as any other.
4. **Documentation.** `protocol.md`, `map.md`, and the published protocol page.

## Decisions

1. **Wildcards over an echoed origin.** An echoed origin with `allow-credentials` permits the
   same pages and more, and costs a `vary: origin` on every cacheable reply and a list of headers
   that has to be kept true. The gateway sets no cookies, so what credentials mode adds is
   nothing.
2. **A wildcard over a registry of headers.** The registry missed what no directive declared —
   `traceparent`, `mcp-protocol-version`, `range` — and differed between two processes that had
   merged different branches. Echoing `access-control-request-headers` was not considered: a
   browser would then hold a permission for what it asked about only, and ask again.
3. **Headers on every reply, not on those that name an origin.** Without `vary: origin` a cache
   may answer a page with the copy it made for a request that named none.
4. **The longest `max-age` any browser keeps.** Each cuts it to its own limit.
5. **No `cache-control` on a preflight.** A reply to `OPTIONS` is not cacheable, and
   `access-control-max-age` is what a browser reads.

## What happens today

The origin of the request is echoed with `access-control-allow-credentials: true`. Request
headers are permitted from a fixed list that directives add to as they are built, and reply
headers are exposed from a fixed list. A preflight is kept for an hour. A `400` or a `501`
written before the request is routed carries no CORS headers, so a page sees a failed request.

## Verification

1. A preflight permits any header and is kept for a day.
2. A reply is readable from any origin, with or without an `origin` on its request.
3. An error, a `503`, a `400` and a `501` are readable from any origin.
4. An `OPTIONS` that is not a preflight is routed.

## Compatibility

A page that sends its requests with credentials stops working: the browser refuses a wildcard
origin for such a request. A page that sends `authorization` as a header, in the default
credentials mode, is unaffected and preflights less.

## References

- [Fetch: CORS protocol](https://fetch.spec.whatwg.org/#http-cors-protocol)

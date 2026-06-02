# TOA exposition: raw request body support

Task for the TOA framework developer. Needed by the `evn.toa` Stripe webhook integration.

## Why

Stripe signs each webhook with `Stripe-Signature: t=<ts>,v1=<hmac>`, where the HMAC-SHA256 is computed over the byte string `` `${t}.${rawBody}` `` using the endpoint signing secret. Verification (`stripe.webhooks.constructEvent`) requires the **exact original body bytes**. Any re-serialization (JSON parse + stringify, key reordering, whitespace, encoding changes) breaks the signature.

The exposition extension currently makes this impossible for two reasons.

## Current behavior

`extensions.exposition/source/HTTP/messages.ts`:

```ts
export async function read (context: Context): Promise<any> {
  const type = context.request.headers['content-type']

  if (type === undefined)
    return undefined

  if (!(type in formats))                       // (1) exact match
    throw new UnsupportedMediaType()

  const format = formats[type]
  const buf = await context.timing.capture('buffer', buffer(context.request))

  return format.decode(buf)                      // (2) raw buf discarded
}
```

1. Content-type is matched exactly against `formats` keys (`application/json`, `application/yaml`, `text/plain`, `application/msgpack`). Stripe may send `application/json; charset=utf-8`, which is not a key, so the request fails with `415 Unsupported Media Type` before any handler runs.
2. The raw buffer `buf` is immediately decoded (`JSON.parse` for json) and discarded. Operations only ever receive the parsed object; the original bytes are unrecoverable.

## Required changes

1. **Lenient content-type matching.** Parse the media type with a standard RFC 7231 parser instead of an exact-string lookup, so parameters like `; charset=utf-8` are separated from the type. Use jshttp's [`content-type`](https://www.npmjs.com/package/content-type) package (small, well-tested, already the ecosystem standard:

   ```ts
   import contentType from 'content-type'

   const header = context.request.headers['content-type']
   if (header === undefined) return undefined

   const { type, parameters } = contentType.parse(header) // type already lowercased
   if (!(type in formats)) throw new UnsupportedMediaType()

   const format = formats[type]
   const buf = await context.timing.capture('buffer', buffer(context.request))
   return format.decode(buf, parameters.charset) // honor charset when decoding
   ```

   `application/json; charset=utf-8` must resolve to the `application/json` format. Optionally thread `parameters.charset` into `format.decode` so `buffer.toString(charset)` is used instead of the hardcoded default (`utf-8` remains the fallback).

2. **Opt-in raw body.** Provide a way for an exposition route to receive the unparsed body bytes (as `Buffer` or UTF-8 string) in the operation input, bypassing `format.decode`. Suggested options (developer's choice):
   - an exposition directive/flag on the route, e.g. `io:raw: true` or a `raw` mapping target, or
   - a passthrough format that yields the raw bytes/string.

   The raw body must be the exact bytes received, with no normalization.

3. **Expose the value to the operation.** The route should be able to deliver both:
   - the raw body (from change 2), and
   - the `Stripe-Signature` header (already achievable via the existing `map:headers` directive).

## Acceptance

- A `POST` with `Content-Type: application/json; charset=utf-8` is accepted (not 415).
- An operation on a raw-enabled route receives the exact original request body bytes/string, unmodified.
- `map:headers` can deliver `stripe-signature` into the same operation input.
- Existing parsed-body routes are unaffected.

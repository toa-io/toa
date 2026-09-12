# Caching

Directive family `cache` implements the
HTTP [Cache-Control](https://datatracker.ietf.org/doc/html/rfc2616#section-14.9).

## `cache:control`

Sets the value of the `Cache-Control` header
for [successful responses](https://datatracker.ietf.org/doc/html/rfc2616#section-10.2)
to [safe HTTP methods](https://developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP).

```yaml
/:
  GET:
    cache:control: max-age=60000
```

### Implicit modifications

In terms of security, the following implicit modifications are made to the `cache-control` header:

- If it contains the `public` directive without `no-cache` and the request is authenticated,
  the `no-cache` directive is added.
  This is done to prevent the storage of authentication tokens in shared caches.
- If it does not contain the `private` directive and the request is authenticated, the `private`
  directive is added.
  This is to prevent the storage of private data in shared caches.
- If it contains `private` directive and the request is authenticated, then `vary: authorization` is
  added.
  This is to prevent the reuse of private data when authenticated as another identity.[^1]

[^1]:
    This also will invalidate the cache each time a new token is used for the same identity, thus
    limiting the `max-age` value to the token's `refresh` time.
    See [Issuing tokens](components.md#issuing-tokens).

## `cache:exact`

Same as `cache:control` without implicit modifications, and set whatever the method.

```yaml
/:
  GET:
    cache:exact: public, max-age=60000
```

`cache:control` and the implicit value are set on `GET` and `HEAD` only. `cache:exact` is set on
any method, so a reply that must not be stored can say so:

```yaml
/tokens/:
  POST:
    cache:exact: no-store
```

## Validators

A reply to a safe request (`GET`, `HEAD`) is tagged with what it holds: `etag` is a hash of the
body the client receives, whatever that body is. A request sending the tag back in
`if-none-match`, strong or weak (`W/"…"`), is answered `304 Not Modified`.

A reply to an unsafe request carries no tag, nor does one the gateway built out of an exception,
nor one a client may not keep: a reply stating `no-store` is never sent back to be validated.
A directive that states a tag of its own — the checksum of a stored file — keeps it.

`if-match` is [concurrency control](query.md#optimistic-concurrency-control) rather than a
validator of the representation: it carries the `VERSION` a client read in a body, so a Method
whose clients use it lists `VERSION` in its [`io:output`](io.md#output).

## References

- HTTP 14.9.1 [What is cacheable](https://datatracker.ietf.org/doc/html/rfc2616#section-14.9.1)
- See also [features](/extensions/exposition/features/cache.feature)

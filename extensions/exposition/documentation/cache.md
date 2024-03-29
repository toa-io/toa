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

[^1]: This also will invalidate the cache each time a new token is used for the same identity, thus
limiting the `max-age` value to the token's `refresh` time.
See [Issuing tokens](components.md#issuing-tokens).

## `cache:exact`

Same as `cache:control` without implicit modifications.

```yaml
/:
  GET:
    cache:exact: public, max-age=60000
```

## References

- HTTP 14.9.1 [What is cacheable](https://datatracker.ietf.org/doc/html/rfc2616#section-14.9.1)
- See also [features](/extensions/exposition/features/cache.feature)

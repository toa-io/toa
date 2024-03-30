# HTTP request details

The `vary` directives family provides the capability to include HTTP request details as input for an
operation call.

## TL;DR

```yaml
exposition:
  /:group:
    vary:languages: [en, fr]
    GET:
      vary:embed:
        lang: language # predefined embeddings
        realm: realm
        token: :x-access-token # raw header value
        group: /:group # route parameter
      endpoint: observe
```

## Embeddings

Request parts are embedded into the operation call according to the mapping
defined by the `vary:embed` directive.
The keys in the embedding map are the names of the input properties details to be embedded to,
and the values are the names of the embedding functions.
If the value is an array, the first non-empty embedding function's result is used.

> If a property is already present in the input, the embedded value will overwrite its current
> value.

### Realm

The `realm` embedding substitutes the request realm identified.
See [Realms](realms.md) for more details.

### Language

The `language` embedding substitutes the most matching language code based on the `accept-language`
request header and a list of supported languages defined by the `vary:languages` directive, and also
adds `accept-language` to the `vary` HTTP response header value.
If neither of the supported languages matches, the first supported language is used.

### Raw header values

Values in the embedding map starting with a semicolon (:) are the names of HTTP request headers
whose values to be embedded into an operation call.
The names of these headers are then included in the `vary` HTTP response header
and [Access-Control-Allow-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers)
of the [CORS](protocol.md#cors).

[Multiple header fields](https://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2) are embedded
as a comma-separated list.

### Route parameters

Values in the embedding map starting with `/:` are the names of route parameters whose values
to be embedded into an operation call.

### Fallbacks

If the embedding function is an array, the first non-empty resolved value is used.

```yaml
vary:embed:
  ip: # fallbacks
    - :CloudFront-Viewer-Address
    - :CF-Connecting-IP
    - :X-Appengine-User-IP
```

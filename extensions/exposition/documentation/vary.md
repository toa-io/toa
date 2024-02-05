# HTTP request details

The vary directives family provides the capability to include HTTP request details as input for an
operation call.

## TL;DR

```yaml
exposition:
  /:
    vary:realms:
      toa: the.toa.io
    vary:languages: [en, fr]
    GET:
      vary:embed:
        language: lang          # predefined embeddings
        realm: realm
        :x-access-token: token  # raw http header value
      endpoint: texts.get
```

## Embeddings

Request parts are embedded into the operation call according to the mapping
defined by the `vary:embed` directive.
The keys in the embedding map are the names of the embedding functions, and the values are the
property names of the operation call input object.

> If a property is already present in the input, the embedded value will overwrite its current
> value.

### Realm

Realm is an identifier of a domain used to access the Exposition.
The list of domains is defined by the `vary:realms` directive,
which is a map of realm names to their domain names.

The `realm` embedding substitutes the realm identified based on the `host` request header.

### Language

The `language` embedding substitutes the most matching language code based on the `accept-language`
request header and a list of supported languages defined by the `vary:languages` directive, and also
adds `accept-language` to the `vary` HTTP response header value.

### Raw header values

Keys in the embedding map starting with a semicolon (:) are the names of HTTP request headers whose
values to be embedded into an operation call.
The names of these headers are then included in the `vary` HTTP response header
and [Access-Control-Allow-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers)
of the [CORS](protocol.md#cors).

[Multiple header fields](https://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2) are embedded
as a comma-separated list.

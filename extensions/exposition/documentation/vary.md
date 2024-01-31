# HTTP request details

The `vary` directives family provides an ability to pass HTTP request details as an input for
an operation call.

## TL;DR

```yaml
exposition:
  /:
    vary:languages: [en, fr]
    GET:
      vary:map:
        language: lang        # predefined embeddings
        :x-access-token: token # raw http header value
      endpoint: texts.get
```

## Embeddings

Request parts are embedded into operation call according to the mapping
defined by `vary:map` directive.
The embedding map keys are names of the embedding functions and values
are property names of the operation call input object.

### Language

Language embedding substitutes the most matching language code,
according to the [`accept-language` request header](#TODO) and a list of supported languages,
defined by `vary:languages` directive.

Language embedding adds `accept-language` value to the `vary` HTTP response header.

### Raw headers

Keys of the embedding map
starting with semicolon (`:`) are embedded as raw values of the corresponding HTTP request headers.
Names of these headers are added to the `vary` HTTP response header.

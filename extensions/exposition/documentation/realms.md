# Realms

Realms is a mechanism that allows serving multiple business domains from a single instance of the
application.

## Definition

The `realms` definition is a map of realm identifiers to the `Host` header values.

```yaml
# context.toa.yaml

exposition:
  realms:
    one: the.one.com
    two: the.two.com
```

## Ingress

Each host in the Realms definition is used to create a Kubernetes Ingress resource.

> In case the application is accessed with the `Host` header that does not match any of the realms,
> the `realm` value is `undefined`.

## Embedding

To pass the requested realm to the operation call, [`vary:embed` directive](vary.md#embeddings) can
be used.

```yaml
# manifest.toa.yaml

exposition:
  /:
    GET:
      vary:embed:
        realm: realm
      endpoint: observe
```

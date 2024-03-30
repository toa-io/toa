# Realms

Realms are a mechanism that allows serving multiple business domains from a single instance of the
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

> If the application is accessed with the `Host` header that does not match any of the realms, the
> `404 Not Found` response is returned.

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

## Identity

Credentials stored or issued by the [authentication system](identity.md) are associated with a
realm.
Credentials of one realm are not valid in another realm,
or may be associated with a different Identity; in other words, Identity exists in the context of a
realm.

> :warning:<br/>
> Changing the realm identifier will break compatibility with existing stored or issued credentials.

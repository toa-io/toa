# Authorities

Authorities are a mechanism that allows serving multiple domains from a single instance of the
application.

## Definition

The `authorities` definition is a map of authority identifiers to the `:authority` pseudo-header
values.

```yaml
# context.toa.yaml

exposition:
  authorities:
    one: the.one.com
    two: the.two.com
```

## Ingress

Each host in the authority definition is used to create a Kubernetes Ingress resource.

> If the application is accessed with the `:authority` that does not match the authority definition,
> the `404 Not Found` response is returned.

## Embedding

To pass the requested authority to the operation call, [`vary:embed` directive](vary.md#embeddings)
can be used.

```yaml
# manifest.toa.yaml

exposition:
  /:
    GET:
      vary:embed:
        app: authority
      endpoint: observe
```

## Identity

Credentials stored or issued by the [authentication system](identity.md) are associated with an
authority.
Credentials in one authority are not valid in another,
or may be associated with a different Identity; in other words, Identity exists in the context of an
authority.

> :warning:<br/>
> Changing the authority identifier will break compatibility with existing stored or issued
> credentials.

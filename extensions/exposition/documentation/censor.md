# Censor

```yaml
# context.toa.yaml

exposition:
  censor:
    header: cf-ipcountry
    values: [RU, IR]
```

A request whose `header` holds one of `values` is answered `451 Unavailable For Legal Reasons` with
an empty body, whatever its path. It is refused before it is routed or authenticated, and calls no
operation. The reply carries the CORS headers and the preflight is answered, so a page reads the
status.

The header name matches in any case. A value matches exactly: `ru` is a different value from `RU`.
A request without the header, or with a value `values` does not list, is served.

The header is taken as it arrives. In production an edge in front of the gateway — a CDN, a load
balancer, an ingress — writes it, and a client that reaches the gateway around that edge sends
whatever value it chooses, or none. See [Client address](ip.md).

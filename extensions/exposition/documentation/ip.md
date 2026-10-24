# Client address and country

The address a request comes from is resolved once, into the request context, and read from there
by whatever keys on it: the meter of [failed authentications](identity.md#failed-authentications)
and the `ip` key of [`io:throttle`](io.md#key-components).

```yaml
# context.toa.yaml

exposition:
  ip: cf-connecting-ip
```

`ip` names the header the address is read from. In production the gateway sits behind a load
balancer, an ingress or a CDN: the connection it accepts comes from that machine, so every client
shares one address and nothing tells them apart. The edge is the one that saw the client connect,
and it writes the client's address into a header of its own, `CF-Connecting-IP`, `X-Real-IP` or
`X-Forwarded-For`, depending on the infrastructure. A client may send any of these headers too, so
the gateway trusts none of them on its own: the deployment names the one its edge overwrites, and
where the header holds a list, the last value is the one the edge appended.

The connection's address is never used. Without `ip`, or for a request that does not carry the
header, the request has no address: the bouncer and a throttle keyed on `ip` let it through and
say so in the log, once per hundred seconds rather than once per request.

## Country

```yaml
# context.toa.yaml

exposition:
  country: cf-ipcountry
```

`country` names the header the client's country is read from, which the edge writes as it writes
the address: `CF-IPCountry` behind Cloudflare, `CloudFront-Viewer-Country` behind CloudFront, a
header of the deployment's own behind a load balancer or an nginx that resolves it. It is taken
as the edge wrote it, and the gateway resolves nothing: without `country`, or for a request that
does not carry the header, the request has no country.

It is read once, as the address is, by [`censor`](censor.md) and by
[`map:country`](map.md#client-address-and-country). The same trust holds: a client that reaches the
gateway around the edge sends whatever value it chooses.

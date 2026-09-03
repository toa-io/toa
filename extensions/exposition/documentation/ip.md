# Client address

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

Without `ip`, and for a request that does not carry the header, the address is the connection's,
which is right for a gateway that clients reach directly and useless behind a balancer.

# Censor

```yaml
# context.toa.yaml

exposition:
  country: cf-ipcountry
  censor: [RU, IR]
```

A request from one of the countries `censor` lists is answered `451 Unavailable For Legal Reasons`
with an empty body, whatever its path. It is refused before it is routed or authenticated, and
calls no operation. The reply carries the CORS headers and the preflight is answered, so a page
reads the status.

The country is the request's, as [`exposition.country`](ip.md#country) reads it, and is compared
exactly: `ru` is a different value from `RU`. A request of no country — one without the header, or
any request where `country` names none — is served, and so is one from a country `censor` does
not list.

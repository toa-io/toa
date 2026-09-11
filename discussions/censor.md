# Censoring requests by a header

## Design concept

The exposition annotation names a request header and the values that censor a request. The
gateway answers a request whose header holds one of those values with `451 Unavailable For Legal
Reasons`, and does nothing else with it.

### Guarantees

**A censored request**

1. Is answered `451` with an empty body, whatever its path, `/.rpc`, `/.mcp` and `/.discovery`
   included. Routing, authentication, throttling and operation calls never see it.
2. Carries the CORS headers every reply carries, and its preflight is answered as any other, so a
   page reads the `451`.

**Matching**

3. The header name matches in any case. A value matches when it equals a declared one, character
   for character.
4. A request without the header, or with a value the annotation leaves out, is served as before.

**Limits**

5. The gateway takes the header as it arrives. A client that reaches the gateway around the edge
   that writes the header sends whatever value it chooses, or none.

### What an application declares

```yaml
# context.toa.yaml

exposition:
  censor:
    header: cf-ipcountry
    values: [RU, IR]
```

## The changes, by area

1. **Annotation.** `censor` joins the annotation schema and the `Annotation` type: `header` and a
   non-empty `values`, both required. The deployment carries it into `TOA_EXPOSITION_PROPERTIES`.
2. **Gateway.** An interceptor right after `cors` throws `UnavailableForLegalReasons` for a
   censored request. The server's error path writes it, through the response pipeline `cors` has
   already set up.
3. **Documentation.** `extensions/exposition/documentation/censor.md`, and a `censor` row in the
   readme's option table.

## Decisions

1. **After `cors`.** A cross-origin reply without CORS headers reaches a page as a network failure,
   indistinguishable from an unreachable gateway. `cors` reads only `Origin` and the preflight
   headers, and answers a preflight from its own settings, so what it exposes is the same for every
   request.
2. **Exact values.** The edge writes the header in one form, and the declaration states that form.
3. **Header name in any case.** Header names are case-insensitive and arrive lower-cased, so
   `CF-IPCountry` and `cf-ipcountry` declare the same censor. One that missed on case would refuse
   nothing, silently.

## Verification

1. `extensions/exposition/features/censor.feature`:
   - _A censored request is refused before it is routed_: an anonymous route and a protected one
     both answer `451`.
   - _Any other request is served_: another value, and no header at all.
   - _A page reads the refusal_: the preflight is answered `204`, and the `451` carries
     `access-control-allow-origin`.
2. `features/extensions/exposition/deployment.feature`, _Deploying the `censor` option_:
   `TOA_EXPOSITION_PROPERTIES` carries `censor`.
3. `definitions/source/extensions.exposition/schemas.test.ts`: `censor` requires `header` and at
   least one value.

## Compatibility

`censor` is optional, and a context that declares none is served as it is today.

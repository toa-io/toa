# Performance of the request path

## Design concept

What a request costs was measured with the [benchmarks](./benchmarks.md) on one machine, and
against the same work written by hand — `node:http`, `amqplib`, the `mongodb` driver and `jose`, on
the same broker, database and cores. On the simple path Toa costs two to three times what the work
costs. On two paths it costs several times more, and for reasons no part of the design needs:

- every AMQP socket runs with Nagle's algorithm, so at light load each call waits about 10 ms to be
  coalesced with a write that never comes, and a storage read queues long before any process is
  busy;
- the gateway parses a component's JSON reply and encodes it again, which for a thousand entities is
  six times what forwarding the bytes costs.

The rest is work done on every request that a few percent each add up to: an exception object built
for every finished request, a module resolved on every token check, an environment variable read on
every operation, a trace context matched by a regular expression, a call identity hashed through a
general-purpose package, a record copied through a rest spread, and a token opened through
WebCrypto's argument handling.

Each of them is removed, while every answer the gateway gives stays byte for byte what it is, and
each change is measured before and after with the benchmarks.

### Guarantees

**Latency**

1. A call is written to the broker when it is made. At 100 requests per second the p50 of `small` and
   `observe` on the reference machine is under 1 ms; it is 10.4 ms today.
2. A storage read is bounded by the CPU of the processes it passes through: `observe` saturates where
   its gateway and component run out of CPU, 9,170 requests per second on the reference machine
   against 3,781 today.

**Cost**

3. A JSON reply the gateway leaves unchanged reaches the client as the component encoded it: the
   gateway neither parses nor encodes it.
4. A request that finishes builds no exception object, a token check resolves no module, an operation
   reads no environment variable, and a record is copied once.

**What stays as it is**

5. What a client receives — status, headers and body — is byte for byte what it receives today, for
   every route, format and directive.
6. Tokens keep their format, keys and lifetimes: a token issued before the change opens after it, and
   one issued after it opens in a gateway from before it.
7. What `io:output` admits and refuses, and the message it refuses with, stay as they are.

**What is left out**

8. The numbers are the reference machine's. The benchmarks compare revisions on whatever machine runs
   them.
9. `create`, a call between two components of one process, `tools/list`, HTTP/2 and the deadline of a
   call to a component with no running instance are measured below and keep their cost here.

### What a component author does differently

Nothing.

## The changes, by area

| # | change | measured today | expected | effort | risk | stage |
| --- | --- | --- | --- | --- | --- | ---: |
| 1 | `noDelay` on comq's sockets | `small` p50 at 100 rps 10.36 ms; `observe` saturates at 3,781 rps with its processes under 40% of a core | `small` p50 at 100 rps 0.68 ms; `observe` saturates at 9,170 rps | one option in comq, a release, the dependency | low | 1 |
| 2 | A JSON reply forwarded as bytes | `list.1000` gateway 10,629 µs; forwarding costs 1,780 µs by hand | about 8 ms less per 1,000-entity list in the gateway | medium: the call, the binding, comq and the gateway | medium | 3 |
| 3 | Records translated without a rest spread | `record.js` `from` 26% of the component on `list.1000`, about 2.6 µs a record | about 2.5 ms less per 1,000-entity list in the component | a few lines | low | 2 |
| 4 | `track()` aborts a request's controller only when its reply is unfinished | the `DOMException` of the abort is 7.4% of the gateway on `small` | about 5–7 µs less per request in the gateway | a few lines | low | 2 |
| 5 | `identity.tokens` imports `jose` once | importing and resolving `jose` on every decrypt is 4.2% of the gateway on `token.id` | about 8 µs less per authenticated request | a few lines | low | 2 |
| 6 | An operation reads `TOA_ENV` when it is created | `environment.get` is 1.6–3.6% of a component | about 0.4–1.8 µs less per operation | a few lines | low | 2 |
| 7 | The traceparent is read by position | the regular expression is 2.2–5.1% of a component | about 0.5–2 µs less per message | a few lines | low | 2 |
| 8 | `derive` hashes with `node:crypto` | the `uuid` package is 6% of `bench` on `chain` | about 2 µs less per call made inside a call | a few lines | low | 2 |
| 9 | Tokens opened with `node:crypto` | jose `jwtDecrypt` 40 µs; `node:crypto` 10.9 µs | about 30 µs less per authenticated request | low | low: the same algorithm and bytes | 2 |
| 10 | `io:output` checks entity types without Ajv | 2.2 µs per 1,000 entities | the same answers from a plainer check | low | low | 2 |

1. **The broker's sockets.** comq connects with `noDelay: true` beside `keepAlive` in
   `SOCKET_OPTIONS`; without it amqplib calls `setNoDelay(false)`. A release of comq carries it, and
   `bindings.amqp` depends on that release.

2. **Replies the gateway forwards.**
   - The gateway sends with a call the properties `io:output` permits, or that it permits all of them.
   - The component's binding projects the reply to those properties as it encodes it — each entity's
     own properties in their own order, as `io:output` fits them — and marks the message as projected.
     `VERSION`, `UPDATED` and `CREATED`, which the cache directives read, travel in the message's
     headers.
   - comq hands a reply marked as projected to its caller as bytes.
   - The gateway writes those bytes as the body where the response is JSON, the reply is neither an
     error nor a stream, and no directive of the response pipeline changes the body. Every other reply
     — another format, `/.rpc`, `/.mcp`, a message without the mark — is decoded and restricted as it
     is today.

3. **Records.** `record.js` `from` builds an entity by setting `id` and then copying every property of
   the record but `_id`, in the record's order, where it now uses a rest spread.

4. **The abort of a request.** `HTTP/Server.ts` `track()` aborts a request's controller on `close`
   only when the reply is unfinished; a finished reply has nothing left to cancel, and its abort built
   a `DOMException` for every request.

5. **The import of jose.** `identity.tokens` holds the promise of importing `jose`, made once, and
   awaits it on every call.

6. **`TOA_ENV`.** An operation reads `TOA_ENV` when it is created and holds it.

7. **The traceparent.** `component.ts` and `receiver.ts` read a traceparent by position: the header
   has a fixed layout of 55 characters.

8. **The call identity.** `entities/newid.ts` `derive` hashes with `node:crypto` into the same
   name-based UUID v5 bytes the `uuid` package produces.

9. **Tokens.** `identity.tokens` opens a `dir` + `A256GCM` token with `node:crypto`: the compact
   serialization split into its five parts, the protected header checked for `alg`, `enc` and `kid` as
   jose checks it, the ciphertext opened with AES-256-GCM with the protected header as additional
   authenticated data, and the claims checked as `jwtDecrypt` checks them. Issuing stays with jose,
   since a token is issued once a `refresh`. PASETO keys are read as they are.

10. **`io:output`.** The restriction checks that every entity of an array body is an object by its
   type as it fits it, where it now runs Ajv over the body first, and throws the same message for an
   entity that is something else. A body that is neither an object nor an array is omitted with a
   warning, as it is today.

## Decisions

- **Nagle is switched off in the client.** A request and a reply are each written once and are a few
  hundred bytes long, which is exactly what the algorithm holds back and nothing it helps with. The
  hand-written baseline has the same 10 ms floor with amqplib's default and loses it with `noDelay`,
  so the option is the whole cause.
- **The token format stays.** A token opened with `node:crypto` costs 10.9 µs, and jose costs 40; an
  HMAC-signed token would cost 8.9. A new format would save 2 µs and cost a format.
- **A reply is projected where it is encoded.** The component walks the reply once to encode it, and
  restricting in the same pass leaves the gateway with bytes it can write. A reply from a component
  that projects nothing is still restricted by the gateway, so a gateway and a component of different
  versions answer the same bytes.
- **The restriction applies to what the operation answers.** `query.projection` is what a storage
  reads, and `io:output` is what a client may receive of an operation's reply. An operation may
  rename, compute or replace what it read, so a property of the same name can carry another meaning,
  and the two contracts stay separate even where their names coincide. The permitted properties
  therefore travel beside the call, and the reply is restricted after the operation has produced it.
- **A reply is forwarded only where nothing changes its body.** The other paths — formats, RPC, MCP,
  errors, streams — are where a body is changed or re-encoded by design, and they are the rare ones.
- **A traceparent is read by position.** A component's log lines carry the trace and span ids of the
  call they belong to, so the header is read on every message; reading it by position keeps that and
  drops the expression.
- **An operation reads `TOA_ENV` when it is created.** A suite sets the environment before it boots a
  composition, and a module is loaded before that.
- **The changes are measured one at a time.** Each is a few percent of a request, which is what the
  benchmarks resolve on the reference machine only for the gateway, so each is verified alone and the
  set of them together.

## Context

[Benchmarks](./benchmarks.md) is the instrument; this is what it measured. The call identity hashed
on every call is the one [transactional inbox](./transactional-inbox.md) derives.

## What happens today

Measured at `1.0.0-alpha.302` on the reference machine: AMD Ryzen 7 7800X3D (8 cores, 16 threads),
Node 24, RabbitMQ 3.10 and MongoDB 8.0.16 from the compose stack, the gateway, the components and the
load generator pinned to cores of their own. CPU is microseconds per request per process, all threads,
at half of saturation, less what the process spends at rest.

**What a request costs.**

| scenario | saturation, rps | gateway µs | component µs | p50 at half load | bounded by |
| --- | ---: | ---: | ---: | ---: | --- |
| `small` | 13,574 | 91 | 24 | 1.45 ms | gateway CPU |
| `small.h2c` | 10,454 | 124 | 26 | 1.58 ms | gateway CPU |
| `observe` | 3,162 | 130 | 142 | 21.6 ms | Nagle |
| `list.1000` | 94 | 10,629 | 9,154 | 12.7 ms | gateway CPU |
| `create` | 2,530 | 215 | 454, and 51 in `peer` | 4.0 ms | component CPU and MongoDB |
| `chain` | 11,486 | 106 | 67, and 32 in `peer` | 2.0 ms | gateway CPU |
| `token.id` | 5,870 | 242 | 31 | 1.7 ms | gateway CPU |
| `mcp.tools.list` | 3,572 | 317 | — | 0.6 ms | gateway CPU |

A request of `small` publishes 2 messages; `observe` 2 messages and 1 database operation; `create` 4
messages and 2 operations. Re-issuing an aged token costs 810 µs in the gateway and 3 operations,
once per client per `refresh`.

**Against the same work written by hand.**

| scenario | saturation, Toa / by hand | gateway µs, Toa / by hand | component µs, Toa / by hand |
| --- | --- | --- | --- |
| `small` | 13,574 / 29,397 | 91 / 34 | 24 / 13 |
| `observe` | 3,162 / 9,559 | 130 / 46 | 142 / 89 |
| `list.1000` | 94 / 174 | 10,629 / 1,780 | 9,154 / 4,620 |

The hand-written gateway forwards a reply's bytes.

**Nagle.** p50 of `small` against load, and of `observe`, with the sockets as they are and with
`noDelay`:

| rate, rps | `small` | `small`, `noDelay` | `observe` | `observe`, `noDelay` |
| ---: | ---: | ---: | ---: | ---: |
| 100 | 10.36 ms | 0.68 ms | 10.36 ms | 0.94 ms |
| 400 | 2.83 ms | 0.45 ms | 2.86 ms | 0.71 ms |
| 800 | 1.70 ms | 0.38 ms | 1.75 ms | 0.65 ms |
| 1,890 | — | — | 25.29 ms | — |
| 4,585 | — | — | — | 1.15 ms |
| saturation | 13,271 rps | 14,587 rps | 3,781 rps | 9,170 rps |

At 3,024 requests per second with Nagle, `observe` is at a p50 of 64 ms while its gateway and
component use a third of a core each and MongoDB answers each read in 0.055 ms.

**Single operations.**

| operation | µs |
| --- | ---: |
| jose `jwtDecrypt`, `dir` + `A256GCM` | 40 |
| the same token opened with `node:crypto` AES-256-GCM, claims parsed | 10.9 |
| jose `jwtVerify`, HS256 | 32.7 |
| HMAC-SHA256 verified with `node:crypto`, claims parsed | 8.9 |
| `JSON.parse` of 1000 entities (446 KiB) | 974 |
| `JSON.stringify` of 1000 entities | 884 |
| the `io:output` fit of 1000 entities | 369 |
| Ajv's shape check in `io:output`, 1000 entities | 2.2 |
| `structuredClone` of 1000 entities | 1,484 |

**Where the time goes.** Shares of the main thread in the measured window:

- `list.1000`, gateway: garbage collection 30%, parsing the component's reply 27%, encoding the
  response 23%.
- `list.1000`, component: `record.js` `from` 26%, about 2.6 µs a record; BSON decoding about 35%;
  garbage collection 14%; encoding the reply 11%.
- `small`, gateway: the `DOMException` of `track()`'s abort 7.4%; socket writes 15%; the AMQP client
  and its JSON about 11%; exposition's own code 15%.
- Components, on every call: `environment.get('TOA_ENV')`, which misses the store and reads
  `process.env`, 1.5–3.6%; the traceparent expression 2–5%; the `uuid` package's name-based hash 6% of
  `bench` in `chain`.
- `token.id`, gateway: jose 6.8%, WebCrypto's argument handling about 4%, and the import of `jose`,
  twice a request, about 4%. The request costs 151 µs more than `small`; jose is 40 of it, and the
  call to the identity component inside the gateway most of the rest.
- `mcp.tools.list`: `structuredClone` of every tool's description 25%.
- Spans are created for the request alone while nothing records a trace, and publisher confirms are
  on for events alone.

**Also measured.** HTTP/2 costs the gateway 33 µs more than HTTP/1.1 on `small`. `create` is bounded
by MongoDB, at 115% of a core at 2,017 requests per second. A call to a component with no running
instance has no deadline unless the caller gives it a `timeout`, so the client of such a request waits
until it disconnects.

## Stages

1. **The sockets.** The comq release and the dependency on it, measured with `--curve`.
2. **Work on every request, records, tokens and `io:output`**, each a change of its own.
3. **Forwarded replies**: the permitted properties on the call, the projection in the binding, the
   bytes in comq, and the write in the gateway.

## Verification

- **Latency.** Measured against load, before and after stage 1, with a `--curve` mode the benchmarks
  gain for it: each scenario at rising fixed rates from 100 requests per second to saturation, with
  p50, p99 and the CPU of each process at every rate. A comparison at half of saturation hides a delay
  that only light load shows. The p50 of `small` and `observe` at 100 requests per second is under
  1 ms, and `observe` saturates at twice its rate or more.
- **Cost.** With `npm run bench` against the revision before each change of stages 2 and 3: the
  process a change touches comes out faster or inconclusive, and no process comes out slower. Stage 2
  as a whole comes out faster in the gateway on `small` and `token.id`, and in the component on
  `list.1000`; stage 3 comes out faster in the gateway on `list.1000`.
- **Answers.** The exposition suite passes as it is, in HTTP/1.1 and in h2c.
- **Forwarded replies.** A route with `io:output` returns the bytes it returns today for an object, an
  array and a permitted subset; a component from before stage 3 behind a gateway from after it, and a
  gateway from before it in front of a component from after it, answer the same bytes; a reply in
  another format, from `/.rpc` or from `/.mcp` answers as it does today.
- **Tokens.** A token jose issued opens with the new code, and one with a changed tag, a changed
  header, another `kid`, another issuer or a passed expiry is refused as jose refuses it.
- **Identities.** `derive` answers the bytes the `uuid` package answers for the same parts.
- **`io:output`.** An array holding a string or a number answers the error it answers today, and a
  body that is a string or a number is omitted with the warning it is omitted with today.

## Compatibility

**On the wire.** The permitted properties on a call, the projection mark and the cache headers on a
reply are added fields. A component that reads none of them replies with the whole entity, which the
gateway restricts as it does today; a gateway that reads none of them decodes a projected reply, whose
entities its restriction leaves as they are.

**In behaviour.** None: guarantees 5 to 7.

## References

- J. Nagle, [RFC 896](https://www.rfc-editor.org/rfc/rfc896), *Congestion Control in IP/TCP
  Internetworks* — the algorithm `noDelay` switches off.
- [RFC 7516](https://www.rfc-editor.org/rfc/rfc7516), JSON Web Encryption — the compact serialization
  opened by hand.
- [RFC 9562](https://www.rfc-editor.org/rfc/rfc9562), UUIDs — the name-based version 5 `derive`
  produces.
- [W3C Trace Context](https://www.w3.org/TR/trace-context/) — the fixed layout of `traceparent`.

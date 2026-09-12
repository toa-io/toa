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

A route states two things of its own: what an observation reads from the database, and what a
client receives of the operation's answer. The gateway sends both with the call. The component reads
what the route projects, restricts its answer once the operation has given it, and encodes it; where
the client takes JSON and nothing on the route changes the body, the gateway writes those bytes to
the client as they arrived.

The rest is work done on every request that a few percent each add up to: an exception object built
for every finished request, a module resolved on every token check, an environment variable read on
every operation, a call identity hashed through a general-purpose package, a record copied through a
rest spread, and a token opened through WebCrypto's argument handling. Each of them is removed, and
each change is measured before and after with the benchmarks.

### Guarantees

**Latency**

1. A call is written to the broker when it is made. At 100 requests per second the p50 of `small` and
   `observe` on the reference machine is under 1 ms; it is 10.4 ms before comq 0.20.1.
2. A storage read is bounded by the CPU of the processes it passes through: `observe` saturates where
   its gateway and component run out of CPU, 9,170 requests per second on the reference machine
   against 3,781 before comq 0.20.1.

**What is read and what is answered**

3. An observation reads what its route's `projection` lists, with `id` and the system properties,
   and its algorithm receives those. A route without `projection` reads the whole entity *(today)*.
4. An operation of every other type answers a request whose query carries a projection with a
   request contract exception and changes nothing, whether or not the request is marked authentic. A
   route that declares a projection for such an operation fails to boot.
5. A request that carries `output` receives, of each object of the output, the properties it lists,
   in the order the object holds them; with an empty list it receives no output. A request without
   `output` receives the whole output *(today)*.
6. What a route's requests carry as `output` is what its `io:output` lists: the properties common to
   the lists a method declares and inherits, all of them for `true`, and an empty list for a method
   that declares none or `false`.
7. A reply without output has no body and takes the status an absent body takes: 204, 201 to `POST`,
   and 404 where the operation found nothing.
8. A reply to a safe request is tagged with a hash of the body it carries, and a client that sends
   that tag back in `if-none-match` is answered 304. `if-match` carries the `VERSION` a client read
   in a body, which is what a stale write is refused by.

**Cost**

9. A JSON reply that no directive changes reaches the client as the component encoded it: the gateway
   neither parses nor encodes it.
10. A request that finishes builds no exception object, a token check resolves no module, an operation
    reads no environment variable, and a record the storage reads is renamed in the object the driver
    decoded.

**What stays as it is**

11. Tokens keep their format, keys and lifetimes: a token issued before the change opens after it, and
    one issued after it opens in a gateway from before it.
12. `derive` answers the bytes the `uuid` package answers for the same parts, and a token is opened and
    refused where jose opens and refuses it.

**What is left out**

13. The numbers are the reference machine's. The benchmarks compare revisions on whatever machine runs
    them.
14. `create`, a call between two components of one process, `tools/list`, HTTP/2 and the deadline of a
    call to a component with no running instance are measured below and keep their cost here.
15. A component deployed before the change answers its whole output to a gateway deployed after it,
    until it is deployed again.
16. The order of an entity's properties: `id` comes after the properties its record holds.

### What a component author does differently

A route may state what an observation reads, and lists in `io:output` the properties `io:status` and
`auth:incept` read:

```yaml
/items:
  GET:
    endpoint: enumerate
    query:
      projection: [title, status, owner]
    io:output: [id, title, status]
```

A component may ask for part of what another operation answers:

```javascript
const items = await context.local.enumerate({ query: { limit: 10 }, output: ['id', 'title'] })
```

## The changes, by area

| # | change | measured today | expected | effort | risk | stage |
| --- | --- | --- | --- | --- | --- | ---: |
| 1 | `noDelay` on comq's sockets | `small` p50 at 100 rps 10.36 ms; `observe` saturates at 3,781 rps with its processes under 40% of a core | `small` p50 at 100 rps 0.68 ms; `observe` saturates at 9,170 rps | comq 0.20.1; the dependency in `bindings.amqp` | low | 0 |
| 2a | A route's projection reaches an observation's storage | `Query.fit` drops a declared `projection`; `record.js` `from` and BSON decoding are 61% of the component on `list.1000` | a share of those in proportion to what a route leaves unread | `Query.fit`, the definitions' check, the refusal by type, a copy in `query/options.ts`, the callee's contract; `query` scenarios | low | 3 |
| 2b | The reply restricted in the component | the `io:output` fit of 1,000 entities 369 µs in the gateway | the fit in the component, on the reply the operation built; what a route leaves out crosses no process | `Request.output`, `Operation.invoke`, `io:output`, `Endpoint`; `io`, `cache`, `rpc`, `mcp` scenarios | medium: what a client receives changes as Compatibility states | 4 |
| 2c | A JSON reply forwarded as bytes | `list.1000` gateway 10,629 µs; forwarding costs 1,780 µs by hand | about 8 ms less per 1,000-entity list in the gateway | the mark on the request; both sides of `bindings.amqp`; `Endpoint`, `send` and the tag it writes; scenarios across formats and protocols | medium | 5 |
| 3 | Records renamed in place | `record.js` `from` 26% of the component on `list.1000`: a rest spread costs 2.68 µs a decoded record | about 2 ms less per 1,000-entity list in the component: the rename costs 0.26 µs a record, and encoding the renamed record 0.43 µs more | `from`, two lines; `record.test.js` | low | 1 |
| 4 | `track()` aborts a request's controller only when its reply is unfinished | the `DOMException` of the abort is 7.4% of the gateway on `small` | about 5–7 µs less per request in the gateway | one condition on `writableFinished`; `interruptions.feature` in HTTP/1.1 and h2c | low | 1 |
| 5 | `identity.tokens` imports `jose` once | importing and resolving `jose` on every decrypt is 4.2% of the gateway on `token.id` | about 8 µs less per authenticated request | the import's promise held in `lib/jose.js`, two lines; `decrypt.test.ts` | low | 1 |
| 6 | An operation reads `TOA_ENV` when it is created | `environment.get` is 1.6–3.6% of a component | about 0.4–1.8 µs less per operation | a field of `Operation`; the feature suites, whose steps set `TOA_ENV` before they boot | low | 1 |
| 7 | `derive` parses its namespace once and hashes the name directly | the `uuid` package is 6% of `bench` on `chain`: 3.07 µs a call | about 1.6 µs less per call a component makes while serving one | about 12 lines; `newid.test.js` against the package's bytes | low | 1 |
| 8 | Tokens opened with `node:crypto` | jose `jwtDecrypt` 40 µs; `node:crypto` 10.9 µs | about 30 µs less per authenticated request | about 50 lines in place of `jwtDecrypt` and `decodeProtectedHeader`; `decrypt.test.ts` with a jose-issued token and a changed tag, IV, header and ciphertext | medium: every token the gateway accepts passes through it | 2 |


1. **The broker's sockets.** comq connects with `noDelay: true` beside `keepAlive` in
   `SOCKET_OPTIONS`; without it amqplib calls `setNoDelay(false)`. comq 0.20.1 carries it, and
   `bindings.amqp` depends on that release.

2. **Replies.**

   a. **Projection.**
   - Exposition's `Query` carries the `projection` a route declares into the request's query.
   - The definitions refuse a `projection` on a method whose operation is not an observation, and
     `id` in one, since `id` is always read.
   - An operation of every type but observation refuses a query that carries a projection with a
     `RequestContractException`, whether the request is authentic or not.
   - `query/options.ts` adds the system properties to a copy of the projection, so the declaration
     a gateway sends with every request stays as it was declared.

   b. **Restriction.**
   - A request carries `output`, a list of property names.
   - `Operation.invoke` restricts the reply the operation built as it returns it; the reply recorded
     for a call made `once` is the whole one. An empty list removes the output. Otherwise each object
     of the output, and each object of an array output, keeps the listed properties in its own order,
     and every other value is answered as it is. A `null` reply, an error, an exception and a stream
     are answered as they are.
   - `io:output` puts its list on the call and reads nothing of the reply: the lists a method
     declares and inherits give the properties common to them, `true` gives none, and a method that
     declares none or `false` gives an empty list.
   - `identity.grants` lists `status` in the `io:output` of the route whose errors `io:status`
     answers.

   c. **Bytes.**
   - A request says that its caller reads an output encoded rather than as values, and whoever
     answers it encodes the output once: comq carries a Buffer as `application/octet-stream` and
     hands it to its caller as it is.
   - `bindings.amqp` answers such a request whose output is an object or an array with the bytes of
     it, and every other request — an error, an exception, a stream, an absent output — with the
     reply it is. A reply that arrives as bytes reaches `Call` as an output of its own.
   - `io:status` and `auth:incept` say that they read the body. `Endpoint` asks for bytes where the
     response is JSON, nothing said so, and the request is a resource's rather than a call of
     `/.rpc` or `/.mcp`; `send` writes them as the body.
   - A reply to a safe request is tagged with a hash of the bytes it writes, which is what
     `if-none-match` is answered against, and `last-modified` goes with the timestamps it was built
     from.

3. **Records.** `record.js` `from` sets `id` on the object the driver decoded and deletes `_id` from
   it.

4. **The abort of a request.** `HTTP/Server.ts` `track()` aborts a request's controller on `close`
   only when the reply is unfinished; a finished reply has nothing left to cancel, and its abort built
   a `DOMException` for every request.

5. **The import of jose.** `identity.tokens` holds the promise of importing `jose`, made once, and
   returns it on every call.

6. **`TOA_ENV`.** An operation reads `TOA_ENV` when it is created and holds it.

7. **The call identity.** `entities/newid.ts` `derive` holds its namespace as bytes and hashes the
   name with `node:crypto` directly, into the name-based UUID v5 bytes the `uuid` package produces.

8. **Tokens.** `identity.tokens` opens a `dir` + `A256GCM` token with `node:crypto`, in place of
   `decodeProtectedHeader` and `jwtDecrypt`: the compact serialization split into its five parts with
   an empty encrypted key; the protected header checked for `alg`, `enc`, `typ` and `kid`, with a
   `crit` or `zip` refused as jose refuses them; a 96-bit IV and a 128-bit tag; the ciphertext opened
   with AES-256-GCM with the protected header as additional authenticated data; and the claims checked
   as `decrypt.ts` and `jwtDecrypt` check them, `nbf` included. Issuing stays with jose, since a token
   is issued once a `refresh`. PASETO keys are read as they are.

## Decisions

- **Nagle is switched off in the client.** A request and a reply are each written once and are a few
  hundred bytes long, which is exactly what the algorithm holds back and nothing it helps with. The
  hand-written baseline has the same 10 ms floor with amqplib's default and loses it with `noDelay`,
  so the option is the whole cause.
- **The token format stays.** A token opened with `node:crypto` costs 10.9 µs, and jose costs 40; an
  HMAC-signed token would cost 8.9. A new format would save 2 µs and cost a format.
- **A reply is restricted where the operation answered.** The component holds the reply as objects
  the moment the operation returns it, and restricting there leaves the gateway nothing of the reply
  to read. `io:output` becomes what a route's requests ask for.
- **The restriction applies to what the operation answers.** `query.projection` is what a storage
  reads, and `output` is what a caller receives of an operation's reply. An operation may rename,
  compute or replace what it read, so a property of the same name can carry another meaning, and a
  route states each of them on its own even where their names coincide.
- **Only an observation reads a projection.** A transition writes back the whole record it read, an
  assignment's event carries the record it changed, and an effect reads for what it does next; a
  projected read would erase what it left out or cut an event short. The refusal holds for an
  authentic request too, since that is the request that skips the contract.
- **An empty output is no output.** A method that declares no `io:output` gives its clients nothing of
  the reply, and a reply with nothing in it is answered as any absent body is.
- **A property a directive reads is listed in `io:output`.** `io:output` alone decides what a request
  asks for. `io:status` and `auth:incept` read the reply the component restricted, and a reply without
  their property is answered as it is today.
- **Bytes are asked for in the request.** A caller says what it can read and whoever answers encodes
  once; comq carries a Buffer as an octet-stream already, so nothing of the transport changes.
- **A reply is validated by its body.** A tag over the bytes validates every reply, where a tag out
  of `VERSION` validated only a reply carrying one — and reading a version is what a body travelling
  unread rules out. `if-match` keeps carrying the `VERSION` a client read, since a stale write is
  refused by the version rather than by the representation.
- **A reply is forwarded only where nothing changes its body.** `io:status` removes a property,
  `auth:incept` reads one, a format other than JSON encodes the object, and `/.rpc` and `/.mcp` wrap
  the reply in an envelope; a cache revalidation drops the body and needs nothing of it.
- **A gateway ahead of its components answers whole outputs.** A component deployed before the change
  ignores `output` until it is deployed again. Guarding that window would keep the gateway reading
  every reply for the time a deployment takes.
- **A record is renamed in place.** The driver decodes every document into an object of its own, and
  an entity copies a state before an operation that writes changes it, so `from` sets `id` on the
  decoded object and deletes `_id`: 0.26 µs a record, against 2.68 µs for a rest spread and 1.04 µs for
  a copy by a loop over its keys. The renamed record encodes 0.43 µs slower, as the loop's copy does.
- **A record holds `_id` alone.** Writing `id` beside it would spare the rename at the price of 40
  bytes a record, a migration of every collection and a release between writing and reading, for the
  0.26 µs the rename costs.
- **The traceparent keeps its expression.** Read by position, a header costs 0.106 µs against the
  expression's 0.164 µs: 0.06 µs a message, below what the benchmarks resolve.
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

**Projection and output.** A route's `projection` is accepted by the definitions and dropped by
`Query.fit`, so no route reads less than the whole entity. A component builds the contract it checks
a request against from the operation's input alone, which refuses a projection on every type, and
skips that contract for an authentic request, which lets a projection through to a transition's read.
`io:output` restricts the reply in the gateway, after the directives that read it: `io:status` and
`auth:incept` read properties it leaves out, and a method that declares no `io:output` answers 200
with an empty body.

**Records.** A record holds its identity as `_id` alone, and `from` builds every entity it reads anew
to rename it to `id`.

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
| `record.js` `from` of a record the driver decoded, rest spread | 2.68 |
| the same, a copy by a loop over its keys | 1.04 |
| the same, renamed in place | 0.26 |
| `JSON.stringify` of 1000 entities built by the rest spread | 1,206 |
| `JSON.stringify` of 1000 entities built by the loop | 1,620 |
| `JSON.stringify` of 1000 records renamed in place | 1,635 |
| `derive` through `uuid.v5` | 3.07 |
| `derive` with `node:crypto` and a parsed namespace | 1.42 |
| a traceparent matched by the expression | 0.164 |
| a traceparent read by position | 0.106 |

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

0. **The sockets.** The dependency on comq 0.20.1.
1. **Work on every request**: records, the abort, the import of jose, `TOA_ENV` and the call identity,
   each a change of its own.
2. **Tokens.**
3. **Projection.**
4. **Restriction in the component**, with `io:output` putting its list on the call.
5. **Bytes**: the mark on the request, the bindings, and the write and the tag in the gateway.

## Verification

- **Latency.** Each scenario at rising fixed rates from 100 requests per second to saturation, with
  p50, p99 and the CPU of each process at every rate, before and after stage 0. A comparison at half of
  saturation hides a delay that only light load shows. The p50 of `small` and `observe` at 100
  requests per second is under 1 ms, and `observe` saturates at twice its rate or more.
- **Cost.** With `npm run bench` against the revision before each change of stages 1 to 5: the process
  a change touches comes out faster or inconclusive, and no process comes out slower. Stage 1 as a
  whole comes out faster in the gateway on `small` and in the component on `list.1000`; stage 2 in the
  gateway on `token.id`; and stage 5 in the gateway on `list.1000`.
- **Answers.** The exposition suite passes in HTTP/1.1 and in h2c, with the scenarios Compatibility
  names changed as it states.
- **Projection.** An observation's algorithm receives what its route projects and nothing else; a
  transition, an assignment and an effect called with a projection, authentic or not, answer the
  exception and leave the entity as it was; a route that projects a transition fails to boot.
- **Restriction.** A list restricts an object and each object of an array in their own order; a
  method's own list under an inherited `true` restricts to that list, and two lists to what they have
  in common; a method without `io:output` answers 204 to `GET`, 201 to `POST` and 404 where nothing is
  found; a string under a list is answered as it is; `identity.grants` answers its errors with their
  status; a call
  between components without `output` receives the whole output; `/.rpc` and `/.mcp` restrict each
  call.
- **Forwarded replies.** A JSON route answers the bytes it answered before stage 5, in HTTP/1.1 and in
  h2c; YAML and MessagePack answer the same values; a caller that asks for no bytes receives the reply
  as values; a conditional request is answered 304 by the tag its reply carries, against the broker.
- **Tokens.** A token jose issued opens with the new code, and one with a changed tag, IV, header or
  ciphertext, another `kid`, another issuer, a passed expiry or a future `nbf` is refused as jose
  refuses it.
- **Identities.** `derive` answers the bytes the `uuid` package answers for the same parts.
- **Records.** An entity read from a record holds the record's properties with `id` for `_id`, through
  every read: one, many, a stream, a sample and a projection.

## Compatibility

**On the wire.** `output`, and the mark that a caller reads an encoded output, are added to a request.
A component from before the change reads neither and answers the whole output as values; a gateway
from before it sends neither.

**In types.** `Request.output`, `Request.encoded`, and the value holding an encoded output.

**In behaviour.**

| before | after |
| --- | --- |
| a method without `io:output`, or with `false`, answers 200 with an empty body | 204, 201 to `POST`, 404 where nothing is found |
| a string or a number under an `io:output` list is omitted with a warning | answered as it is |
| an array holding a value other than an object under a list answers 500 | its objects are restricted and the rest answered as it is |
| `io:status` and `auth:incept` read a property `io:output` leaves out | they read what `io:output` lists |
| a projection reaches a transition's read through an authentic request | refused |
| `etag` is the entity's `VERSION`, on a reply that carries one | a hash of the body, on every reply to a safe request |
| `last-modified` carries `UPDATED` or `CREATED` | gone |
| an entity's properties come with `id` first | with `id` last |

## References

- J. Nagle, [RFC 896](https://www.rfc-editor.org/rfc/rfc896), *Congestion Control in IP/TCP
  Internetworks* — the algorithm `noDelay` switches off.
- [RFC 7516](https://www.rfc-editor.org/rfc/rfc7516), JSON Web Encryption — the compact serialization
  opened by hand.
- [RFC 9562](https://www.rfc-editor.org/rfc/rfc9562), UUIDs — the name-based version 5 `derive`
  produces.

# Readonly chains

## Design concept

A request may state that it only reads. The statement is carried down every call made under it, and
a call to an operation that may change state, made under one, is refused before it is sent. The
exposition gateway states it for the HTTP methods that are safe by definition, so what a `GET`
reaches is the whole of what a `GET` does.

### Guarantees

**What is refused**

1. A call to a `transition`, an `assignment`, an `effect` or an `unmanaged` operation, made under a
   readonly request, is refused. The refusal is on the caller's side and before anything is sent:
   nothing is read, nothing is committed, nothing is published, and no message is queued.
2. The refusal is a `Safety` exception, and it is permanent. Where nobody is waiting, the message it
   came with is set aside on its first delivery rather than tried again into the same refusal.
3. A call to an `observation` or a `computation` is made as it would be otherwise.

**What carries it**

4. Every call an operation makes while serving a readonly request is readonly — `context.local`,
   `context.remote`, and the write `context.delay` makes to hand a call over.
5. It is set and never cleared. A call made with `readonly: false` under a readonly request is
   readonly.
6. An operation neither declares it nor reads it, and the types `toa types` writes do not carry it.

**Over HTTP**

7. `GET` and `HEAD` are readonly. `POST`, `PUT`, `PATCH`, `DELETE`, `LOCK` and `UNLOCK` are not, and
   neither is a procedure an RPC or an MCP call names for one of those verbs.
8. A method states `io:readonly` to say otherwise, and a node states it for every method under it.
9. A refused call is answered `500`: the caller asked for what the route offered, and the route is
   what is wrong.

**What is not promised**

10. It is not a security boundary. It refuses a chain wired to change state where it was meant to
    read. A peer that sends whatever it likes is not held by it, any more than by `source` or by the
    call chain.
11. An aspect is outside it. A lock taken through `context.atom`, a request made through `fetch`,
    and whatever an `unmanaged` operation reaches through the driver are not calls to an operation.
12. What the gateway does around a call is outside it: the credential it reads before a route is
    known, the one it re-issues on the way out, and the components a directive calls on its own
    behalf.

### What a component author does differently

Nothing, and that is the point: the flag is the framework's and is never written by an algorithm.
What changes is that a chain which was meant to read is refused where it would have written, and the
refusal names the call that was about to be made.

Where a route is genuinely a safe method over an unsafe operation — a `GET` that opens a stream —
the route says so:

```yaml
# component.toa.yaml
exposition:
  /:key:
    GET:
      endpoint: create
      io:readonly: false
```

## The changes, by area

1. **The request.** `readonly` joins `core.Request`, beside `trail` and `authentic`: framework
   stamped, carried on the wire as a boolean, listed in the envelope schema and required by nothing.
2. **The classification.** `core/source/safety.ts` holds what each operation type is, as an
   exhaustive record over the type union — a type added later does not compile until it says which
   it is. `transition`, `assignment`, `effect` and `unmanaged` change state; `observation` and
   `computation` do not.
3. **The chain.** `trail.Invocation` carries `readonly`, put in scope by `Component.invoke` where an
   inbound request says so, and read by `Call.invoke` onto the request it is about to send. One more
   field on the one object that already carries the chain down a call tree.
4. **The refusal.** `Call.#refuse` raises where the request is readonly and the endpoint it calls is
   not safe. A `Call` is built from the endpoint's own definition, so it knows the type without
   asking anyone; `boot.call` hands it the answer, as it already hands it `stateful`. An endpoint
   whose name begins with `.` is exempt there: it is the runtime's own — a lookup, an exposition —
   rather than an operation, which is why the call chain counts it as no hop either.
5. **The exception.** `Safety`, a code of its own, classified permanent. Over HTTP it is answered
   `500`, which is what the gateway answers a code it does not map.
6. **The gateway.** `EndpointsFactory` reads the verb once, when the endpoint is built, and the
   endpoint puts the flag on the request it makes. `io:readonly` is a directive of the `io` family
   and writes what it declares onto the request's context, which is where `io:output` and
   `map:instance` already leave theirs. Nothing in the routing tree learns the flag: it has the verb,
   which is what a tree is about.
7. **The tool hints.** The MCP `readOnlyHint` follows what the route declares rather than the bare
   verb, so a method that opted out does not advertise itself as read-only.
8. **Two shipped reads that were typed as writes.** `identity.basic.info` answers what of a record
   may be shown and writes nothing, so it is a computation; it is two hops under
   `GET /identity/credentials/:id/`. `realtime.streams` serves `GET` with an effect that opens a
   stream, which is not a read, so that route declares `io:readonly: false`.
9. **Cadence says so, and changes nothing.** Handing a call over stores a row, so `context.delay`
   raises from a chain that may only read — `cadence.metronome.delay` is a transition reached through
   a `Call` like any other, and the one rule covers it. The readme says it where a reader is choosing
   what to call, and a comment says it at the line that raises, because the `Local` it calls through
   gives no hint that a coded exception comes out of it.
10. **Documentation.** `documentation/readonly.md`, the `Unmanaged` row in the safety table of
    `documentation/design.md`, the `io:readonly` section of the exposition's `io.md`, the verb table
    in its `tree.md`, the cadence readme, and the realtime readme.

## Decisions

1. **Refused by the caller.** A `Call` already holds the definition of what it calls — it builds the
   request contract from it, and reads `stateful` off it to refuse a call that names no process. So
   the caller can answer this without a round trip, the exception is thrown at the line that made
   the call, and the callee counts no failure for a call it never received. Refusing in
   `Operation.invoke` instead would spend a request to learn what the caller already knew.
2. **One place, because every call is a `Call`.** `context.local` reaches a component that `boot`
   built as a `Remote`, like a remote one, so a single rule in `Call` covers a local call, a remote
   call, a task, and the write `context.delay` makes. Nothing needs a case of its own.
3. **Carried ambiently.** The chain is already an `AsyncLocalStorage` of what the running invocation
   came by, for the reason its own header gives: an algorithm's `context` is built once per operation
   and shared by every invocation of it, so nothing per-invocation can be handed to it. The flag has
   the same lifetime and the same readers, and joins it rather than growing a second store.
4. **Set, never cleared.** `readonly` is the disjunction of what the caller asked for and what the
   invocation carries. An operation that could clear it would make the guarantee a convention, and
   the guarantee is what the flag is for.
5. **`unmanaged` may change state.** Its scope is the driver's own handle, and what it does with one is
   beyond anything the runtime sees. `design.md` asks an unmanaged operation to read and never write;
   an operation the runtime cannot hold to that is one it refuses to vouch for.
6. **`effect` may change state.** It is the type for an operation that reaches outside, and the table in
   `design.md` has called it unsafe since it was written. An effect that only reads — a stream taken
   out of object storage — is a route's to declare, because the route is where it is known that the
   reach is a read.
7. **The verb is translated where the endpoint is built.** `readonly` is a fact about a runtime call,
   and the routing tree is an HTTP concern that knows a verb, an `endpoint`, and directives whose
   implementations it was handed. The translation belongs on the other side of that line, with the
   factory that turns a method's `endpoint` into something to call.
8. **The opt-out is a directive.** Everything the tree carries besides a verb and an endpoint is a
   directive, and `io:readonly` is handed to the tree the same way `io:output` is. Declaring it as a
   property of the mapping would put a runtime concept into what the tree validates.
9. **The gateway's own calls are not in the chain.** A credential is read before any route is known —
   one request may carry several calls — and a directive that calls a component calls it on its own
   behalf. Each is a call of its own rather than one the route's call caused, so each is readonly or
   not on its own terms. This is what lets an OTP or a passkey credential, whose `authenticate` is an
   effect, authenticate a `GET`.
10. **Refused when the call is made, not when the manifest is read.** A safe verb over an unsafe
    operation could be refused where the exposition declaration is specified, which is where the
    operation is already read for `paged`. It is not, because `io:readonly` is inherited down a node's
    subtree and a route an application declares in its annotation is specified without the component's
    manifest at all: the check would hold for some of the ways a route is declared and quietly not for
    others. The refusal when the call is made holds for all of them.
11. **The discovery page does not draw it.** The page mirrors what a method says of itself and draws
    `once` and `mcp` as badges; `readonly` is answered and left undrawn. A route that declares the
    opt-out is doing the one thing the documentation asks it not to, and nothing is owed to make that
    easier to read. It is answered because the tool hint is built from it, and because `OPTIONS`
    saying less than the gateway knows would be its own kind of wrong.

## Context

`design.md` has classified operations as safe and unsafe since the design was written, and nothing
has ever read that classification. This makes it something a request can rely on.

It follows the shape of [call cycles](/documentation/cycles.md), which is the other property of a
chain that the runtime stamps, carries and refuses on, and it is carried by the same object.

## What happens today

A `GET` reaches whatever its route maps to. An observation two hops down a chain that began as a
read may call a transition, and nothing says so — not at deployment, not at the call, and not
afterwards. What a safe method does is whatever the routes and the algorithms happen to add up to.

## Stages

1. The request field, the classification, the chain, the refusal and the exception code.
2. The gateway: the verb translation, `io:readonly`, and the tool hints.
3. `realtime.streams` declares its opt-out, and `identity.basic.info` becomes the computation it is.
4. Documentation.

## Verification

1. `features/operations/safety.feature`:
   - _A readonly call reaches a safe operation_: an observation and a computation answer.
   - _A readonly call is refused_: a transition, an assignment, an effect and an unmanaged operation,
     each with the state unchanged afterwards.
   - _The chain carries it_: a computation that calls another component's transition, refused and
     naming the call it was about to make.
   - _A component cannot clear it_: the same chain, with the inner call made `readonly: false`.
   - _Without it the chain commits_: the same chain, unflagged.
   - _Arming a delay is refused_: from a readonly chain, naming a safe target, so what is refused is
     the write rather than the delayed call. Stated here rather than in
     `features/cadence/delay.feature`, whose `@timing` tag keeps its scenarios out of
     `npm run features`, and nothing here waits for a delay to fire.
2. `extensions/exposition/features/readonly.feature`:
   - _A safe method is refused an unsafe operation_: `GET` and `HEAD` answer `500`, and the same
     route answers another method.
   - _A method says otherwise_: `io:readonly: false`, and the same declared on a node above.
   - _The chain survives the gateway_: a `GET` to an observation that calls an assignment, and the
     same chain reached by a method that may write.
   - _A procedure named for a verb_: `.GET` over RPC, refused the same way.
   - _A method describes itself so_: `OPTIONS` carries what the route declared, which is what a tool
     is described by.
3. That a refusal is not retried is the permanence of the code, stated in `safety.test.js`: a row
   whose stored request may only read is dropped on its first dispatch rather than called again on
   every scan until it expires. A scenario for it would have to count dispatches, which is the
   dispatcher's business rather than a requirement.
4. The suites that must go on passing unchanged, each of which exercises a path this could have
   refused: `identity.otp` and `identity.passkeys`, whose `authenticate` is an effect reached by an
   authenticated `GET`; `credentials`, whose `GET` reaches `identity.basic.info` two hops down;
   `octets`, whose directives call on their own behalf; and `realtime`, after its opt-out.

## Compatibility

**On the wire.** A boolean on the request, absent unless a readonly chain put it there. A peer that
has never heard of it sends requests without it, which are requests that are not readonly; one that
receives it and is older ignores it, as it ignores anything else it does not read.

**In types.** `Request.readonly` is optional. Nothing generated carries it, so no component's types
change.

**In behaviour.** A `GET` or a `HEAD` stops being served, and answers `500`, where it reaches an
operation that may change state — whether the method maps to one or a chain under it reaches one — until
the route declares `io:readonly: false`. An application with such a route is what this breaks, and
the refusal names the endpoint it was about to call.

Across everything this repository ships it is one route, `realtime.streams`, which declares it, and
one operation typed as a write that only reads, `identity.basic.info`, which is now a computation. A
chain is not something a scan of manifests finds: `info` turned up because the suite ran the `GET`
that reaches it, which is the only way an application will find its own.

## References

- [RFC 9110 §9.2.1](https://www.rfc-editor.org/rfc/rfc9110#section-9.2.1), safe methods, which is
  what `GET` and `HEAD` are taken from.
- [MCP tool annotations](https://modelcontextprotocol.io/specification/server/tools), whose
  `readOnlyHint` is the same statement made to a tool's caller.

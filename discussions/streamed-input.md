# A call carries a stream

## Design concept

An operation may declare that one of its input properties carries a stream. A call to it puts a
`Readable` there, and the operation reads what the caller writes while it is being written: nothing
in between buffers the payload, stores it, or waits for its end.

A stream has no value form, so a call carrying one goes over HTTP rather than over the broker. Its
envelope travels as one header, its stream is the request body, and the caller dials the component
rather than a process — at the address the context states for it, so whichever replica the platform
picks takes the call, as whichever replica takes a message from a queue does today. Everything else
stays where it is: ordinary calls, tasks, events and addressed calls go on over AMQP, and the
binding declines a call that carries no stream.

What comes back rides the same response. A value is the envelope; a stream is the body — bytes as
they are, or values newline-delimited — and how it ended is in a trailer, so a stream cut short is
never read as one that finished.

At the gateway, `map:stream` hands a request body to the operation instead of reading it. An upload
reaches a component as it arrives, and a component that reads bytes once and keeps nothing no longer
has to have them stored first in order to be given them.

### Guarantees

**A streamed call**

1. An operation that declares a stream is called with a `Readable`, and reads what its caller writes
   while it is being written.
2. A reader slower than its writer holds the writer back, the whole length of the path: the
   operation, the socket, and the client the gateway is reading from.
3. Nothing in between holds the payload: it is not buffered whole and not written to a storage.
4. A stream arrives as it was written or it fails. A body cut short destroys the operation's stream
   with an error, and is never read as one that ended.
5. A streamed call is a call: it is contracted, traced, measured, logged and answered like any
   other, and its reply arrives when the operation answers.

**What comes back**

6. An operation answers a value or a stream, call by call.
7. A stream it answers reaches its caller as a `Readable` of what it yielded — bytes where it
   yielded Buffers, values otherwise.
8. A reply stream that fails after its first value fails its caller's stream: the exception travels
   in the trailer, and a body that stops without a trailer destroys it.

**Over HTTP**

9. A client is answered in the media type it asked for. The gateway resolves `accept` against what
   the route states it produces, once, before the call, and the operation is handed that one type.
10. A client asking for what the route cannot produce is refused `406`, before the operation runs.
11. A route that answers bytes answers bytes: an operation answering a value there is answered `422`.

**What is refused**

12. A call carrying a stream to an operation that declares none, and a call carrying none to one
    that does, are refused with *request contract* before anything is sent.
13. A streamed call is neither a task nor a delayed call. Both are taken later, by a process whose
    caller is no longer holding a stream.
14. A streamed call is not retried. A transport that replays a request replays nothing of its
    stream, so the binding sends it once and a failure is its caller's to answer for.
15. An operation that declares a stream declares a binding that carries one, or the component does
    not start.

**What is not promised**

- That a streamed call waits for a replica. A queue holds an ordinary call until something takes it;
  a caller holding a stream cannot wait in one, so a call to a component with no live replica fails
  where an ordinary call would have waited.
- That replicas take an even share of them. An endpoint is picked per connection, at random.
- That an operation which was ordinary goes on being called while the key is being added.
  Declaring a stream stops the queue that endpoint was served on being consumed, so every caller runs
  a runtime that knows the key before an operation declares one.
- That a component is reachable at more than one address. One component, one address: a component
  reachable at different addresses from different networks cannot be stated. An evicted component is
  named where it runs and works like any other, and two of them in separate networks go on calling
  each other over the broker — only their streamed calls fail.
- A reply that is a value and a stream at once. A reply is one or the other, as it is today.
- A media type of an operation's own. It is handed one and answers in it; where it cannot, its
  caller is answered `422`, and nothing of the operation's is written in a format the client did not
  ask for.
- Anything new for what a streamed reply meets at the gateway. What is settled before the first byte
  still is — the departure of a credential, CORS, the status, every header. What needs the whole body
  still is not: no `etag` and no `304`, no `content-length`, no `io:output` list, and `flow:compose`
  reads the stream into an array.

### What a component author does differently

Names the property that carries the stream, and a binding that can carry one:

```yaml
# manifest.toa.yaml
bindings: [amqp, http]

operations:
  transcode:
    type: effect
    stream: source
    input:
      type: object
      properties:
        id: { type: string }
      required: [id]
```

The property is the stream itself, or an object whose `stream` member is it — which is what a route
hands over, so that an operation behind one is told what arrived and what to answer with:

```typescript
export async function effect (input: TranscodeInput): Promise<Readable> {
  const { type, accept, stream } = input.source

  return transcode(stream, { from: type, to: accept })
}
```

A component calling another has neither to state, and passes the stream:

```typescript
await context.remote.media.files.checksum({ input: { id, content } })
```

A route maps a request body onto the property, and states what it takes and what it answers:

```yaml
# context.toa.yaml
/videos/:id:
  POST:
    map:segments:
      id: id
    map:stream:
      property: source
      accept: [video/quicktime, video/mp4]
      produces: [video/mp4, image/jpeg]
      limit: 4GiB
    endpoint: transcode
```

`map:stream: source` is the whole of it where the defaults will do.

## The changes, by area

### Toa

1. **Documentation, first.** `documentation/streams.md`, and the paragraph in
   `documentation/component/declaration.md` that points at it, as
   [stateful operations](/documentation/stateful.md) are pointed at. The `Over HTTP` table of
   `documentation/exceptions.md`, `documentation/ports.md`, and the port table a checkout binds in
   `CONTRIBUTING.md`.
2. **The declaration.** `stream` in the component schema, beside `once` and `stateful`: the name of
   an input property. Allowed for `effect`, `computation` and `unmanaged`, refused elsewhere. An
   operation that declares one and no binding that carries one is refused by name, where an event
   with a binding that is not asynchronous is refused today.
3. **The contract.** Where an operation declares a stream, its property is admitted by the request
   contract — required, and validated by nothing, a stream being no value with a schema. `stream`
   joins what a component's contract states, so a caller knows of it, and what an operation states
   of itself to whoever reads it.
4. **The call.** `Call.invoke` refuses a call whose stream and whose operation disagree, and refuses
   one that is a task or carries a delay, beside the refusals an addressed call already has.
5. **What a binding carries.** A binding's properties say whether it carries a stream, as they say
   whether it delivers asynchronously. An endpoint that takes one is offered only to the bindings
   that do — on the side that serves it and on the side that calls it — so AMQP declares no queue for
   it, consumes nothing for it, and is never fallen through to. The loop carries streams, by
   reference; AMQP says nothing and is skipped.
6. **The binding.** `@toa.io/bindings.http`, a package of `producer` and `consumer` and nothing else:
   its properties state that it carries streams and delivers nothing asynchronously, so nothing asks
   it to carry an event. Its consumer answers `false` for a call that carries no stream. Its producer
   serves the endpoints it is given that declare one, counted through the deliveries a halt reads.
7. **The address.** A context states an address per component, under `http`, read by a caller to dial
   and by a process to know the port it listens on. It is rendered into every workload as one
   variable, as a broker's URIs are, and defaults to the component's own `Service`, whose port the
   chart has rendered and nothing has listened on since the binding before this one was removed.
8. **The exception.** A component that cannot be reached is a transient exception of its own,
   answered `503` by the gateway.
9. **Types.** The stream property is written as `Readable | { type?, accept?, stream: Readable }` by
   `toa types`, which imports `Readable` for a stream scope already.

### Exposition

10. **`map:stream`.** The streaming sibling of `map:buffer`: it marks the request consumed and puts
   `{ type, accept, stream }` at the property the route names, instead of reading the body. It
   states `accept` — what a client may send — `produces`, and `limit`.
11. **Negotiation.** `produces` is what the request's `accept` is resolved against, before the call:
    one media type, or `406`. It is also what tells the gateway that this route may answer something
    its own formats do not cover, which is otherwise `406` before the operation runs.
12. **The reply.** A byte stream is answered under the resolved type rather than framed as parts,
    which is the branch a reply with a `content-type` already takes. A value answered by a route that
    produces media types is `422`.
13. **Refusals.** A route that maps a stream to an operation declaring none, and the reverse, are
    refused where a page and a projection are decided against the operation's manifest today.
    `map:stream` beside `map:buffer` on one method is refused: both take the request.

## Decisions

**What it is for is said in the documentation, not implied by its existence.** A streamed call
gives up the queue, the retry and an even share of replicas, and takes a connection of its own for
as long as it runs — priced for a payload that is large and long, and a bad trade for anything else.
So the documentation opens with what it costs and names the three things that already serve the
cases it does not: an ordinary call for an input that is a value, a reply stream for an answer that
arrives in pieces, and `octets:put` for a body that is to be kept. A capability whose costs are
written only where its mechanism is gets used for what it is not for.

**A binding says what it carries, and nothing knows about a binding.** A streamed endpoint is
routed by a property of the binding's module, the way an event is routed to one that delivers
asynchronously — so the AMQP binding needs no clause about streams, and a binding written later says
for itself whether it carries one. Naming AMQP anywhere in the runtime to exclude it would put
knowledge of a transport in the thing that chooses between transports.

**The stream is a property, not the input.** An input that is a stream and nothing else leaves a
call with no properties: no route parameter, no authority, no claim and no header could be mapped
into it, and what embeds a route's parameters into an input object would have nothing to embed into.
Naming a property keeps the input a schema and keeps every other mapping working beside the stream.

**A route hands over one thing.** `map:stream` fills `{ type, accept, stream }`, and an operation a
route calls reads that shape: what arrived, what to answer with, and the body. Naming three
properties in the route and three in the manifest says the same thing three times, and a component
calling another has neither of the first two to say — so where nothing is said about a stream, the
property is the stream. What the runtime reads is one line: the property is the stream, or its
`stream` member is.

**`accept` is resolved, not repeated.** A client's `accept` is a list with quality values; what an
operation can act on is one media type. The gateway resolves it against `produces` once, before the
call, and hands over the result — the same one the response will carry — which is why it is not a
header a route maps.

**The type of a byte stream answered is the type that was asked for.** An operation is handed one
media type and answers in it, so the response carries that one: not a guess about what came back,
but what the operation was told to produce. The alternative is a type carried back beside the
stream, which needs a reply that is a value and a stream at once — a change of its own, and the one
this leaves room for.

**The envelope is a header and the stream is the body.** `toa-request` carries what a call carries;
the body is the payload and nothing else. There is no framing to write, a capture reads as HTTP, and
a server routes, contracts and refuses before reading a byte. It bounds an input to the server's
header limit, which the binding raises to a stated size and refuses past: an envelope beside a stream
is metadata, and a megabyte of it is a different design. A length-prefixed envelope at the head of
the body has no bound, and costs a reader at each end.

**A component is dialled, not a process.** A streamed call wants a replica, not a name, which is what
a component's own `Service` already selects — the platform balances it and routes only to what is
ready. Announcing addresses over a channel would work anywhere, and is what this repository has just
moved away from: a lookup and its queues went when the map took over stating contracts.

**One address map, read from both ends.** A context states an address per component and nothing more.
A caller dials the address of the component it calls; a process listens on the port in the address of
the component it serves. One line says where a component is, and every process agrees. Folded by
environment like every other key of a context, so a development machine states its ports beside a
deployment's — and where several components share a process, it binds each port that process's
components name. A port setting of its own would be a second thing to keep in step with the first,
and would say nothing the address does not.

**A connection per streamed call.** An endpoint is picked once per connection and never revisited,
so a session shared between calls sends them all to the pod it landed on. A connection per call gives
each call its own pick. Calls in flight are unaffected, each having a connection of its own; what is
given up is reuse between calls, which is what did the pinning. It costs a handshake — one round
trip, cleartext, against a payload of megabytes — and a socket left in `TIME_WAIT`.

**HTTP/1.1.** Once a connection carries one call, what h2 offers it is spent: multiplexing is unused,
per-stream flow control is what the socket already does, cancelling is closing a connection that
carries nothing else, and trailers are in both. So the simpler of the two, with no session to open,
heal and close. A high rate of small streamed calls would reverse this, together with the balance it
is chosen for, and bring back a pool, h2c, and endpoints resolved by the caller.

**How a reply stream ends is a trailer.** HTTP says where a body ended — a terminating chunk, and a
body that stops without one is an error on the reader — so what is left to say is what the body is
and how it fared. What it is, is read off the stream: not an object mode is bytes, and an object mode
is settled by its first chunk, a Buffer being bytes and anything else values. The first chunk is
needed because every generator is an object mode stream, whatever it yields. How it fared is the
trailer, as a status is for gRPC: a stream is whole only where its trailer says so, and an operation
that failed after its first value sends the exception there. A chunk that disagrees with what the
first settled ends the stream the same way: such a stream has no media type to be served under.

**A truncated stream is a failure.** Which is the one thing a reply stream over the broker does not
say: a source that throws halfway is delivered as a stream that ended, silently short, because the
pipe that carries it swallows the failure and sends its terminator regardless. Nothing here inherits
that.

**A stream is not replayed.** A request that failed is re-sent by the broker's client; a streamed
call re-sent would carry an empty body. So the binding sends once, and a failed streamed call is
transient — repeated, where it is repeated, by whoever still holds the payload, which is a client
behind the gateway more often than not.

**Only the types that do not re-run.** A transition may re-run its algorithm against a stream it has
already read, and what an operation of the entity's own is given is its entity. So an effect, a
computation and an unmanaged operation, and nothing else.

## Context

Bytes reach a component today only as a reference to something stored. `octets:put` streams a request
body into a storage and a workflow calls a component afterwards with a location, which is the right
shape where what is stored is kept, and a round trip through a storage where it is not — a checksum,
a transcode, a parse, a forward.

It is that way because a stream cannot be serialized: the component that receives the request body
today is composed in the gateway's own process and is bound to nothing but the loop, and the property
it receives it in is declared as an empty schema. This makes that arrangement a declaration, and
gives it a transport.

Related: [stateful operations](/discussions/stateful.md), whose addressed calls stay on the broker;
[contracts](/discussions/contracts.md), which is where a caller learns what an operation takes.

## What happens today

A request body is read whole into memory, decoded, and handed to an operation as one value. A call's
envelope is a JSON value everywhere, a `Readable` in one is carried only by the loop, and the AMQP
binding would serialize it into nothing. A reply may be a stream, framed by the broker's client as a
sequence of messages; a reply stream that fails halfway arrives as one that ended.

## Stages

1. The declaration, the contract and the refusals, over the loop binding, which carries a `Readable`
   by reference. A streamed call works inside one process before any of it is carried.
2. The binding, the address and the chart's port: the same call between two processes, a value
   answered and a stream answered.
3. `map:stream` at the gateway, with its negotiation, its limit and its refusals.
4. Types, the readmes, the port tables.

They ship in one release. Nothing carries a stream until a component declares one, and no component
declares one before this.

## Verification

1. `features/operations/streams.feature`: — _An operation reads a stream from another process_: what
   a caller wrote is what the operation read, whole. — _The bytes flow rather than land_: the
   operation reads its first chunk before the caller has written its last. — _A slow reader holds its
   writer back_. — _A cut stream is an error_: a caller that destroys its stream makes the operation's
   read throw. — _A stream passed alone_: a component passes the property as the stream, and the
   operation reads it.
2. `features/bindings/http.feature`: — _A streamed call between processes_, dialled at the address
   the context states, each process listening on the port its own component's address names. — _A
   process that goes down mid-stream ends its call transiently_. — _A component with no live replica
   fails a streamed call_ rather than waiting. — _An ordinary call to the same component goes over
   AMQP_, answered while nothing listens on the port.
3. `features/operations/streams.reply.feature`: — _A stream answered_: values come back as values,
   Buffers and a byte stream as bytes, a string in an object mode stream as a string. — _A reply
   stream that fails after its third value fails its caller's stream_. — _A reply stream cut without
   its trailer is an error_.
4. `features/operations/streams.refusals.feature`: — _A streamed call as a task is refused_, — _a call
   with no stream to an operation that declares one is refused_, — _a manifest declaring a stream with
   no binding that carries one is refused_, each before anything is sent or started.
5. `extensions/exposition/features/stream.feature`: — _`POST` with a body reaches an operation as a
   stream_, read while the client is still sending. — _A body past `limit` answers `413`_, — _a media
   type outside `accept` answers `415`_, — _a client asking for what the route does not produce
   answers `406`_ before the operation runs. — _A client is answered in the type it asked for_, served
   as bytes rather than as parts. — _A request with no `accept` is answered `application/octet-stream`_.
   — _An operation answering a value where the route answers bytes answers `422`_. — _A route mapping a
   stream to an operation that declares none is refused_.

`npm run features` whole, `npm run test:unit`, `npm run typecheck` and `npm run lint`, and
`npm run bench` for what a call that carries no stream costs, which is to say nothing new.

## Compatibility

**On the wire, additive.** Nothing that travels today changes: an envelope with no stream is the
envelope it is now, and a call that carries one travels over a transport nothing used before.

**In types, additive.** `stream` is a new key of an operation and a new property of a component's
contract, and the request contract admits a property it did not.

**In behaviour, opt-in.** A component that declares no stream is unaffected — same bindings, same
queues, same replies. A process that serves no streamed operation opens no port.

## References

- [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), for proactive content negotiation and for
  trailer fields, which is where how a body fared is said once it is too late to say it in a status.
- [RFC 9112 §7.1](https://www.rfc-editor.org/rfc/rfc9112#section-7.1), the chunked coding whose
  terminating chunk is what tells a body that ended from one that was cut.
- [gRPC's `grpc-status`](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md), the
  precedent for an outcome stated in a trailer.
- [NDJSON](https://github.com/ndjson/ndjson-spec), for a stream of values in a body.
- [Kubernetes Services](https://kubernetes.io/docs/reference/networking/virtual-ips/), whose endpoint
  is picked per connection and never revisited — which is what a connection per call is for.

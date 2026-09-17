# Streamed input

An operation may take a stream. It names the input property that carries one, and is called with a
`Readable` there: it reads what its caller writes while the caller is writing it, and nothing in
between holds the payload — it is not buffered whole and not stored on the way.

**A streamed call that fails is not retried.** An ordinary call waits in a queue for a replica, is
redelivered when the one that took it fails, and may be sent as a task or delayed; none of that is
possible while its caller is holding a stream. What a failed one leads to is the caller's to decide,
and nothing beneath it will have tried again.

## What it costs

It is built for a payload that is large and long — a file a client is uploading, a transcode, a
render, an export — and it pays for that with everything an ordinary call is given:

- **A call takes a connection of its own**, opened when it is made and closed when it ends. A
  hundred calls in flight are a hundred sockets at each end, and calls made one after another share
  none of them: nothing is pooled, because a connection kept for a second call sends it to the same
  replica as the first, and so does every call after that.
- **Nothing queues it.** A call to a component with no replica running fails, where an ordinary
  call would have waited for one to come back.
- **Nothing retries it.** A redelivery would carry an empty body.
- **Nothing balances it.** Each call is routed on its own, at random, so a few calls in flight land
  where they land.

So call it with a stream only where something has to flow through an operation. Three things it is
not for:

- **An input that is a value** is an ordinary call, however large the value is.
- **An answer that arrives in pieces** is a reply stream — an operation returning a `Readable` — which
  any binding carries, over the broker included.
- **An upload that is to be kept** is [`octets:put`](/extensions/exposition/documentation/octets.md),
  which stores the body as it arrives and calls components afterwards with a reference to it. A
  streamed call is for bytes an operation reads and does not keep: a checksum, a transcode, a parse,
  a forward. Where they are to be stored *and* processed, store them and run the processing from the
  workflow.

Used for any of those, a streamed call costs a connection, gives up the queue and the retry, and
buys nothing.

## TL;DR

```yaml
# manifest.toa.yaml
bindings: [amqp, http]

operations:
  checksum:
    type: computation
    stream: content
```

```typescript
// the operation reads it
export async function computation (input: ChecksumInput): Promise<string> {
  return await digest(input.content)
}

// a caller writes it
await context.remote.media.files.checksum({ input: { content } })
```

## Declaring

`stream` names an input property. The rest of `input` is declared and validated as any other, so a
call carries what it carried before beside the stream; the named property is not validated, a stream
being no value with a schema, and a call that omits it is refused.

```yaml
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

It may be declared on an `effect`, a `computation` and an `unmanaged` operation. A transition may be
run twice over one call, and a stream cannot be read twice.

An operation that declares a stream declares a binding that carries one — `http`, beside whatever
else it declares — or the component does not start:

```
Operation 'transcode' takes a stream, which none of its bindings carries
```

An operation of a component composed in the same process needs none: a stream is passed as it is
where there is nothing between the two.

## Calling

The property holds the stream, or an object whose `stream` member holds it:

```typescript
await context.remote.media.videos.transcode({ input: { id, source } })

await context.remote.media.videos.transcode({
  input: { id, source: { type: 'video/quicktime', accept: 'video/mp4', stream } }
})
```

The second is what a [route](#over-http) hands over, so an operation behind one reads what arrived
and what to answer with. These are refused with `RequestContract` before anything is sent:

- a call to an operation that takes a stream and carries none, and the reverse;
- a task, or a delayed call, that carries one.

## What an operation answers

A value, or a stream — call by call, whichever the work came to. A stream it answers reaches its
caller as a `Readable` of what it yielded: bytes where it yielded Buffers, and values otherwise.

**A reply stream that fails is a failure.** Where the operation throws after its first value, the
exception is raised on the caller's stream; where the process serving it goes away mid-reply, the
caller's stream is destroyed. A reply stream that ends is one that was written to its end.

## Over HTTP

`map:stream` hands a request body to the operation instead of reading it, so an upload reaches a
component as it arrives:

```yaml
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

- `property` is the input property the operation named. `map:stream: source` is the whole directive
  where nothing else is stated.
- `accept` is what a client may send; anything else answers `415`. Absent, anything is accepted.
- `produces` is what this route may answer, each entry one answer in another encoding: what a client
  accepts chooses an encoding, not an operation, so a route that would answer two different things
  answers them at two paths. The client's `accept` is resolved against the list before the call and
  the operation is handed that one media type at `source.accept`; a client asking for something else
  answers `406`, and nothing runs. Where a client names several, the order it named them in decides;
  where it names none, the route's own order does.
- `limit` is the largest body this route takes; past it, `413`. The default is `64MiB`.

The operation answers in the type it was handed, and a byte stream it answers is served under that
type. **A route that states `produces` answers bytes**: a value answered there is `422`.

A route may not carry `map:stream` and `map:buffer` at once — each of them takes the request.

## Limits

- **A streamed call reaches a replica that is running, or fails.** A component that is scaled to zero
  or is between deployments fails the call where an ordinary call would have waited for it.
- **Replicas do not take an even share of streamed calls.** Each call is routed on its own, at
  random.
- **Declaring a stream on an operation that was ordinary** stops the queue it was served on being
  consumed, so every caller runs a runtime that knows the key before it is declared.
- **A component is reachable at one address.** One that runs in a network of its own is called over
  the broker as before, and a streamed call to it fails.
- **A reply is a value or a stream**, never a value with a stream in it.
- **What a streamed reply carries at the gateway** is what any streamed reply carries: no `etag` and
  no `304`, no `content-length`, and no `io:output` list applies to it.

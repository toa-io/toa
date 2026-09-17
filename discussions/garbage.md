# Garbage collection on the request path

## Design concept

The [benchmarks](./benchmarks.md) profile the gateway on `list.1000` as spending two thirds of its
CPU in the garbage collector, and three quarters over h2c. The heap is not what fills up: it stays
at 45 MB, under an old-generation limit of 117 MB. What starts the collections is the buffers a
reply passes through. V8 before 14.8 counts every byte allocated in a buffer since the last
mark-compact, dead or alive, and starts one for every few megabytes of them. A 436 KiB reply costs
the gateway about 1.7 MB of buffers — the socket's chunks, amqplib gathering them into frames and
the frames into a message — so a mark-compact of the whole 45 MB heap runs every ten requests or
so, while the buffers that started it are garbage by then.

V8 has a flag that counts what buffers hold rather than what was allocated in them, as part of the
same limit the heap is held to. It was added in 2024 behind a flag, turned on by default in V8 14.8
in March 2026, and removed as a flag in the same release: from 14.8 it is how V8 works. Node 24 runs
V8 13.6 and Node 26 V8 14.6, so a Toa process gets it only by asking. Every process the `toa`
program starts asks, and a process on V8 14.8 or later does not need to.

Elsewhere the collector is 5–8% of the gateway, and what it collects is the small objects a request
makes on its way through: the promises of stages that answer at once, the closures of a promise
chain, a `Headers` for a reply that gets none. Those that cost nothing to leave out are left out.

### Guarantees

**Collections**

1. A process the `toa` program starts on a V8 before 14.8 counts the memory buffers hold towards
   the limit that starts a mark-compact, rather than every byte allocated in them.
2. On V8 14.8 and later it sets nothing, which is what that V8 does by default.
3. A process allocating half-megabyte buffers it does not keep, beside a heap it does, runs no more
   than a quarter of the mark-compacts it would otherwise.

**Answers**

4. Every request is answered as it is today: the same status, headers, body and failures, under
   HTTP/1.1 and h2c *(today)*.

**What is left out**

5. A process that loads the runtime without the `toa` program — a suite booting a composition in
   its own process — keeps V8's default.
6. Buffers that are dead are released later than today, so a process holds more memory between
   collections: in a reproduction receiving 436 KiB messages at 47 per second beside a 45 MB heap,
   the peak RSS went from 232 to 291 MiB.
7. The copies amqplib makes while it gathers a frame stay as they are.

### What a component author does differently

Nothing. A deployment whose memory limit leaves no room above the peak it has today should look at
the memory metric (`toa.process.memory`) after upgrading.

## The changes, by area

1. **The program.** `runtime/cli/bin/toa` sets `--external-memory-accounted-in-global-limit` with
   `v8.setFlagsFromString` before it loads anything else, where `process.versions.v8` is below
   14.8. A flag on the command line would be refused by a Node that does not know it.
2. **Stages that answer at once.** `Interception`, a family's `precall`, `settle`, `preflight` and
   `depart`, and a response transform are awaited only where they return a promise. `cache`
   settles synchronously; `auth` answers `preflight` synchronously where no credential is
   presented, and waits in `settle` only for a directive that returned a promise.
3. **The server.** `Server.serve` answers in `try`/`catch`/`finally` rather than a chain of
   `then`, `catch` and `finally` over closures made for every request, and `Gateway` makes the
   router it hands `/.rpc` and `/.mcp` once.
4. **Headers.** `cache` makes a `Headers` only for a reply it sets one on.
5. **Routing and the query.** A route pushes its segments one by one rather than spreading them,
   and a URL without a query builds no `URLSearchParams`.

## Decisions

- **The flag, and not buffers pooled by hand.** The buffers are made by Node's sockets and by
  amqplib, not by the runtime, and a pool would reach into both. The flag is what V8 itself settled
  on.
- **Set in the program, below 14.8 only.** On a later V8 the flag is gone and the behaviour is the
  default, so the version check makes the line a no-op there instead of something to remember to
  remove.
- **Every process, not the gateway alone.** A component that answers a list makes the same buffers
  on the way out: `bench` spends a quarter of its CPU on `list.1000` in the collector.
- **The small objects only where leaving them out costs nothing to read.** A `.catch(rethrow)` on
  a stage makes a promise too, and replacing it with `try`/`catch` at each site would make
  `Gateway` harder to read for a promise per stage.
- **The core call is left as it is.** Measuring a call under the labels its endpoint's span holds,
  and sharing one options object between calls made without them, came out unchanged in every
  process of `small`, `chain` and `token.id`.
- **amqplib is not patched.** Gathering a frame without copying what is already gathered on every
  chunk removed 12–15% of the mark-compacts in a reproduction and was not visible in the gateway's
  profile. The change belongs in amqplib, whose `main` has the same code.

## Context

[Performance](./performance.md) removed the gateway's parsing and encoding of a reply; what is left
of `list.1000` in the gateway is the bytes passing through, and this is what they cost.

## What happens today

Profiled on `dev` at `551ae5ca3` with `npm run bench -- --profile`, on an AMD Ryzen 7 7800X3D,
Node 24.21 (V8 13.6), RabbitMQ 3.10 and MongoDB 8.0.16 from the compose stack:

| scenario | gateway µs per request | garbage collector |
| --- | ---: | ---: |
| `small` | 69 | 7.6% |
| `small.h2c` | 94 | 7.2% |
| `observe` | 101 | 5.3% |
| `list.1000` | 2,563 | 65.6% |
| `list.1000.h2c` | 3,778 | 76.2% |
| `create` | 164 | 7.8% |
| `chain` | 80 | 7.8% |
| `token.id` | 164 | 4.6% |
| `mcp.tools.list` | 108 | 6.3% |

On `list.1000`, `--trace-gc` shows a mark-compact of a 45 MB heap every 150–350 ms, each started
while the old generation was at 45 MB of a 117 MB limit. Allocation sampling of the same window
finds 45 MB allocated on the heap in all, none of it the reply, and the buffers counted from
JavaScript are amqplib's: 844 KiB per message gathering chunks into frames, 436 KiB gathering frames
into the message.

The gateway with the flag set on the command line, one boot per scenario, two runs each, in turns:

| scenario | without, µs | with, µs |
| --- | ---: | ---: |
| `small` | 69, 72 | 69, 72 |
| `list.1000` | 3,120, 2,929 | 1,506, 1,439 |
| `list.1000.h2c` | 3,735, 4,225 | 1,823, 1,397 |

## Stages

1. **The flag**, with its test.
2. **The small objects**, one commit per area.

## Verification

- `runtime/cli/test/heap.test.js`: the flag is set for V8 13.6, 14.6 and 14.7 and not for 14.8 and
  later; a child process allocating 1 GB in half-megabyte buffers beside a kept heap runs at least
  eight mark-compacts without the flag and no more than a quarter of them with it. It fails where
  the flag is not set.
- The feature suites pass, the exposition suite under HTTP/1.1 and h2c: every request is answered
  as it was.
- `npm run bench` against `dev`: no process slower in any scenario, the gateway faster on
  `list.1000` and `list.1000.h2c`, and the memory each process holds reported beside it.

## Compatibility

Nothing changes on the wire or in types. A process holds more memory between collections, as
guarantee 6 states.

## References

- V8 `513bb22991`, *[heap] Enable external_memory_accounted_in_global_limit by default*, relanded as
  `6a5039d9db`, and `cf511a65ad`, which removes the flag. Bug
  [361124432](https://issues.chromium.org/issues/361124432).

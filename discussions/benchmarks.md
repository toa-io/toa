# Benchmarks

## Design concept

A change to the runtime, a connector or the gateway can make a request slower, and today nothing
would say so. The question worth answering is narrow: is this revision slower than the one it
changes? A number measured on one machine answers nothing on another, and on the same machine it
drifts with the neighbours and the CPU's frequency, so the answer comes from measuring both
revisions on one machine, in one session, in turns.

Both revisions run side by side as an application is deployed: the gateway in a process of its own
with the identity components inside it, the application's components in processes of their own,
calls crossing RabbitMQ and entities kept in MongoDB. A scenario is an HTTP request. The two sides
take turns under the same load — A B B A, then B A A B — so whatever the machine does to one side in
a stretch of time it does to the other, and a slow drift in the background falls on both.

What a turn measures is taken apart by process. The CPU time a process spends per request depends
mostly on the code that process runs, so the gateway gets a number of its own and every component
gets one, and a change shows up in the process it was made in. Beside that, a turn counts the
messages published to the broker and the operations sent to the database per request. Those are
whole numbers that belong to the code alone, so a difference in them is a fact about the revision
and needs no statistics at all. Latency and memory are reported for reading.

The same tool profiles a revision: every process under every scenario, with the functions and
packages the time went to.

### Guarantees

**A comparison**

1. Each process in each scenario gets one verdict on its CPU time per request, from a 95% interval
   of the median ratio head/base: *slower* where the whole interval is above `1 + t`, *faster* where
   it is below `1 − t`, *unchanged* where it lies within `[1 − t, 1 + t]`, and *inconclusive*
   otherwise, with the interval's width. `t` is 5% unless stated.
2. The interval is recomputed to the same bounds from the same measurements.
3. A difference in broker messages or database operations per request larger than 0.05 is reported
   for every scenario it appears in.
4. A request answered with a status other than the one the scenario expects, a body of another
   shape, or a transport error fails the run and names the scenario.
5. A scenario the base revision cannot serve is reported as unsupported.

**What a run leaves behind**

6. The machine's shared services end a run as they started it, apart from the two broker vhosts and
   the two databases the run names, which `--clean` removes.
7. Nothing a run writes goes under `/tmp`.

**What is left out**

8. Absolute CPU time and latency describe the machine they were measured on and carry to no other.
9. Code that no scenario reaches is outside every verdict.
10. A verdict describes the machine it was reached on. A difference smaller than that machine's noise
    comes out *inconclusive*, and the noise is measured by comparing a revision with itself.

### What a contributor does differently

Nothing is required. A change that may cost time can be compared before review:

```shell
$ npm run bench                         # the working tree against its merge base with dev
$ npm run bench -- --base alpha --scenarios token.id,list.1000
$ npm run bench -- --profile            # profiles of the working tree
```

The report is a table per scenario and process, and the same data as JSON.

## The changes, by area

1. **The workspace.** `benchmarks/`, a private workspace at the root, because what it measures is
   the runtime, the connectors and the gateway together. Its sources are typechecked and unit
   tested with the rest of the repository.

2. **Revisions.** The working tree is used where it is. Any other revision is unpacked from
   `git archive` into a cache directory named after its commit and installed there, which leaves the
   repository's branches and worktrees as they were. A cached tree is reused, and the three most
   recent are kept.

3. **Processes.** Each side runs the gateway with `toa serve exposition` and each component with
   `toa compose`, from its own tree. A component is copied into the tree under test, so it loads that
   tree's runtime. The gateway is ready when it sends `ready` over IPC; a component is ready when its
   routes answer through the gateway.

4. **Isolation.** A side has a broker vhost of its own, because queue names carry no context, and a
   database of its own, named by `TOA_CONTEXT`. Both names are the same length, because the context
   is part of a reply header. A vhost is recreated at every block, so a reply left over from an
   earlier block has nowhere to land. Development defaults that would dominate a measurement are
   set explicitly: logs at `warn`, no trace exporter, and `TOA_ENV` left unset, since `local`
   validates every reply against its contract. Every readiness probe is moved off its default port,
   which is an application's. What a run binds is `31090`–`31099`: the two gateways, their probes,
   and the readiness of every composition.

5. **Load.** `oha` sends a fixed rate — half of the base side's saturation, found once per scenario —
   with latency correction, after a warm-up. Processes are pinned to separate physical cores where
   the machine has eight logical CPUs or more.

6. **Counting.** CPU time is read from `/proc/<pid>/stat` immediately around a window. Broker
   messages are the vhost's `publish` count from the management API, database operations the `top`
   counters summed over the side's database. Components publish and poll their outboxes on their own
   timers, so a quiet window at the start of every block measures that background and it is
   subtracted.

7. **Statistics.** A block boots both sides and runs every scenario in ABBA order, the next block in
   BAAB. Adjacent windows form pairs. The estimate is the median of the pairs' ratios, and its
   interval a percentile bootstrap that resamples whole blocks, seeded.

8. **Components.** `bench` keeps an entity of fifteen fields, seeded with a thousand records at every
   block, and exposes routes for a small reply, a read, a list, a creation, an identity, a role and a
   call to `peer`, among filler routes that bring the tree to the size of a real application's.
   `peer` has no storage; it answers `bench`'s call and receives its `created` event.

9. **Scenarios.** `small` and `small.h2c` — the path with no storage; `observe`; `list.1000` and
   `list.1000.h2c`; `create`, which writes and publishes an event; `chain`, one component calling
   another; `token.id`, `token.role` and `token.aged`, the last re-issuing its token on every request;
   `mcp.tools.list`. Tokens are minted by the runner with the gateway's key.

10. **Profiles.** `--profile` runs one revision, one boot per scenario, with an inspector open in
    every process on a port the system picks. The profiler starts and stops with the measured
    window, so boot, seeding and warm-up stay out of it. Each profile is written with a summary of
    self time by function and by package, garbage collection included.

11. **Documentation.** `benchmarks/readme.md` states the command, what it needs — Linux, the compose
    stack, `oha` — and how to read a report. `CONTRIBUTING.md` links it and lists the ports.

## Decisions

- **Two revisions in turns, on one machine.** A ratio measured this way carries to another machine,
  and a stored number describes only the machine it was taken on.
- **CPU time per process is what a verdict is given on.** Throughput and latency also measure the
  broker, the load generator and the neighbours. CPU time per request is the process's own, and
  taking it per process says where a change landed.
- **Counts of messages and database operations are exact.** They move only with the code, which
  makes them the one signal of a regression that needs no repetition to trust.
- **The whole request path.** Every operation pays the component side — the call, contract
  validation, the bridge, the storage connector, the outbox — and the identity components inside the
  gateway pay it too. A gateway measured against an empty component would miss half of the cost a
  request carries.
- **Separate processes, joined by the broker.** Calls inside one process take the in-process
  binding, and a deployment's calls cross the broker.
- **Both sides up for a block, restarted between blocks.** A boot's variance lands inside the
  pairing, and a boot per window would multiply the run's length.
- **Whole blocks in the bootstrap.** Pairs of one block share a boot; resampling them one by one
  would count them as independent evidence.
- **Local runs only.** On shared CI runners the noise is wide enough to hide the regressions worth
  catching.
- **No benchmarks of single functions.** They watch only what someone already suspects. One can
  accompany a specific optimisation.

## Context

The gateway is about to be optimised, and an optimisation needs a measurement before it and a way to
show that the rest held. This document is the first half: the instrument. Its first
measurements of `dev` — the noise of this machine, the absolute cost of each scenario per process,
and profiles — are what the optimisation is planned from.

## What happens today

Nothing measures performance. The gateway sets `server-timing: total` on every reply, and the runtime
exports spans; there are no metrics, benchmarks or recorded numbers.

What stands in the way of measuring it by hand:

- `TOA_DEV=1`, which points a process at the compose stack, also sets the log level to `trace` and
  turns on the console span exporter.
- `TOA_ENV=local` validates every reply against the operation's contract.
- Queue names are `namespace.component.endpoint`, so two revisions on one vhost share queues, and two
  gateways merge each other's routes.
- Every component with storage polls its outbox, and the gateway's identity components are eleven of
  them.
- A composition asks for readiness on `8001`, which an application on the same machine holds.

## Stages

1. **The tool.** The workspace, the components, the scenarios, the comparison, the report and the
   profiles, with this document and the readme.
2. **The measurements.** A comparison of `dev` with itself for the noise, a full run for the cost of
   each scenario, and profiles, gathered into findings that the optimisation is planned from.

## Verification

- A revision compared with itself comes out *unchanged* in every process and scenario, with identical
  counts.
- CPU work of a known cost added per request to the gateway comes out *slower* in the gateway, with an
  interval that contains the expected ratio, and *unchanged* in the components; the same work added
  to operation handling comes out the other way round.
- Work of 2% is never reported *slower*.
- One more database read in `create` shows as exactly one more operation per request in `create`, and
  in no other scenario.
- A route that answers `401`, a component killed within a window, and a port already bound each fail
  the run and name the scenario.
- The statistics, the validation of `oha`'s output, the subtraction of the background and the profile
  summary are unit tested.

## References

- [oha](https://github.com/hatoo/oha) — the load generator.
- Coordinated omission, as `oha`'s latency correction handles it.
- B. Efron, R. Tibshirani, *An Introduction to the Bootstrap* — the percentile interval, and resampling
  clusters where observations are correlated.

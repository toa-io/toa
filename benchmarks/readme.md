# Benchmarks

Compares the request path of two revisions on one machine: the gateway, the components behind it,
the broker and the database, as an application is deployed.

```shell
$ npm run bench                                   # the working tree against its merge base with origin/dev
$ npm run bench -- --base alpha --head HEAD       # two revisions
$ npm run bench -- --scenarios token.id,list.1000 --quick
$ npm run bench -- --profile                      # profiles of the working tree
$ npm run bench -- --clean                        # removes what runs leave in the stack
```

## Requirements

- Linux, for `/proc`, `/sys` and `taskset`.
- The compose stack of the repository, running: see
  [Running Features](../CONTRIBUTING.md#prerequisites).
- [`oha`](https://github.com/hatoo/oha) 1.16 or later on the `PATH`.
- Ports `31090`–`31099` free.

## Options

| option | default | |
| --- | --- | --- |
| `--base <ref>` | merge base of `HEAD` and `origin/dev` | the revision compared against |
| `--head <ref>` | the working tree | the revision compared |
| `--scenarios <ids>` | all but the optional | comma-separated |
| `--blocks <n>` | 4, or 3 with `--quick` | at least 2 |
| `--window <seconds>` | 10, or 5 with `--quick` | the length of a measured window |
| `--threshold <ratio>` | 0.05 | the change a verdict names |
| `--quick` | | shorter windows and fewer blocks |
| `--profile` | | profiles instead of a comparison |
| `--ref <ref>` | the working tree | the revision `--profile` runs |
| `--clean` | | removes the vhosts and databases of both sides |

A revision other than the working tree is unpacked and installed under `~/.cache/toa-bench/trees`,
once per commit; the three most recent are kept. `TOA_BENCH_CACHE` names another directory. The
working tree runs as it is built: a source newer than its build is reported, and the build is what
runs.

## What a run does

Each revision runs the gateway, with its identity components, and two components of its own —
`bench`, with an entity in MongoDB, and `peer`, which `bench` calls and which receives `bench`'s
events — each in a process of its own. The revisions get a broker vhost and a database each,
`toa-bench-a` and `toa-bench-b`.

A block boots both revisions and runs every scenario on each, in turns: base, head, head, base, and
head, base, base, head in the next block. Where the machine has eight logical CPUs or more, the
gateways, the components and `oha` are pinned to cores of their own.

A run of the default scenarios took 61 minutes on an 8-core machine; `--quick` has 3 blocks of
5-second windows.

## Scenarios

| id | request |
| --- | --- |
| `small` | `GET` of a reply computed without storage |
| `small.h2c` | the same over cleartext HTTP/2 |
| `observe` | `GET` of one item from MongoDB |
| `list.1000` | `GET` of a thousand items |
| `list.1000.h2c` | the same over cleartext HTTP/2 |
| `create` | `POST` of an item of fifteen fields, which emits an event `peer` receives |
| `chain` | `GET` of an operation that calls `peer` |
| `token.id` | `GET` under `auth:id`, with a `Token` |
| `token.role` | `GET` under `auth:role`, with a `Token` |
| `mcp.tools.list` | `tools/list` over MCP, on a tree of 22 tools |
| `list.1000.msgpack` | optional: `list.1000` encoded as MessagePack |
| `list.1000.projected` | optional: `list.1000` on a route whose query names three properties |
| `list.1000.restricted` | optional: `list.1000` on a route whose `io:output` names four properties |
| `token.reissue` | optional: `GET` under `auth:id` with a `Token` older than `refresh`, sent again after the reply re-issues it, so every request pays for a re-issue — the cost of one re-issue |

Tokens are issued by the run and the gateway is configured with a `refresh` of a day, so no token
ages during a run.

## The report

`benchmarks/results/<time>/` holds `report.md`, `report.json`, and every window in `windows.json`.

**CPU per request.** The microseconds of CPU each process spent per request beyond what it spends
at rest, the ratio head/base, and its 95% interval. Each block counts once: the fewer the blocks,
the wider the interval. The verdict is:

| verdict | the interval |
| --- | --- |
| **slower** | lies wholly above `1 + threshold` |
| **faster** | lies wholly below `1 − threshold` |
| unchanged | lies within `[1 − threshold, 1 + threshold]` |
| inconclusive | crosses a bound |

An interval is of the machine it was measured on, and so is a verdict. Comparing a revision with
itself shows how wide the intervals of a machine are.

**Messages and database operations per request.** Messages published to the side's vhost and
operations sent to its database, less what the side does while idle. A difference above 0.05 per
request is marked **changed**.

**Latency.** p50 and p99 at the fixed rate every window is sent at: half of what the base side
answers at saturation. `others busy` is the largest share of the measured cores taken by processes
of neither revision in any window; a share above 10% is marked ⚠.

**Unsupported.** A scenario the base revision answers otherwise than the head, where it requires
something the base may lack.

A run fails, and names the scenario, where a request is answered with another status, a reply has
another shape, a transport error occurs, or a process exits.

## Profiles

`--profile` boots the revision once per scenario, sends the same load, and records every process
for the measured window. `benchmarks/results/<time>/profiles/<scenario>/<process>.cpuprofile`
opens in Chrome DevTools; `profiles.md` lists, per process, the CPU per request, and the share of
self time by package and by function, garbage collection included.

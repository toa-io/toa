# What the map does not have to say

## Design concept

The component map states, of every component of a Context, what a caller is held to. A great deal
of what it states is not what a component declared: it is what the runtime gives every one of them.
The six system properties of an entity are the root prototype's, identical everywhere and
unoverridable; the binding of an operation is the component's own unless the operation names
another; an operation that declares no output normalises to one that declares `{}`; an operation
whose scope is `none` is one whose `query` is `false`, because that is what normalisation wrote
there. None of it is a declaration, and a document that repeats it says nothing more for it.

What the map leaves out, a process puts back when it reads one — in one place, where a contract
becomes calls. So what a caller is held to is unchanged, and the document is what a component said.

The deployed copy is read by a program and is capped by what stores it, so it is gzipped. The copy
`toa map` writes is read by whoever is debugging, so it stays plain and gains a newline between
components, which is what makes it greppable — and loses the indentation, which is what made it
twice the size for nobody.

### Guarantees

**What a contract states**

1. What a component declares is in the map: its entity's own properties and what of them it
   requires, its operations with what they take, answer and refuse with, and the binding of each
   event *(today)*.
2. What the runtime gives every component is not: an entity's system properties, an operation's
   binding where it is the component's, an output that describes nothing, and a `query` that
   follows from the scope.
3. A contract a process reads is the contract the component declared, whatever the map left out.
   What a caller is refused and what a route publishes are what they are today.
4. A component that declares its entity itself — one whose prototype is `null` — is written as it
   stands. What the map leaves out is what it can name, not what it can guess.

**What the two copies are**

5. `toa map` writes one component per line, so a component is found by `grep` and read by eye.
6. A deployment mounts the map gzipped. A process reads either, because what it reads is told by
   the file's first two bytes and not by its name.

**What is not promised**

7. That a map written by one release is read by another. It never was — a process is refused where
   the version the map states is not the version it composes — and the format is now a release's
   own as well.
8. That the document is small enough for any Context. The ConfigMap's megabyte is what caps it;
   the cuts take about a fifth of the document, and gzip takes about five sixths of what is left. A
   Context large enough to reach the cap reaches it later, not never.

### What a component author does differently

Nothing. `toa map` is run as it is today, and what a component declares is unchanged.

## The changes, by area

1. **`@toa.io/core`.** `contract.component` leaves out what the runtime gives, and states an
   operation's bindings once on the contract where every operation names the same ones. A new
   module holds the root prototype's entity declaration and the two functions that take it out of
   a contract and put it back.
2. **`@toa.io/boot`.** `remote` puts back what the contract left out, before it builds the calls —
   the one place every contract arrives at, whatever it came from. `map` reads a file that may be
   gzipped.
3. **`@toa.io/cli`.** `toa map` writes one component per line.
4. **Deployment.** The ConfigMap carries the map gzipped, under `.map.json.gz`, which is what the
   image's command names.
5. **Documentation.** The map's example in `documentation/contracts.md` and `runtime/cli/readme.md`,
   and what a deployed map is read with.

## Decisions

1. **Left out, rather than referenced.** A schema that states `$ref` is smaller still, and is a
   schema every reader has to resolve: the gateway takes properties out of an input to describe a
   route, and publishes what is left as an MCP tool's schema. What is left out here is what nothing
   reads as a declaration, and what is put back is put back once, before anything reads it.
2. **Put back where a contract becomes calls**, rather than where a map is read. A contract reaches
   a process three ways — the map, what a test states, and what a tenant announced — and `remote`
   is the one they all pass through. Putting it back there is one place instead of three, and it is
   the place that knows it needs a whole one.
3. **A flag on the entity**, rather than an inference from what is absent. A component whose
   prototype is `null` declares its own entity, and may declare four of the six system properties,
   or five, or the same names with other schemas. Absence cannot tell that from what was left out,
   so what was left out says so.
4. **`output` stays.** It is validated against nowhere — a reply is checked at the callee, against
   the callee's own manifest, and only on a local environment. But a route declared in
   `context.toa.yaml` has no tenant announcing it, so its contract is the map's, and its `output` is
   what `OPTIONS` answers and what an MCP tool states as `outputSchema`. What goes is the `{}` that
   normalisation writes, which describes nothing and which MCP already drops rather than publish.
5. **Gzip in the value, rather than in the chart.** Helm renders no gzip, so the deploy that reads
   the Context compresses what it found and the chart carries it as `binaryData`. Node's `gzipSync`
   writes a zero timestamp, so a deploy that changed nothing renders the same ConfigMap.
6. **Told by the bytes, not by the name.** A process reads a plain map where it runs locally and a
   gzipped one where it is deployed, and the same code reads both because it looks at the first two
   bytes. The deployed file is named `.map.json.gz` all the same: a gzip stream named `.json` is a
   thing someone opens once and reports as broken.

## Context

[The map states contracts](./contracts.md) put the contract into the map and retired the lookup.
This follows it: what that wrote turned out to be a fifth repetition, and the ConfigMap it is
mounted from is the only thing that caps it.

## What happens today

`toa map` writes the document at `indent: 2`. Every entity carries the prototype's six system
properties and names all six in `required`; every operation carries the bindings of the component it
belongs to; every operation that declares no output carries `"output":{}`; every operation whose
scope is `none` carries `"query":false`. The chart renders the same document compactly into a
ConfigMap's `data`, and a process reads it as UTF-8 and parses it.

On the benchmark's own map — two components, four operations — the document is 9715 bytes as the
CLI writes it and 4372 as the chart renders it. Of those 4372, 376 are the system properties, 370
the repeated bindings, 72 the empty outputs and about 40 the derivable `query`.

## Stages

1. The contract leaves out what the runtime gives, and `remote` puts it back.
2. `toa map` writes one component per line.
3. The deployed copy is gzipped, and a map is read by its first two bytes.
4. The documentation of what a map holds and what a deployed one is read with.

They ship in one release.

## Verification

1. `features/cli/map.feature`: the system properties and their `required` are not written; a
   component that declares its own entity keeps them; the bindings are stated once and per
   operation only where one differs; no empty output and no derivable `query` is written; the file
   states one component per line.
2. `features/runtime/contracts.feature`: a caller given a map that left them out is held to the same
   contract — an input missing a required property is refused, and a query is held to the entity's
   own `id`.
3. `features/deployment/map.feature`: the ConfigMap carries the map gzipped under `.map.json.gz`,
   what it decodes to is the contracts, and every workload mounts it where the image's command names
   it.
4. `runtime/core/test/contract`: what is left out and put back, the entity that keeps its own, the
   bindings hoisted and not hoisted, the empty output. `runtime/norm/test`: the prototype's entity
   declaration and the copy of it in `core` are the same, so one cannot drift from the other.
   `runtime/boot`: a map that is gzipped and one that is not are read the same.
5. `npm run features`, `npm run features:nightly`, `npm run test:unit`, `npm run typecheck`,
   `npm run lint`, and `npm run bench` for the verdict the pull request carries.

## Compatibility

**On the wire.** A tenant announces the contract this release makes, which a gateway of an earlier
release reads as an entity with no system properties and operations with no bindings. The release is
taken in one, as [contracts](./contracts.md) was.

**In types.** `Contract` gains `bindings`, and `Entity` gains the flag. Nothing a component declares
changes, and nothing generated does.

**In behaviour.** A map written by an earlier release is read by this one — what it left out is
nothing, and putting nothing back is what an absent flag means. A map written by this one is not
read by an earlier release.

## References

- [ConfigMap size](https://kubernetes.io/docs/concepts/configuration/configmap/#motivation), capped
  at 1 MiB by what stores it, and what `binaryData` is for.
- [RFC 1952](https://www.rfc-editor.org/rfc/rfc1952#page-6), the two bytes a gzip stream begins.

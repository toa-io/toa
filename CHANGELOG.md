# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.280](https://github.com/toa-io/toa/compare/v1.0.0-alpha.279...v1.0.0-alpha.280) (2026-09-03)

### Bug Fixes

* **deps:** update cookie in UI lockfiles ([d32106b](https://github.com/toa-io/toa/commit/d32106be40728156e82858f37b4d04163d1e1652))
* **operations:** call execa, not the module it lives in ([9fe87d5](https://github.com/toa-io/toa/commit/9fe87d54cc02f7ec18e325c85882ff174acbe8ab))


# [1.0.0-alpha.279](https://github.com/toa-io/toa/compare/v1.0.0-alpha.278...v1.0.0-alpha.279) (2026-09-03)

### Bug Fixes

* **userland:** let a TypeScript consumer find the declarations of `stage` ([c108cb5](https://github.com/toa-io/toa/commit/c108cb545d62204339b924f47f3863b8c40831d3))


# [1.0.0-alpha.278](https://github.com/toa-io/toa/compare/v1.0.0-alpha.277...v1.0.0-alpha.278) (2026-09-03)

### Bug Fixes

* **generic:** leave writing YAML to js-yaml's own schema ([650aa8f](https://github.com/toa-io/toa/commit/650aa8f0e9734ea236c575ee2e5675c31e8ad485))


# [1.0.0-alpha.277](https://github.com/toa-io/toa/compare/v1.0.0-alpha.276...v1.0.0-alpha.277) (2026-09-03)

### Bug Fixes

* drop the build output that landed beside the sources ([a724f69](https://github.com/toa-io/toa/commit/a724f6921190e5c9d945e33c6035bb12d832e5c8))
* read a manifest the way js-yaml read one before ([fcea1b2](https://github.com/toa-io/toa/commit/fcea1b21996d6efa6c3198acbfc9f70f1ce0c35c))
* read only the merge key back into the schema ([5172ee7](https://github.com/toa-io/toa/commit/5172ee702051fe29f5a6dd78f09f39f11706fd97))
* settle what the module loader made asynchronous ([d4ab9df](https://github.com/toa-io/toa/commit/d4ab9dfb09e382da311dba08f52214e7645f4a6c))
* what the loader resolves, and what it will not ([1b8a02f](https://github.com/toa-io/toa/commit/1b8a02ff0a5e0f18ee62e3f71bc81116f86f9af1))


# [1.0.0-alpha.276](https://github.com/toa-io/toa/compare/v1.0.0-alpha.275...v1.0.0-alpha.276) (2026-09-03)


### Bug Fixes

* **exposition:** give a component `host` over HTTP/2 ([7635142](https://github.com/toa-io/toa/commit/7635142fccdd3a755b76c6b2de670bfee6da2d19))
* **exposition:** move the readiness probe off the Telemetry port ([4be9385](https://github.com/toa-io/toa/commit/4be93850f7eec65ded03a0a3ba3090003e40cb5c))
* **operations:** let a deployment state that it has no probe ([477b483](https://github.com/toa-io/toa/commit/477b483560cf2464d486a78e432f8e9b47f011dd))


### Features

* **configuration:** log the epoch a value was resolved under ([ff51ff6](https://github.com/toa-io/toa/commit/ff51ff629592159eeac562059ceb944f193ad7e8))





# [1.0.0-alpha.275](https://github.com/toa-io/toa/compare/v1.0.0-alpha.274...v1.0.0-alpha.275) (2026-09-02)


### Bug Fixes

* **configuration:** ship the component's code and the built page ([6ffe988](https://github.com/toa-io/toa/commit/6ffe988a9e67025c114e74ba94665b28a2cafaa1))
* **introspection:** draw a band to the width of the map ([b70650b](https://github.com/toa-io/toa/commit/b70650b0c91ac49945e887b30d1953836814226b))
* **introspection:** keep a sideways scroll off the browser's back gesture ([419e012](https://github.com/toa-io/toa/commit/419e012ce093bcd0429dc93fe457bbd964cfc11c))


### Features

* **ui:** give both consoles a favicon ([27d3881](https://github.com/toa-io/toa/commit/27d3881eda10e59dc4c9c5ef38c2a58b71e1448d))
* **ui:** leave signing out to its icon ([a82fbab](https://github.com/toa-io/toa/commit/a82fbab513706436254348a5e35115dc3721873f))





# [1.0.0-alpha.274](https://github.com/toa-io/toa/compare/v1.0.0-alpha.273...v1.0.0-alpha.274) (2026-09-02)


* Configuration is served by a component, followed live, and kept per epoch (#1017) ([b05997d](https://github.com/toa-io/toa/commit/b05997d3adb784f238a222cb46878b23859339a2)), closes [#1017](https://github.com/toa-io/toa/issues/1017)


### Features

* **configuration:** drop the label from the epoch ([4baaff5](https://github.com/toa-io/toa/commit/4baaff5b22d00719142a65d56b50a1b100b29fbd))


### BREAKING CHANGES

* a secret configuration value is an object, not a string;
read it with `unwrap()`.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>

* test(configuration): wait for the second round rather than assume it

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>

* refactor(configuration)!: read a secret with its own unwrap

Component code depends on no Toa package, so a secret is read as
`context.configuration.apiKey.unwrap()` and the helper in `@toa.io/generic`
goes. A value a component reads as a secret is therefore given as a reference:
`identity.basic` no longer defaults `pepper` to `''`, the development context
and the feature harness give the token keys, the federation client secret and
the signing key as references, and the harness has a step for the secrets a
scenario refers to. CONTRIBUTING states the rule.
* `identity.basic` `pepper` has no default; a value read as a
secret must be given as a `$NAME` reference.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>

* feat(configuration): list the configurations

`configuration.values.list` returns every component's configuration for its
deployed epoch, by component name, and `GET /configuration/values/` serves it
behind `system:configuration:get`.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>

* fix(exposition): write a value in YAML the way its toJSON says

A redacted secret in a reply was dumped as an empty object; it is written as
`<REDACTED>`, as JSON and msgpack already write it.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>

* test(configuration): a secret is an object, and stays redacted in a reply

A component with `{ a: 1, b: $SECRET_B }` returns its configuration as
`{ a: 1, b: '<REDACTED>' }` and the secret itself through `unwrap()`. The reply
step also accepts a reply as a caller across a process boundary receives it,
since a call within the process hands the object over as it is.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>

* chore(schemas): bump the dependencies

ajv 8.18.0 to 8.20.0, ajv-formats 2.1.1 to 3.0.1, better-ajv-errors 1.2.0
to 2.0.3, fast-glob 3.2.12 to 3.3.3 and js-yaml 4.3.1 to 5.4.1 — the version
exposition already uses. The three majors keep the CommonJS entry points this
library calls: ajv-formats as a function, better-ajv-errors as .default, and
js-yaml's load.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(configuration)!: serve the schema with the value

GET /configuration/values/:component/ answers { configuration, schema, epoch }
where it answered with the configuration alone, and list carries the schema of
every component. Nothing reads a configuration without needing to know what it
is checked against, and the schema was only ever on the values service.

An epoch the deployment does not know has no schema; the value stored for it
is still returned.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(configuration): publish a configuration UI

The values service serves a page at /.configuration on port 8003, out of the
directory ui builds: the configured components, a screen per component showing
what it holds now, and a dialog creating the next one. Reading needs
system:configuration:get and creating needs system:configuration:create.

A configuration is immutable, so the dialog opens on the current value and what
is left out of it is left out of the component. The editor takes YAML, the
schema is applied before anything is sent, and a secret is a reference the page
never shows.

The page is always published: the annotation is the per-component values map
and has nowhere to carry a switch.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(introspection): link a component to its configuration

A card carrying @toa.io/extensions.configuration reads that extension as a link
to the configuration UI rather than as a name, and configuration joins the
namespaces the runtime provides, so its components band under System.

Deployed, both pages sit behind the same ingress and the path alone is right;
locally each console has its own port.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(introspection): scroll the map, zoom with a modifier

The map was grabbed to move and zoomed with a bare wheel, which is neither what
a page does nor what the wheel does anywhere else. A plain scroll now pans on
both axes and the wheel scales only with the modifier held — a trackpad pinch
arrives as one of those on every platform.

A card's own scrollable box keeps its wheel, in both paths.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* refactor(introspection): centre the filter in the header

The sides take equal space, which is what leaves the filter between them.
Neither side may shrink under what it holds, or the tabs run out from under
their side and across the filter, and the filter across the sign-out button;
the title gives way instead.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* fix(configuration): connect the UI to the values service

The page was declared as a dependency from inside `open`, and a connector connects
what it depends on before `open` runs — so the server was constructed and never
listened. Nothing caught it: the UI feature builds the server itself.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(configuration)!: reserve resources in the annotation

The values service deploys like any other and must state what it may take, but the
annotation is a map of component ids and had nowhere to put it — so `toa env` failed
for every context using configuration unless it declared a context-wide `resources`.

`resources` is now the service's own, read the way `introspection` and `realtime` read
theirs. A component actually named `resources` is written `default.resources`, which is
what its id is anyway.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(configuration): follow the system colour scheme

The dark tokens were behind a `.dark` class nothing sets, and the `dark:` variant was
pointed at that class too — so a component's own dark styling never applied either.
Both now key off `prefers-color-scheme`, and `color-scheme` hands the native chrome
the same answer.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(introspection): follow the system colour scheme

The dark tokens were behind a `.dark` class nothing sets, and the `dark:` variant was
pointed at that class too — so a component's own dark styling never applied either.
Both now key off `prefers-color-scheme`, and `color-scheme` hands the native chrome
the same answer.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(configuration): present a change as an edit of what is there

A configuration is immutable and creating one replaces the whole of it, but the dialog
opens on the current value and the page never shows an older one — so what the reader
does is edit. The words follow: Edit rather than New, Update rather than Create, and
the paragraph explaining the model goes, along with the field's label, which the title
above it already said.

The editor also stayed as wide as its longest line — `field-sizing: content` sizes to
content, and no `max-width` clamps that — so a long value painted outside the dialog.
It is fixed now, the dialog takes the width the screen has rather than a fixed step,
and the band held for errors no longer leaves a gap when there are none.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(configuration): mark a component that keeps a secret

A key after the name on the row, wherever the configuration holds a reference, however
deep. The predicate reads the same lines the value screen renders, so the two cannot
disagree about what counts as a secret.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(configuration): lead back to the list from the title

Every address ends in a slash, so the way up is the address itself on the list and one
level above it on a component's screen — which holds wherever the page is mounted.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>





# [1.0.0-alpha.273](https://github.com/toa-io/toa/compare/v1.0.0-alpha.272...v1.0.0-alpha.273) (2026-09-02)


### Bug Fixes

* **exposition:** green the feature suite ([67c25ad](https://github.com/toa-io/toa/commit/67c25ad627db3b3779b09405c5a3c319ecd47722))
* **exposition:** keep a departing tenant from taking a branch back ([64a4eaf](https://github.com/toa-io/toa/commit/64a4eafc9122fabba7b59bf7d559a9d4ef36f773))
* **exposition:** remove redundant inputs ([34763e4](https://github.com/toa-io/toa/commit/34763e417c93c4eecc5f96879a68c2b68bd6b8a8))
* **exposition:** report a refreshed branch at trace ([4f170ef](https://github.com/toa-io/toa/commit/4f170ef529a04755b22494789407305f11ce395e))
* **realtime:** green the feature suite ([6b4650b](https://github.com/toa-io/toa/commit/6b4650bad9e1d53dabd0b7775966694bdb05f236))


### Features

* **storages:** provider for DigitalOcean Spaces ([44ed14b](https://github.com/toa-io/toa/commit/44ed14b0bd796a35c9a7f9beef54ca4d5f8e8e07))





# [1.0.0-alpha.272](https://github.com/toa-io/toa/compare/v1.0.0-alpha.271...v1.0.0-alpha.272) (2026-09-01)


### Bug Fixes

* **amqp:** keep a receiver apart from the producers it delivers into ([4c2f43e](https://github.com/toa-io/toa/commit/4c2f43ebde68ba76a1fd277fe2a3305be1b622ef))
* **amqp:** tear a receiver down before its producers, and drop the split ([e6c1154](https://github.com/toa-io/toa/commit/e6c1154024df22f7a470c47c1a79bd170fe7e3b2))
* **atomicity:** honour a cluster, and let it be unreachable ([c475d66](https://github.com/toa-io/toa/commit/c475d663ddf7329d86da517ccceee4cb03280e95))
* **atomicity:** stop swallowing faults from the discovery loop ([449f79a](https://github.com/toa-io/toa/commit/449f79a011611f2e14ad5a325a9f7f7161433060))
* **connectors:** declare the packages they require ([a940808](https://github.com/toa-io/toa/commit/a940808744aa5e793205a0ea35eccb43b7534afa))
* **core:** stop the reply contract from relaxing the declaration ([6222893](https://github.com/toa-io/toa/commit/622289326630b94deff93499d6a851bfaa57c69a))
* **exposition:** close the query string, and tell it about sample ([ba82e61](https://github.com/toa-io/toa/commit/ba82e617f9d6e18b2c01ee68661407a781952443))
* **exposition:** stop a tenant announcing on its way out ([e1926fe](https://github.com/toa-io/toa/commit/e1926fe53186d9044c502e84f5894b6fbce88011))
* **exposition:** stop the throttling ticker before what it calls goes down ([f770740](https://github.com/toa-io/toa/commit/f770740a8359762b10cd456bc64e259415f7ef75))


* feat(atomicity)!: take a quorum of independent servers ([862562f](https://github.com/toa-io/toa/commit/862562f24d77ec00127dbbd88d43802b208c643b))
* refactor(atomicity)!: take one Redis, not a cluster ([b0a4770](https://github.com/toa-io/toa/commit/b0a4770dff5dfe8fee4b9ae637a4dd297454fcd4))
* refactor(atomicity)!: take the lock manager from the stash ([4fd91eb](https://github.com/toa-io/toa/commit/4fd91eb2fdb68f7b87aaf16d182794bbc567ba57))
* refactor(exposition)!: meter through the atom ([aa9c8f1](https://github.com/toa-io/toa/commit/aa9c8f16de3f4d315b14c49ff0b4f203053ede2c))
* refactor(core)!: pump the outbox in one cycle ([bf590fe](https://github.com/toa-io/toa/commit/bf590fe8ed59c701b5fd1a91ba4874685b79242f))
* refactor(atomicity)!: make the connector a family, not a partitioner ([06fd63a](https://github.com/toa-io/toa/commit/06fd63ad6296b724ef83afccf4e4e25d0bcaf080))
* refactor(atomicity)!: rename the connector and free it of the outbox ([21f1a41](https://github.com/toa-io/toa/commit/21f1a41aceafcfd35c7620014062fe46b54afa95))
* feat(core)!: commit events with the state that produced them ([1eb68cc](https://github.com/toa-io/toa/commit/1eb68cc435dbfa03faa16009fceb866693d22e1a)), closes [#20](https://github.com/toa-io/toa/issues/20)
* feat(openspan)!: make trace a log channel ([b107944](https://github.com/toa-io/toa/commit/b10794473ee442b28fa6b9b1c48ef9fc1d4471e5))


### Features

* **atomicity:** make the interval a setting, and stop repeating n-and-i ([5c3a6d1](https://github.com/toa-io/toa/commit/5c3a6d1533751a21b7eb7d9c737f1a270bf5a5ae))
* **atomicity:** meter what the group has spent ([bb1118a](https://github.com/toa-io/toa/commit/bb1118aa60bfeb43d3212f2495b7797445f003c3))
* **core:** give every component an atom aspect ([b501b9c](https://github.com/toa-io/toa/commit/b501b9cd3d5f5408d9faa71213e953fe2792cf9f))
* **partitions.redis:** split the outbox sweep across replicas ([ca27b45](https://github.com/toa-io/toa/commit/ca27b45fdaa508171b1851bbc14c60db67f3e4b3))


### BREAKING CHANGES

* `atomicity.redis` accepts a list again, of independent servers rather
than cluster nodes, and refuses an even number of them.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* `atomicity.redis` is a string. A list is refused at export.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* `context.stash.lock` is gone; lock through `context.atom` instead.
A stash pointer resolving to several addresses now uses the first.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* `context.stash.meter` is gone; meter through `context.atom` instead.
A deployment that declared a stash for `exposition.stash` can drop it, and needs
`atomicity.redis` set for throttling to reconcile.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* `Storage.outbox.pending` takes a fourth argument, the id to
continue from.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* `Factory.partition(group)` is `Factory.atom(group)`, and the
`Partition` it returned is an `Atom`. `slots(total)` is unchanged.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* `@toa.io/partitions.redis` is now `@toa.io/atomicity`, and its
`lanes(total)` is `slots(total)`. Redis is declared as `atomicity` in the context
rather than `outbox.redis`, and read from `TOA_ATOMICITY_REDIS`.
`TOA_OUTBOX_PARTITION_INTERVAL` is `TOA_ATOMICITY_INTERVAL`.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* `event.changeset` is removed; use `origin` and `state`. `State`
takes an `Outbox` in place of an `Emission`. `difference` is dropped from
`@toa.io/generic` along with its last caller.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* `Console.trace(span)` is gone. `trace` is a log channel taking
`(message, attributes)`, and a span is written with `Console.entry` instead.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>





# [1.0.0-alpha.271](https://github.com/toa-io/toa/compare/v1.0.0-alpha.270...v1.0.0-alpha.271) (2026-08-31)


### Bug Fixes

* **exposition:** ship the stash component's meter operation ([dee5ae4](https://github.com/toa-io/toa/commit/dee5ae43cd34581e10192c071d9dd673213a28c6))





# [1.0.0-alpha.270](https://github.com/toa-io/toa/compare/v1.0.0-alpha.269...v1.0.0-alpha.270) (2026-08-31)


### Bug Fixes

* **core:** apply the input default on a remote call ([341699b](https://github.com/toa-io/toa/commit/341699b26c9299963a898368671633a9b3fb97ed))
* **norm:** resolve annotations keyed by a dependency id ([e2860cd](https://github.com/toa-io/toa/commit/e2860cd2cc93dd3a135c092db1d943f80648ee56))
* **norm:** return the hash after hashing a file ([35058bd](https://github.com/toa-io/toa/commit/35058bdaae19f367197ea5b800742349e507ab11))
* **operations:** let a composition set its own base image ([61ba331](https://github.com/toa-io/toa/commit/61ba3319dc91915a3197d348111af411bbd5bff1))
* **storages.sql:** implement update and follow the current storage contract ([b7bd5e2](https://github.com/toa-io/toa/commit/b7bd5e2b8a0595d1977135d144bd00d523628772))
* **telemetry:** keep the ready probe from holding the process open ([1cb180b](https://github.com/toa-io/toa/commit/1cb180be2a0d13f61fc6d78ceecd18b339a94cf0))


* feat(exposition)!: throttle by a distributed GCRA ([287eb25](https://github.com/toa-io/toa/commit/287eb254b11339b20ef011deb659eb11f225defe))


### Performance Improvements

* **boot:** stop paying for what a composition does not need to start ([1619c27](https://github.com/toa-io/toa/commit/1619c2743072f4706939ce72f3074e615d26a91e))
* **core:** do not snapshot a record an operation cannot commit ([a5e695b](https://github.com/toa-io/toa/commit/a5e695b0b1d4b00a91e40336deecd476c9646c89))
* **core:** keep the parsed criteria of a query ([7efc694](https://github.com/toa-io/toa/commit/7efc694814c2a071ae7e48dbf1c6014db6025a9f))
* **exposition:** project io restrictions through a set ([d70b364](https://github.com/toa-io/toa/commit/d70b36478626dd29958a55ebf72f0373e07e34f5))
* **exposition:** stop recomputing per-request what a route fixes ([b52f335](https://github.com/toa-io/toa/commit/b52f335023e58db42a21f1ee6bd99470e8547a2c))
* **exposition:** tag a reply from the body already encoded ([e6ea7d7](https://github.com/toa-io/toa/commit/e6ea7d7b169783becddb2854ae6fb24caf611398))
* **openspan:** create a span only when something records it ([a6efb0e](https://github.com/toa-io/toa/commit/a6efb0eed38393f4c169b067f23d7447f0169bca))
* stop rebuilding per-call values that never change ([4202504](https://github.com/toa-io/toa/commit/4202504c33fb9ef9694f9995f3d0397d3a186438))
* **storages.mongodb:** time the call instead of monitoring the command ([135f1a9](https://github.com/toa-io/toa/commit/135f1a97c753b1caed9291f85cea0521ef68b0e3))


### BREAKING CHANGES

* `io:throttle` no longer takes `cooldown`, and its schema now
rejects unknown properties, so a declaration carrying one fails at boot instead of
being ignored quietly. Metering earns the budget back rather than locking a key
out, so the lockout is expressed as a rate: `requests: 20, interval: 600` admits a
burst of twenty and then one every thirty seconds, where `requests: 20, interval:
60, cooldown: 600` used to refuse everything for ten minutes. The stash aspect's
`count` is replaced by `meter`, which takes a batch of keys and debts and answers
what the group has reached.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>





# [1.0.0-alpha.269](https://github.com/toa-io/toa/compare/v1.0.0-alpha.268...v1.0.0-alpha.269) (2026-08-30)


### Bug Fixes

* **exposition:** check input restrictions before directives add to the body ([b37961a](https://github.com/toa-io/toa/commit/b37961aa43b8ea52fbbbfd8d447fd20a71fbbef6))





# [1.0.0-alpha.268](https://github.com/toa-io/toa/compare/v1.0.0-alpha.267...v1.0.0-alpha.268) (2026-08-30)


### Bug Fixes

* **agent:** do not append a content-length a request already declares ([17893e9](https://github.com/toa-io/toa/commit/17893e9bc8c64c744dac2ad7cf057267a0932afb))
* **exposition:** make the allowed CORS headers stable and per-gateway ([2ea3554](https://github.com/toa-io/toa/commit/2ea3554ad61bd4dc9246cebc30cad6cf553dcce5))
* **exposition:** report the entity length on HEAD ([bf20086](https://github.com/toa-io/toa/commit/bf2008672d5f192bdeffa5d7c1d46fef7e06ea7b))
* **exposition:** serialize the error a failed workflow step reports ([c11a3a6](https://github.com/toa-io/toa/commit/c11a3a6ecdf177227679bad590a886753cbdf2a5))
* **exposition:** type the throttle key declaration precisely ([ac7d486](https://github.com/toa-io/toa/commit/ac7d4865f689f1a77f65ed3262da47fd49b62e81))
* **introspection:** treat exposition as a system namespace ([0374f22](https://github.com/toa-io/toa/commit/0374f229a0c822763c3d92c6384a61d66269a8cc))


### Features

* **stash:** add distributed counting ([6d0af7e](https://github.com/toa-io/toa/commit/6d0af7e58a1deece00256129bc976bebc416ae90))





# [1.0.0-alpha.267](https://github.com/toa-io/toa/compare/v1.0.0-alpha.266...v1.0.0-alpha.267) (2026-08-29)


### Bug Fixes

* **bindings.amqp:** hold one communication per component, not per connector ([a89710b](https://github.com/toa-io/toa/commit/a89710b24f4e5c2a0257d3fe88261173f95e1c9f))





# [1.0.0-alpha.266](https://github.com/toa-io/toa/compare/v1.0.0-alpha.265...v1.0.0-alpha.266) (2026-08-29)


### Bug Fixes

* **bindings.amqp:** stop consuming before what it consumes for is gone ([b081ea1](https://github.com/toa-io/toa/commit/b081ea10d52e53cf3c8bdfb2d3b21e4a8a97fe83))
* **core:** say a connector is disconnected once it has closed, not before ([d67b48e](https://github.com/toa-io/toa/commit/d67b48eaafaacd5c635d8b066413f84b8e6a3771))





# [1.0.0-alpha.265](https://github.com/toa-io/toa/compare/v1.0.0-alpha.264...v1.0.0-alpha.265) (2026-08-29)


### Bug Fixes

* **telemetry:** signal readiness when the probe port is taken ([19722b8](https://github.com/toa-io/toa/commit/19722b8b2f3b9af969fc66c3c67e4d9cd87b952f))


### Features

* **bridges.node:** add the dispose run command phase ([00df715](https://github.com/toa-io/toa/commit/00df7158f638b976ab09d4007102a4ead3c696c3))





# [1.0.0-alpha.264](https://github.com/toa-io/toa/compare/v1.0.0-alpha.263...v1.0.0-alpha.264) (2026-08-29)


### Bug Fixes

* **introspection:** stop the counts row being cut short ([8123fd5](https://github.com/toa-io/toa/commit/8123fd5d53e290cc0f6c05d30371af63572be5e6))
* **openspan:** stop an unavailable OTLP endpoint delaying the shutdown ([e5f0d52](https://github.com/toa-io/toa/commit/e5f0d52805c150cd127f27d1cd39553da7c82aef))


### Performance Improvements

* **telemetry:** release the ready probe connections on shutdown ([5242f12](https://github.com/toa-io/toa/commit/5242f122cb0ccb01b16c48ef10f49cd0a603f15e))





# [1.0.0-alpha.263](https://github.com/toa-io/toa/compare/v1.0.0-alpha.262...v1.0.0-alpha.263) (2026-08-29)


### Bug Fixes

* **exposition:** cancel the discovery settle timeout ([0124c9f](https://github.com/toa-io/toa/commit/0124c9f8956722b967681ac7bd49a26556761e66))
* **introspection:** retain edges for seven days ([9b2c988](https://github.com/toa-io/toa/commit/9b2c988faddefad6a5b3a70d887f3e9a58d38b16))


### Features

* **introspection:** give a service its own mark ([a01d66f](https://github.com/toa-io/toa/commit/a01d66fb7068efa5db45cddfdf24658b0d6dd92d))
* **introspection:** limit topology update windows ([9b4cfab](https://github.com/toa-io/toa/commit/9b4cfab196f4b4b3e6f3af201c973df837cfa28a))
* **introspection:** name the counts by what they are ([7244ba8](https://github.com/toa-io/toa/commit/7244ba86a7f9c2dd42cd22847082e20da325bc77))


### Performance Improvements

* **exposition:** let the probe own the startup delay ([1cb8e04](https://github.com/toa-io/toa/commit/1cb8e0459981d0a47c68dce48e17fa1fceb79a61))
* **exposition:** settle discovery as soon as the branches go quiet ([d40bafd](https://github.com/toa-io/toa/commit/d40bafd5b6c71f34a2fcac201697823870460fa5))
* **schemas:** compile each schema once ([935031d](https://github.com/toa-io/toa/commit/935031d0b634583876c629dde4860af22cb570fc))





# [1.0.0-alpha.262](https://github.com/toa-io/toa/compare/v1.0.0-alpha.261...v1.0.0-alpha.262) (2026-08-28)


### Bug Fixes

* **amqp:** log reconnect attempts ([3903dc9](https://github.com/toa-io/toa/commit/3903dc9e31ba8365cd5aef20c09366a0cb7a56fe))
* **boot:** let the composition own the process discovery ([2201e88](https://github.com/toa-io/toa/commit/2201e8852517fd1d2822c775c9b126eb60399580))
* **cli:** boot toa mono from components and env, not context ([1518f72](https://github.com/toa-io/toa/commit/1518f729d7611ae88e0538f286231d283a7098ef))
* **cli:** say why a service has nothing to run ([458e86b](https://github.com/toa-io/toa/commit/458e86b347d5eff7fc69eb661e54d09509b93c39))
* **exposition:** serve endpoints declared in the context annotation ([49da8a4](https://github.com/toa-io/toa/commit/49da8a4234ee987b25023952d0622ce575dfb60c))
* **introspection:** keep the collector off the critical path ([965ec77](https://github.com/toa-io/toa/commit/965ec77482d361a5a9a88579152158c7e1c79e66))
* **introspection:** meet a card across the edge the line touches ([2002de9](https://github.com/toa-io/toa/commit/2002de9bdc12400abc64d5234fa319339db4588f))
* **introspection:** return the whole map over HTTP ([053c0cd](https://github.com/toa-io/toa/commit/053c0cd5c22b1a80bceb23d2cda68ede33a0d1c0))
* **introspection:** serve a route that looks like a file ([b43bbb4](https://github.com/toa-io/toa/commit/b43bbb4a290819463c61bcba64357385c2423d25))
* **introspection:** show the lines an opened neighbour sends ([5fe8aed](https://github.com/toa-io/toa/commit/5fe8aed64c1f1e54f1c10e29b91b50c5cdc296ab))
* **introspection:** wait for the page before capturing it ([9e63af3](https://github.com/toa-io/toa/commit/9e63af34ee090a4f90dce9658b0d022f4acae50f))
* **stage:** name the feature suite as the caller ([e4e593b](https://github.com/toa-io/toa/commit/e4e593b795cc7dc113f06e8a1554ae2ef36442c0))


* refactor(cli)!: remove the invoke command ([819b81e](https://github.com/toa-io/toa/commit/819b81e6af777502ea6942533c151b20ee885cc0))
* feat(introspection)!: publish the UI ([81fe2cb](https://github.com/toa-io/toa/commit/81fe2cb4bafe91e74d3af8359327e3102e5b0e8a))
* feat(operations)!: require service ports to be unique ([b22cf87](https://github.com/toa-io/toa/commit/b22cf8770d24c555b5f355a5f117a9043a57799b))


### Features

* **core:** identify the origin of a call with `request.source` ([9da6b66](https://github.com/toa-io/toa/commit/9da6b66df852690351a1e82c7b8cc176fd89774a))
* **introspection:** act on the only thing the filter left ([1a83709](https://github.com/toa-io/toa/commit/1a8370987b7d60c009f4d58f07005618899cdfd6))
* **introspection:** add the introspection extension ([a07ed86](https://github.com/toa-io/toa/commit/a07ed8651404258d544f3b6d8236e58cf4da09ac))
* **introspection:** animate a card opening on the map ([1d2180f](https://github.com/toa-io/toa/commit/1d2180f48fb9dc18d9fa0c2cc4eefa6f46626898))
* **introspection:** animate every collapsible from one place ([0b6a32b](https://github.com/toa-io/toa/commit/0b6a32b69128f2db2d3e449896614ff478f2775b))
* **introspection:** ask for the role rather than be refused it ([1ad01a7](https://github.com/toa-io/toa/commit/1ad01a7dd817ae37ed84e3a3b6b20b72049a4216))
* **introspection:** cache the map API ([f550c27](https://github.com/toa-io/toa/commit/f550c2780a80bbe2fdd131984c33d9848daa8c82))
* **introspection:** fold away a component's extensions ([de1bea6](https://github.com/toa-io/toa/commit/de1bea6329a1fd920cff6b5ad9a13eedfc527884))
* **introspection:** give a card's rows their own space ([3253639](https://github.com/toa-io/toa/commit/32536395b9d25e743c25b61deb9dbd5b79d966b6))
* **introspection:** give the map's two screens their own addresses ([90fd5af](https://github.com/toa-io/toa/commit/90fd5af39b8b6c38e22e05df46c70de533eb15c6))
* **introspection:** open a component on the map ([6382740](https://github.com/toa-io/toa/commit/63827403407fc5a305d95e9fde72ed5a99a1499a))
* **introspection:** open an operation onto what it takes ([f16a683](https://github.com/toa-io/toa/commit/f16a683175a89d3660c538768b24cd872b6d0b3d))
* **introspection:** publish the map as a page ([21b16b2](https://github.com/toa-io/toa/commit/21b16b2220a1b26796bdbedc85a0df2a88df31dd))
* **introspection:** say a component's shape in counts ([54aa771](https://github.com/toa-io/toa/commit/54aa771a51c257db759107d584d063916f0cd351))
* **introspection:** say how a silenced card comes back ([6e7674f](https://github.com/toa-io/toa/commit/6e7674f88137cfb780f3a7cac1fc67f191f96984))
* **introspection:** separate what the runtime provides ([289c7a3](https://github.com/toa-io/toa/commit/289c7a301dd0ab9c063a5b77b24745983ec79e29))
* **introspection:** show a schema as a shape ([7d9a595](https://github.com/toa-io/toa/commit/7d9a595d86f88846b21bb79aba82bb332b77fbf6))
* **introspection:** the map is the front page ([dbf1b5f](https://github.com/toa-io/toa/commit/dbf1b5fd6d262aa2aa952bbfe2a6be1e44af6302))
* **operations:** let a service claim a path prefix on the host ([02677d1](https://github.com/toa-io/toa/commit/02677d17fcd4222b07c3be458d93bcc496a016a8))


### Performance Improvements

* **introspection:** build a card's details when it shows them ([c10f7c4](https://github.com/toa-io/toa/commit/c10f7c42e51cbef2d3767c36559d846f0e34653a))


### BREAKING CHANGES

* use `toa compose` and `toa call` instead — the first runs the
components, the second calls one of them.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* the extension is predefined, so every Context now declares an
ingress and must say where it lands:

    ingress:
      hosts: [api.example.com]

An application that does not want the page says `introspection: { ui: false }`,
and one that wants no map at all says `introspection: false`. Failing the export
is deliberate: the alternative is quietly not publishing a page that was asked
for.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* an application whose own extension runs a service on a port
already taken by another — 8000 by the exposition gateway, 8001 by the telemetry
readiness probe — must move it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>





# [1.0.0-alpha.261](https://github.com/toa-io/toa/compare/v1.0.0-alpha.260...v1.0.0-alpha.261) (2026-08-26)


### Bug Fixes

* **operations:** include extension pointer variables in --mono ([f8be23d](https://github.com/toa-io/toa/commit/f8be23d2aaf7bbe1b0580101c8bf4d32c3cab99f))





# [1.0.0-alpha.260](https://github.com/toa-io/toa/compare/v1.0.0-alpha.259...v1.0.0-alpha.260) (2026-08-25)


### Bug Fixes

* **amqp:** log lost shards and failed reconnects ([19b7889](https://github.com/toa-io/toa/commit/19b7889076278885f64112824ed3088ddd0363d3))





# [1.0.0-alpha.259](https://github.com/toa-io/toa/compare/v1.0.0-alpha.258...v1.0.0-alpha.259) (2026-08-24)


### Features

* **runtime:** split component RC into preflight and settle ([0d648b3](https://github.com/toa-io/toa/commit/0d648b314e4aac226c254bf01a86affa04b59b34))





# [1.0.0-alpha.258](https://github.com/toa-io/toa/compare/v1.0.0-alpha.257...v1.0.0-alpha.258) (2026-08-24)


### Bug Fixes

* **exposition:** accept federation signature key as PEM ([121fb00](https://github.com/toa-io/toa/commit/121fb00a4e84ec31d65aa1f747f2a22770db9ba1))





# [1.0.0-alpha.257](https://github.com/toa-io/toa/compare/v1.0.0-alpha.256...v1.0.0-alpha.257) (2026-08-24)


### Bug Fixes

* **core:** lift tombstone on commit when transition leaves it untouched ([38c0d15](https://github.com/toa-io/toa/commit/38c0d15e946c3e2d559d4b18aecc33e0fda2471a))
* **exposition:** allow null output of basic credentials info ([2a98d0c](https://github.com/toa-io/toa/commit/2a98d0c4c7dd510d57f23485fd516990c79e6759))
* **exposition:** re-add deleted basic credentials ([93abdb7](https://github.com/toa-io/toa/commit/93abdb7c97f807d400a236c417af716dbd367189))
* **exposition:** return identity id from federation inception ([4ddcb7e](https://github.com/toa-io/toa/commit/4ddcb7ee7e574d79f783816190381b5bd6eb2dce))
* **exposition:** revive deleted federation credential on create ([89e6363](https://github.com/toa-io/toa/commit/89e6363778a5e503957c339d1626cda0827fbed8))
* **storages.mongodb:** drop unconditional tombstone lift on set ([8e2d201](https://github.com/toa-io/toa/commit/8e2d201e55ff02492529727b38e92a5006598171))
* **storages.mongodb:** lift tombstone on set ([b33d227](https://github.com/toa-io/toa/commit/b33d227dbe1d6c95957d67d31bbe2543e1def8c1))


### Features

* **exposition:** add federation create operation ([0262d7d](https://github.com/toa-io/toa/commit/0262d7d18362d580fc1dd923225c9acba01e751a))
* **exposition:** detach federation credential id from identity ([63a54e4](https://github.com/toa-io/toa/commit/63a54e44a63c846886d7ed55b29de3e85b4725ff))
* **exposition:** return the credential from federation inception ([fced302](https://github.com/toa-io/toa/commit/fced302d16979d234f5a3dbf0ed3897362e95b90))
* **exposition:** unique federation credential per identity and issuer ([0c3e11b](https://github.com/toa-io/toa/commit/0c3e11b2e2497319dc66d566330f8e03c4e35f8d))





# [1.0.0-alpha.256](https://github.com/toa-io/toa/compare/v1.0.0-alpha.255...v1.0.0-alpha.256) (2026-08-23)


### Features

* add toa mono and discover components at components/* ([787a111](https://github.com/toa-io/toa/commit/787a111c8f83e56ebc734801c97106c585d034ea))
* deploy a single mono image with toa deploy --mono ([a7f14f9](https://github.com/toa-io/toa/commit/a7f14f9877a280e9c74d16c195028b35d74fb15a))

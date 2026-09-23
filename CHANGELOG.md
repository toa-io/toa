# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.316](https://github.com/toa-io/toa/compare/v1.0.0-alpha.315...v1.0.0-alpha.316) (2026-09-23)

### Bug Fixes

* **bindings.amqp:** comq 0.24.1 ([720da0c](https://github.com/toa-io/toa/commit/720da0c3a4cddacd95bec8ace71008101d36a314)), closes [toa-io/comq#305](https://github.com/toa-io/comq/issues/305)


# [1.0.0-alpha.315](https://github.com/toa-io/toa/compare/v1.0.0-alpha.314...v1.0.0-alpha.315) (2026-09-23)

* feat(map)!: leave out of a contract what the runtime gives every component ([b81837a](https://github.com/toa-io/toa/commit/b81837a3bc4771d7ee1c10fe613c9a1d7501bf1a))
* feat(core)!: refuse a timeout or a signal on an ordinary call ([600b392](https://github.com/toa-io/toa/commit/600b392abfd8b24df1a151c26fb31a6f0c7ccd41))

### Bug Fixes

* **cli:** write no task on the type of a stateful operation ([e62faeb](https://github.com/toa-io/toa/commit/e62faeb5fe54fd169c445e48c1c09eff01dcbdd2))
* **exposition:** expose a branch whose newer tenant has expired ([2925589](https://github.com/toa-io/toa/commit/292558917382c865c9c9fd8d67ef49363d39b5b9))
* **features:** say that the external consumer fixture is a module ([3f76146](https://github.com/toa-io/toa/commit/3f761460fa54f004995f3c7fbceda56e83f1efdf))
* **features:** say that the stateful counter fixture is a module ([07624c3](https://github.com/toa-io/toa/commit/07624c333f84c73814d6d4dd12778a4357dd608e))
* **map:** name a map mounted from a checkout for what it is ([e274a21](https://github.com/toa-io/toa/commit/e274a218875963bc7df26ea112c580bdab83531a))
* **ui:** leave every system property out of a schema read as a shape ([f8c2e60](https://github.com/toa-io/toa/commit/f8c2e6091eb08213637043ffb1b29f7edf5c3323))

### Features

* **cadence:** make a pulse declared `scope: replica` fire in every replica ([405a319](https://github.com/toa-io/toa/commit/405a319c3dc89889e6dac28ce3894bf59ea7836b))
* **exposition:** serve MCP on a host of its own ([f861b91](https://github.com/toa-io/toa/commit/f861b91d9fac0c6f12d374c2a4a144a2e07880a9))

### BREAKING CHANGES

* a call to a stateless operation that names a `timeout` or a
  `signal` is refused, where it used to be abandoned at its deadline.
* the deployed component map is `/etc/toa/.map.json.gz`.


# [1.0.0-alpha.314](https://github.com/toa-io/toa/compare/v1.0.0-alpha.313...v1.0.0-alpha.314) (2026-09-19)

* feat(core)!: let an operation state how long its calls are remembered ([af177c2](https://github.com/toa-io/toa/commit/af177c2ab3d00d475840b5ef9e612f04e82b72bd))
* feat(core)!: rename trailers to the TRAILERS system property ([8d59ef9](https://github.com/toa-io/toa/commit/8d59ef90d04b7329578203fe10bd21fe41dfe2f5))

### Bug Fixes

* authenticate runtime UIs against identity resources ([e1bb414](https://github.com/toa-io/toa/commit/e1bb414fa0cf010afba3193df79ea1f52c5987c1))
* **configuration:** announce the created mark as an image ([4594e83](https://github.com/toa-io/toa/commit/4594e832cfa8748939e38d498b9f63818f00f2dc))
* **configuration:** generate revision as required on list and get ([b18f085](https://github.com/toa-io/toa/commit/b18f0852d3acfba2d99b6eeef4eb0405a4add098))
* **configuration:** shorten the reset hint to "Hold to reset" ([3ca94d8](https://github.com/toa-io/toa/commit/3ca94d84e15e03efad73c82f4c600f753b9e6a29))
* **stash:** report an unreachable Redis instead of leaving its errors unhandled ([b4ac0ee](https://github.com/toa-io/toa/commit/b4ac0ee7d7679b8e878821cfeeb2998495c6ad41))

### Features

* **configuration:** hold to reset a configuration from its screen ([baccc85](https://github.com/toa-io/toa/commit/baccc85614e25bb9b4643cda958b13f0f8f35e04))
* **configuration:** reset a configuration to its deployed defaults ([0ca8c24](https://github.com/toa-io/toa/commit/0ca8c24c521d8de624dad9f468196f9e537f4783))
* **configuration:** tell a created configuration from the defaults ([f83a532](https://github.com/toa-io/toa/commit/f83a5327855e90fa9ba6327c923bbec3d77b5d27))
* **core:** a destination renders the component's events ([2f93b28](https://github.com/toa-io/toa/commit/2f93b28bed61a0afe99cb8cfa646ed7815467497))
* **core:** a reference may name a declaration its package claims ([8040f60](https://github.com/toa-io/toa/commit/8040f60976549ab90497675bb54e664261f5b6bb))
* **realtime:** route events by dynamic routes ([37d136d](https://github.com/toa-io/toa/commit/37d136dd9883192c17118b797e4619a3b2b305f7))

### BREAKING CHANGES

* `inbox.retention` under 600 is refused. See
  migrations/313.md.
* `state._trailers` is `state.TRAILERS`; see migrations/313.md.


# [1.0.0-alpha.313](https://github.com/toa-io/toa/compare/v1.0.0-alpha.312...v1.0.0-alpha.313) (2026-09-18)

### Bug Fixes

* **exposition:** declare the identity packages at the versions Toa declares ([6ffbe25](https://github.com/toa-io/toa/commit/6ffbe25fbad456c874b88f9e2385d2afed64c92a))


# [1.0.0-alpha.312](https://github.com/toa-io/toa/compare/v1.0.0-alpha.311...v1.0.0-alpha.312) (2026-09-18)

### Bug Fixes

* **bindings.http:** tell a dial that found nothing from a call that failed for its own reason ([82c4e09](https://github.com/toa-io/toa/commit/82c4e09de184d44f1b15c3d9d9fe6be5ea75346a))
* **exposition:** refuse a body past the limit with the status alone ([0fd5c57](https://github.com/toa-io/toa/commit/0fd5c57d2cff15103981916c53708975c5dc95fb))
* **exposition:** resolve every accept against what a route produces, and say why a refusal refused ([0e5cab9](https://github.com/toa-io/toa/commit/0e5cab9b2ae832c2d8d8d23359de31ed8a02614e))

### Features

* **bindings.http:** carry a call that holds a stream ([c571793](https://github.com/toa-io/toa/commit/c571793b617e3d5ae1dce5b98b64d67d7d8224f6))
* **boot:** offer a streamed endpoint to the bindings that carry a stream ([0099b4e](https://github.com/toa-io/toa/commit/0099b4e12bff4ce5dba2d0098f0b8c6a18fff2c5))
* **boot:** tell a producer which of its endpoints take a stream ([6383adc](https://github.com/toa-io/toa/commit/6383adcebf38d889db80d8cbd19fe38f3ba4eb2e))
* **cli:** write the property that carries a stream into a component's types ([8eae8ce](https://github.com/toa-io/toa/commit/8eae8cea011c0be78b27ed1380a1a6f17c9479f8))
* **configuration:** give a deployed component the revision of its defaults ([6a54fc6](https://github.com/toa-io/toa/commit/6a54fc6f0f640f79316c383aa8448a7f28a79276))
* **configuration:** refuse deployed defaults of another revision, and say so ([1fa8d3e](https://github.com/toa-io/toa/commit/1fa8d3eba9ec30b5d53958e588399c3bf0d12d59))
* **core:** raise an exception where nothing answers for a component ([ec072e0](https://github.com/toa-io/toa/commit/ec072e019c0ca595e264d67a191f7e762dff025d))
* **core:** refuse a call that carries no stream where the operation takes one ([fb78e02](https://github.com/toa-io/toa/commit/fb78e02fa620b15f6aa7bac184dd8a6ede923150))
* **core:** require the property that carries a stream, and refuse a task that carries one ([fdc7e6b](https://github.com/toa-io/toa/commit/fdc7e6b345ee22b030a52f1fda0e91e6bf63a392))
* **exposition:** answer a component that cannot be reached with 503 ([dff650f](https://github.com/toa-io/toa/commit/dff650f03deda291466f8b08d266f3cac113f709))
* **exposition:** hand a request body to an operation as the stream it takes ([8c9061d](https://github.com/toa-io/toa/commit/8c9061dff624e9cab26bb0e1f6732304f1f36493))
* **exposition:** refuse a route that maps a stream onto an operation that takes none ([e679fba](https://github.com/toa-io/toa/commit/e679fbacff289791d5b909bcc0e6c9b806fd52be))
* **norm:** let an operation declare the input property that carries a stream ([85a8f1f](https://github.com/toa-io/toa/commit/85a8f1ff5b62f658e0527dcce7230d8388d28fe0))
* **operations:** point a component's service at the port a streamed call is served on ([dbad630](https://github.com/toa-io/toa/commit/dbad630f765d5c1d50b3eda65768352905149c0c))
* **operations:** refuse to render a chart for a context with no version ([d6cd083](https://github.com/toa-io/toa/commit/d6cd083bfe8d7da9f3d451c2c25d821eb41ce958))
* **runtime:** install the binding that carries a stream ([ea9150c](https://github.com/toa-io/toa/commit/ea9150c5efcee636a0fa55e9a0c3af9f01c20a62))


# [1.0.0-alpha.311](https://github.com/toa-io/toa/compare/v1.0.0-alpha.310...v1.0.0-alpha.311) (2026-09-17)

### Bug Fixes

* **exposition:** resolve cache-control apart for anonymous and authenticated requests ([cee1ae5](https://github.com/toa-io/toa/commit/cee1ae5c6b660a235f36aca0fe81841cc4a1b509))

### Features

* begin exchange and queue names with the scope under a suffix ([af3752d](https://github.com/toa-io/toa/commit/af3752d1fcb8a3b42d9071dfbdb3c4800590d3d5))
* name the database after the scope ([4d7203f](https://github.com/toa-io/toa/commit/4d7203fd18828895272a9dae76e351d92b49277f))
* read the scope of a process once, as it boots ([0d65de5](https://github.com/toa-io/toa/commit/0d65de58ffc655ff872b8e66f95c5609ada3370a))

### Performance Improvements

* **cli:** count what a process holds in buffers towards its heap limit ([cb5f025](https://github.com/toa-io/toa/commit/cb5f0253e23e8119c1f83e1d97b2a098fbecebf5))
* **exposition:** answer a request without the closures and promises of a chain ([e4ba55d](https://github.com/toa-io/toa/commit/e4ba55dbf827699229ca0142fb766d5cc5f1a20a))
* **exposition:** await an interceptor, a directive stage and a transform only where it is pending ([ffa3dee](https://github.com/toa-io/toa/commit/ffa3deec8c2d893bf7815b2d9f2f2993f77b4e28))
* **exposition:** make no headers and no promises a request without them does not need ([5d6cb93](https://github.com/toa-io/toa/commit/5d6cb93d822af396895407b291f9b4c68af11337))
* **exposition:** match a route and read a query without building what is not read ([299bbf2](https://github.com/toa-io/toa/commit/299bbf2be1293dad25ef73e6fb2344624b46c019))


# [1.0.0-alpha.310](https://github.com/toa-io/toa/compare/v1.0.0-alpha.309...v1.0.0-alpha.310) (2026-09-16)

### Bug Fixes

* **exposition:** end a multipart reply whose body fails with FIN ([672d60f](https://github.com/toa-io/toa/commit/672d60f5d48612a2b1e21a3a2409e4c5e31b1557))
* **realtime:** open a stream per consumer of a key ([daa5aa8](https://github.com/toa-io/toa/commit/daa5aa8a80ffd310b47144f2371994fb34ff40b2))

### Features

* answer discovery on one queue a process holds ([3c5bb14](https://github.com/toa-io/toa/commit/3c5bb14184d80f0eddf18b763d3d3987256a238b))
* give a component one task queue ([4abb6b2](https://github.com/toa-io/toa/commit/4abb6b2eee253a3b4dc31d001bb05521d83fdf9d))


# [1.0.0-alpha.309](https://github.com/toa-io/toa/compare/v1.0.0-alpha.308...v1.0.0-alpha.309) (2026-09-16)

### Bug Fixes

* **exposition:** destroy a reply stream the client left before it was written ([69351e5](https://github.com/toa-io/toa/commit/69351e553011c1e2e186dcf9dd8c3cb43cae9f16))


# [1.0.0-alpha.308](https://github.com/toa-io/toa/compare/v1.0.0-alpha.307...v1.0.0-alpha.308) (2026-09-15)

### Bug Fixes

* **bindings.amqp:** close a connection that lands after its disposal ([d6fcdb1](https://github.com/toa-io/toa/commit/d6fcdb1a38918145680a3fdde89ed3b40afcb2d7))
* **exposition:** locate what a route reaches when the route is called ([9d7075a](https://github.com/toa-io/toa/commit/9d7075a235b0f9a75607055fec64c3d964349a8a))


# [1.0.0-alpha.307](https://github.com/toa-io/toa/compare/v1.0.0-alpha.306...v1.0.0-alpha.307) (2026-09-15)

### Bug Fixes

* **introspection:** host the components the deployment provisioned ([b36d80b](https://github.com/toa-io/toa/commit/b36d80b154e40275c610b021cfb2c9628cac7cab))


# [1.0.0-alpha.306](https://github.com/toa-io/toa/compare/v1.0.0-alpha.305...v1.0.0-alpha.306) (2026-09-14)

* feat(introspection)!: remove payload samples ([934db2a](https://github.com/toa-io/toa/commit/934db2a2f617833cae37501c6ea8957f3d0a4c7d))
* refactor(introspection)!: a signal is written and not read ([7dd17e9](https://github.com/toa-io/toa/commit/7dd17e9afd9344200737846b678379ab920c1517))
* refactor(core)!: name the quiesce hooks pause and unpause ([6e4e5f5](https://github.com/toa-io/toa/commit/6e4e5f55d43f03ea95ca8bbdaae57b949564dfa2))
* feat(boot)!: a process can be halted and come back ([7196fa5](https://github.com/toa-io/toa/commit/7196fa51a9c882e84c3767a4fdd329fd2df319f5))

### Bug Fixes

* **boot:** declare what a workload does with a quiesce ([0e1521d](https://github.com/toa-io/toa/commit/0e1521d7abae3a3860a29978d267927d814c1d3a))
* **boot:** keep a halted process alive until it comes back ([3d3cc23](https://github.com/toa-io/toa/commit/3d3cc23835f836f9f98b1d9a448090a2b0d473c8))
* **cli:** write context.atom in generated types ([b74ec5c](https://github.com/toa-io/toa/commit/b74ec5c3a594024e1df45d58c9eb763f4744bca1))
* **core:** walk past a connector that has already stopped ([e1a81a9](https://github.com/toa-io/toa/commit/e1a81a9af544c0da9d9787d66cd5c93a9c7a35d3))
* **exposition:** expose a component whose contract changed but whose routes did not ([6b9130b](https://github.com/toa-io/toa/commit/6b9130b5d910b95b898347595104799190e290af))
* **introspection:** do not take an unanswered write for a stop that was called ([930d231](https://github.com/toa-io/toa/commit/930d231b82ffdd0cda42cb44a9a2e4a68f7408c4))
* **introspection:** hold the countdown badge to one width ([9ce301a](https://github.com/toa-io/toa/commit/9ce301a454174d7f41cbf04a44b76cbf28891fdb))
* **introspection:** open the halt form on numbers that can be pressed ([1db3df1](https://github.com/toa-io/toa/commit/1db3df137d7531c8b945e511c96bb1d67ffb1996))
* **introspection:** open the halt form on what is usual, within what is allowed ([e950c04](https://github.com/toa-io/toa/commit/e950c04733336af99ef1a533517a50f2d4c6014b))

### Features

* **bindings:** count what a process is handling ([2298a97](https://github.com/toa-io/toa/commit/2298a973ca80143910e988da64949a51eb1a9101))
* **boot:** let a process go quiet and be let go again ([0fc3e66](https://github.com/toa-io/toa/commit/0fc3e66f217ab45e85f70271ab0768232b3fa088))
* **boot:** quiet a tree before taking it down ([7a339ca](https://github.com/toa-io/toa/commit/7a339caea4499509b55daf91061fc9836c0f6e68))
* **bridges.node:** let a component stop what it started and start it again ([d10d5d1](https://github.com/toa-io/toa/commit/d10d5d16fcd181e717d9d2cef4c7814ae8f2a93f))
* **cadence:** stop the pulse and the dispatcher while the process is quiet ([60ce53d](https://github.com/toa-io/toa/commit/60ce53dbdccee583bffba8a0cacdcec96620d946))
* **core:** let a tree be told to stop and to start again ([cfff727](https://github.com/toa-io/toa/commit/cfff7270ebe46f3fc9ac53652b3d129474e442ed))
* **definitions:** refuse a component that is off the map where halts are on ([80b5a63](https://github.com/toa-io/toa/commit/80b5a63af971a6462cb14db89364f1904e22c887))
* **exposition:** answer 503 while the process is quiet ([4ab8c08](https://github.com/toa-io/toa/commit/4ab8c08bcdc7dbbb94f841f97e44e20cf6a3f766))
* **introspection:** a HALT control in the header ([df076a5](https://github.com/toa-io/toa/commit/df076a50a329c97c57c379046791325735eb3ed2))
* **introspection:** a signal stops every process of a deployment ([bfeda01](https://github.com/toa-io/toa/commit/bfeda01133e0388ad577203f3d00ea87861646f9))
* **introspection:** ask for duration and quiescence on the halt form ([675dd17](https://github.com/toa-io/toa/commit/675dd1749b9d15f67171098f6ddabb37afe6535c))
* **introspection:** hold, count down, and halt the deployment ([8dae775](https://github.com/toa-io/toa/commit/8dae77596b5923a3d74f6c9a40a6eb90047ea773))
* **introspection:** let a deployment say what a halt may ask for ([a40d3ed](https://github.com/toa-io/toa/commit/a40d3ed6a07772be5bb747882cf1f4753b384b24))
* **introspection:** stop a deployment only once it has been seen still ([268db9b](https://github.com/toa-io/toa/commit/268db9b5a9f95716d6fc50c384d3fa101e21ce57))

### BREAKING CHANGES

* `Host.halt` is `Host.stop`.
* `Host` gains `gate` and `halt`, and `Factory.service` may answer a gate. An
  extension that gates nothing keeps its connections through a halt.
* `introspection.samples` is read by nothing, in a context and in a manifest
  alike, and an edge carries no `sample`.
* `introspection.signals` exposes `POST` alone.


# [1.0.0-alpha.305](https://github.com/toa-io/toa/compare/v1.0.0-alpha.304...v1.0.0-alpha.305) (2026-09-13)

### Bug Fixes

* **agent:** read the clock around a substitution rather than before it ([a5e9ec9](https://github.com/toa-io/toa/commit/a5e9ec956b8827e9450ead2529c3150612a7705d))
* **openspan:** resend a batch that raced the endpoint closing its connection ([51fabab](https://github.com/toa-io/toa/commit/51fabab3ff654ecdfafe8cf32c5cbc5fa8d78949))

### Features

* **core:** refuse a call that writes, made under a request that only reads ([92951d0](https://github.com/toa-io/toa/commit/92951d0f7b95bd5b838097dd6a42db5586968d0b))
* **exposition:** say that a safe method only reads, and let a route say otherwise ([a72227a](https://github.com/toa-io/toa/commit/a72227a63ba3f49e234aa984d70c53d5d6ef792d))
* **telemetry:** export log records to an OTLP endpoint ([aa7741d](https://github.com/toa-io/toa/commit/aa7741d3d1f813ac5c65b5b91d0bcf094cbe0973))


# [1.0.0-alpha.304](https://github.com/toa-io/toa/compare/v1.0.0-alpha.303...v1.0.0-alpha.304) (2026-09-13)

### Bug Fixes

* **core:** recognise an encoded reply whichever copy of the package made it ([643f048](https://github.com/toa-io/toa/commit/643f048784f7dc04db57194a2c64ebc148234951))
* **generic:** escape the decimal point in the quantity expression ([a947232](https://github.com/toa-io/toa/commit/a9472327d37e7130bf69a700383bc5af129caf0f))

### Performance Improvements

* **core:** make an invocation's call counter where the first call is made ([894b1e5](https://github.com/toa-io/toa/commit/894b1e5c64e880e7ba7e53cf53d9a43ebde936ad))
* **exposition:** build the tools a tree publishes once per tree ([a010ad8](https://github.com/toa-io/toa/commit/a010ad890aaf32663b3ada05d07a68f477a83deb))
* **exposition:** describe a method once, for every caller ([8362512](https://github.com/toa-io/toa/commit/8362512b372392c2598a95f4b8ef5903ce24c31b))
* **exposition:** skip a directive's span where the trace is not sampled ([2ca585e](https://github.com/toa-io/toa/commit/2ca585ef0d3f58560712321102ab98382d054af0))
* **exposition:** write an answered status onto the request's own labels ([7ead1b8](https://github.com/toa-io/toa/commit/7ead1b8d02c868ef64f7bf53d25f144f2da114db))
* **openspan:** build a metric's labels only for a new point ([edd0683](https://github.com/toa-io/toa/commit/edd06834400981a257f84c5a1352b7fd32990a2d))


# [1.0.0-alpha.303](https://github.com/toa-io/toa/compare/v1.0.0-alpha.302...v1.0.0-alpha.303) (2026-09-12)

### Bug Fixes

* **benchmarks:** attach the profiler to the latest boot of a process ([0d1ee23](https://github.com/toa-io/toa/commit/0d1ee23dc5c9cc6e86d26ee5a103352b1a201183))
* **benchmarks:** end the load a process breaks when it exits ([f8f1388](https://github.com/toa-io/toa/commit/f8f13882fea0ed276b99938aa6a2499b8585c089))
* **benchmarks:** keep the cache from removing a tree in use ([04e3c01](https://github.com/toa-io/toa/commit/04e3c01fd6ee940a0af78a5f47585bafe678049e))
* **benchmarks:** make an A/A run come out unchanged ([cc7fac8](https://github.com/toa-io/toa/commit/cc7fac8cff761418e14ed2b61d4c863f5c0dfb15))
* **benchmarks:** name the port in the authority of a request ([a2955eb](https://github.com/toa-io/toa/commit/a2955eb4bd50a916579e7554af2914ff408fa124))
* **benchmarks:** name the scenario of a calibration that fails ([dfa1c42](https://github.com/toa-io/toa/commit/dfa1c42be751217627c5e6f8629a7f8b3c2efea2))
* **benchmarks:** stop counting a token re-issue as the cost of a request ([0dfbe3d](https://github.com/toa-io/toa/commit/0dfbe3dc1cc4032edefb0258ede260aa8482c596))
* **benchmarks:** swap the revisions' slots every block and wait for their outboxes ([e133b99](https://github.com/toa-io/toa/commit/e133b9918f90d09566314152427857495b20fb86))
* **compose:** raise mongod's open file limit to what its collections need ([e92ce48](https://github.com/toa-io/toa/commit/e92ce48a3e6e79d982f635452f1dd090b9a2fe27))
* **exposition:** state that flow:compose reads the reply it composes ([08e561d](https://github.com/toa-io/toa/commit/08e561da42080b3aa395c647bcabf3136d3e0486))
* **telemetry:** narrow an instrument where the suite reads one ([5809aaf](https://github.com/toa-io/toa/commit/5809aaf6890fb555d9f376c73e9200dd77bfc710))

### Features

* **benchmarks:** compare the request path of two revisions on one machine ([e664541](https://github.com/toa-io/toa/commit/e664541283dce53583b15dcf2291d23d0b4dbad2))
* **core:** carry an output encoded for a caller that reads bytes ([38fdb32](https://github.com/toa-io/toa/commit/38fdb3234dee1ad83f755379f39eeab5708a29d1))
* **core:** measure operations and calls ([0d98e48](https://github.com/toa-io/toa/commit/0d98e480f38058ac0466de8b150951abe0254f2a))
* **core:** read a projection for an observation and refuse it to every other type ([e38c926](https://github.com/toa-io/toa/commit/e38c926ce0a7149aa8b618845e48042ffd1e7eb6))
* **core:** restrict an operation's output to what its request asks for ([532b08e](https://github.com/toa-io/toa/commit/532b08e388d2fcee54c367d344aeb74524ecf6c4))
* **exposition:** ask an operation for what io:output admits ([6c07c75](https://github.com/toa-io/toa/commit/6c07c7595a71a55e0110e63b3d8e121d8e1ce4b0))
* **exposition:** measure requests by route rather than by URL ([3da0c2b](https://github.com/toa-io/toa/commit/3da0c2b9ed3563edee2b754d8c420a93a5f20a67))
* **exposition:** send the projection a route declares with its call ([edc2e93](https://github.com/toa-io/toa/commit/edc2e930761d32a599e2486991f961385e8f9219))
* **metrics:** count what no span reaches ([efabf89](https://github.com/toa-io/toa/commit/efabf89e78f98a604bb939f476a937fc9ee106b3))
* **metrics:** measure storage, stash, blob storages and fetch ([252298b](https://github.com/toa-io/toa/commit/252298bb9f34421694da4ee89742d62b47c39dfb))
* **observability:** post metrics to the local Prometheus ([e0c702e](https://github.com/toa-io/toa/commit/e0c702e989f062fb79146fcdab634d1c59f9ed75))
* **openspan:** add a metrics registry and its console exporter ([18cb39c](https://github.com/toa-io/toa/commit/18cb39ca7f5816d610b1e10d919c96d94d4a9d04))
* **openspan:** export metrics over OTLP/HTTP ([1fe23b8](https://github.com/toa-io/toa/commit/1fe23b8271121ad81e0d750dc97d4548ce5a871c))
* **operations:** a composition states how many replicas it runs ([4466f5a](https://github.com/toa-io/toa/commit/4466f5abcc22c6dceb2994a0143b6bf9d5201d9d))
* **telemetry:** configure metrics from the context annotation ([7eaaa94](https://github.com/toa-io/toa/commit/7eaaa9415e77a4a02802994d16d44754c4f41694))
* **telemetry:** let a component declare its own metrics ([05aa3c7](https://github.com/toa-io/toa/commit/05aa3c72cd6a160e1cef99df6176a7f627075bc0))

### Performance Improvements

* **bindings.amqp:** answer an output as bytes where its caller reads them ([96be109](https://github.com/toa-io/toa/commit/96be1096abaaf6d1d01d1a1b62354a656bbb9f20))
* **bindings.amqp:** depend on comq 0.20.1, which sends a message without delay ([4e34c3b](https://github.com/toa-io/toa/commit/4e34c3ba51d1a086b5c82eeaa78107ce628e4494))
* **core:** derive a call identity with node:crypto from a parsed namespace ([7591600](https://github.com/toa-io/toa/commit/75916009409e4ae446d70d4ecbcc5af3972ec941))
* **core:** read TOA_ENV when an operation is created ([c56d6b7](https://github.com/toa-io/toa/commit/c56d6b7e7d70b179c0d7473a22ee2f1e8c44b5fe))
* **exposition:** abort a request's controller only when its reply is unfinished ([10194f1](https://github.com/toa-io/toa/commit/10194f1abdaa32e8f7d425a18893685a5441189c))
* **exposition:** tag a reply a client may keep ([1bc0d97](https://github.com/toa-io/toa/commit/1bc0d9756e61c562aa4252f26f1ced903267c846))
* **exposition:** write a component's bytes and tag a reply by its body ([90b3bba](https://github.com/toa-io/toa/commit/90b3bbac5e2bc08085b27abfc4c2ebdcc349d516))
* **identity.tokens:** import jose once ([6772753](https://github.com/toa-io/toa/commit/67727530a47873a99f97d26769cb202b795b4414))
* **identity.tokens:** open a token with node:crypto ([1f72eaa](https://github.com/toa-io/toa/commit/1f72eaa9d977b8616467ea4939cef48c139a04ba))
* **storages.mongodb:** rename a record's _id to id in place ([4aeb2a1](https://github.com/toa-io/toa/commit/4aeb2a1d61f7f2b0ddab203b5887152e8917ef7f))


# [1.0.0-alpha.302](https://github.com/toa-io/toa/compare/v1.0.0-alpha.301...v1.0.0-alpha.302) (2026-09-11)

### Bug Fixes

* **exposition:** a stream the client closes is not logged as an error ([ba41535](https://github.com/toa-io/toa/commit/ba415358baa36d400e4748732d4ddb3d0c59f673))

### Features

* **boot:** a run command may wait until the component is served ([0f66bed](https://github.com/toa-io/toa/commit/0f66bedf7b54dc9c1397f7f32bbccbffde7288ca))


# [1.0.0-alpha.301](https://github.com/toa-io/toa/compare/v1.0.0-alpha.300...v1.0.0-alpha.301) (2026-09-11)

### Bug Fixes

* address review of the environment fallback chain ([900160b](https://github.com/toa-io/toa/commit/900160b60b6a017868aae84310730b91ea7d26f0))
* **norm:** an operation that takes no input states none ([3b69b4c](https://github.com/toa-io/toa/commit/3b69b4c92b3f06361a3552f036a927f4ff32e58b))
* **operations:** a composition of evicted components asks for no resources ([a6a3ec7](https://github.com/toa-io/toa/commit/a6a3ec76781812f5a9bdd46c6de0fe7769174d57))

### Features

* **exposition:** a request whose header holds a censored value is answered 451 ([04f275a](https://github.com/toa-io/toa/commit/04f275a641f37d2519d7ef209f4e0d0b2b5421bd))
* **norm:** an environment name may fall back along a colon-separated chain ([a267c1c](https://github.com/toa-io/toa/commit/a267c1caae816a75ada8352d5361b99817c72eb1))
* **operations:** an evicted component is given its environment and configuration ([6cf7890](https://github.com/toa-io/toa/commit/6cf7890a632a2185d2b7d9790890a04187e5a897))

### Reverts

* **ui:** the shadcn component indexes are as the generator writes them ([e02f03e](https://github.com/toa-io/toa/commit/e02f03e29d0565be83a936bfd21c24b49206e63f))


# [1.0.0-alpha.300](https://github.com/toa-io/toa/compare/v1.0.0-alpha.299...v1.0.0-alpha.300) (2026-09-11)

* feat(boot)!: a process is a thing, and an extension may keep something in one ([528d6cd](https://github.com/toa-io/toa/commit/528d6cdd307b45a6c30b6a184d7e06b3328cecf8))
* feat(core)!: an operation may ask to run once ([dca616c](https://github.com/toa-io/toa/commit/dca616cb380a7a389e277875d3bd5ca55a6e4d45))

### Bug Fixes

* **core:** a caller that stops waiting is answered at once, and its call is made nowhere ([c96880a](https://github.com/toa-io/toa/commit/c96880a39adc288153816ff54213bbb71fc96d48))
* **core:** a lookup and a failed publication say what became of them ([47b924b](https://github.com/toa-io/toa/commit/47b924b02f002ace14698365823df92f5379c537))
* **exposition:** a null reply is 404 again ([a01d403](https://github.com/toa-io/toa/commit/a01d4032bc29ffa70f310a1d006bb67e2d4d1c58))
* **exposition:** a route that maps only the instance keeps an input of none ([3cde80c](https://github.com/toa-io/toa/commit/3cde80c3f1c669a7959508ecfeb1cc7ef59c7ace))
* **extensions:** what a factory remembers does not outlive the tree it was made for ([dd36631](https://github.com/toa-io/toa/commit/dd3663160f500eadfb701bf840ef3741a2d075f0))

### Features

* **cli:** generate env for listed components and services ([b830613](https://github.com/toa-io/toa/commit/b830613ae2a0443bf8e72a353ffb6f2efaa72fb5))
* **cli:** run several extension services with `toa serve` ([e8eee8c](https://github.com/toa-io/toa/commit/e8eee8c8b7ed2c82bdf935f2f2065d7b1e72aab8))
* **cli:** toa serve refuses a listed service that is off in this environment ([f3aecef](https://github.com/toa-io/toa/commit/f3aecef7b9809a9e6088ed2eb0864f9821d8c465))
* **cli:** write types for components this context does not deploy ([964a3b9](https://github.com/toa-io/toa/commit/964a3b9d60fd6aa3a3b81a0bd024aa8aca95f179))
* **core:** a call carries what it is, and a chain of them carries it down ([ebd7769](https://github.com/toa-io/toa/commit/ebd776984a79adb9bf4a97b680128be1efab856f))
* **core:** a call may name the process it goes to, and wait for a set time ([7d8adb2](https://github.com/toa-io/toa/commit/7d8adb2772a95ff45ae5374efdedfb5a857fbbe9))
* **core:** a connector says whether it has been disposed of ([5db7c49](https://github.com/toa-io/toa/commit/5db7c497df3c10310f1efaa178b9201d4dcba7a0))
* **core:** an assignment may ask to run once as well ([10fbcbd](https://github.com/toa-io/toa/commit/10fbcbd86a5e82960e65f62c09d0a465ae8d0353))
* **exposition:** a client's idempotency key is what the call is ([3092028](https://github.com/toa-io/toa/commit/3092028df2803183c7e0ab08a7e89de25b36151b))
* **exposition:** a route may name the process a stateful operation is called on ([f66d085](https://github.com/toa-io/toa/commit/f66d085c8cf1a646685bc9a3ca2ee0f7e0211bfa))
* **exposition:** discovery lists status codes, and a null reply is Gone ([b928f28](https://github.com/toa-io/toa/commit/b928f28c6a72028cd76614ac937cd35c7d385c62))
* **norm:** a context says what it does not deploy ([135e6fd](https://github.com/toa-io/toa/commit/135e6fdfbc4270762028e9e5a0516766960ce59c))
* **operations:** a rollout spreads the pods of its revision across nodes ([63be649](https://github.com/toa-io/toa/commit/63be649a73978a415f0c1e7ffb3837ffa7802da7))

### BREAKING CHANGES

* `Storage.store`, `.upsert` and `.ensure` take one more
  argument, and `Storage` has two more members. A connector that ignores them
  works exactly as it did; a component that asks it for `once` is refused at
  boot. See migrations/299.md.
* a composition booted directly has no readiness probe. Readiness is
  the process's, and a composition is not a process. `stage.workload` boots one where a
  suite needs it.


# [1.0.0-alpha.299](https://github.com/toa-io/toa/compare/v1.0.0-alpha.298...v1.0.0-alpha.299) (2026-09-10)

* feat(core)!: an endpoint a component does not provide is refused with a code ([6cabf9c](https://github.com/toa-io/toa/commit/6cabf9ccef9353f19a727888c667f5059c1ad2b5))

### Bug Fixes

* **bindings.amqp:** work with nobody waiting for it survives failing ([e70dd59](https://github.com/toa-io/toa/commit/e70dd59fc277623928ca132e2b911c5c4f441ffc))
* **cadence:** a delayed call is settled by its outcome, not by the attempt ([ac1c54b](https://github.com/toa-io/toa/commit/ac1c54b878e2705d81ce8365cf2f13e1d5ce0e83))
* **cli:** a process on its way out keeps its telemetry ([eb33bd4](https://github.com/toa-io/toa/commit/eb33bd4fd6a1beabf2a2535cdd0901037a4587f7))
* **convergence:** the merge outcome is a trace ([e1c4190](https://github.com/toa-io/toa/commit/e1c4190317a589bfdb254648a0e907684c248589))
* **convergence:** the refusal names what it can see ([7db9767](https://github.com/toa-io/toa/commit/7db9767dcf0c415a9a5b2b9d85abd7e564bd96c8))
* **core:** the chain's test imports what the endpoint code already did ([ca474c8](https://github.com/toa-io/toa/commit/ca474c845a4376b40aaba534979859114c1b89d9))
* **core:** what the pump publishes is a debug line ([a1f98e9](https://github.com/toa-io/toa/commit/a1f98e90dc1dd4f43124d4f221f62cfd4d9b202a))
* **exposition:** a stop leaves no stream running ([2816c1b](https://github.com/toa-io/toa/commit/2816c1b107b8774cf64f5c35f0008b32eaa92a69))
* report configuration and discover lifecycle at trace ([e713bf9](https://github.com/toa-io/toa/commit/e713bf99a0f6306c655f733b4209923841f88392))
* **stash:** await the store ([34ecdb6](https://github.com/toa-io/toa/commit/34ecdb6b03eca639869569adc121402fa197e734))

### Features

* **bindings.amqp:** a binding carries a channel, addressed by label ([17cf178](https://github.com/toa-io/toa/commit/17cf1782d1c47d033c02f99947b766eb9d45df75))
* **bindings.amqp:** a message that can never be processed is kept at once ([5dd9e4b](https://github.com/toa-io/toa/commit/5dd9e4b1d9403a324eac5b64146d5f1170f70e95))
* **cadence:** a delayed call is made by the chain that asked for it ([0a38ac6](https://github.com/toa-io/toa/commit/0a38ac672516783644e27085e9372bcff6116d1a))
* **cadence:** a deployment makes the calls of the region it is ([60736e5](https://github.com/toa-io/toa/commit/60736e5a56a7f96648c8a3d1ddc1f4c6c8197b5e))
* **cli:** a region's broker topology is exported ([697ca6c](https://github.com/toa-io/toa/commit/697ca6ca08091a79a23c59ffe5ef5d9d462dbb8a))
* **convergence:** deployments of one context converge ([8a70343](https://github.com/toa-io/toa/commit/8a70343cf6953aab58d4a25bac215508ff8d9a37))
* **convergence:** the environment is which region a deployment is ([87f468a](https://github.com/toa-io/toa/commit/87f468af4da386c4c27057e817610768db841ac7))
* **convergence:** what an extension ships converges too ([b3be33d](https://github.com/toa-io/toa/commit/b3be33d2a1db45cfd844288467441aea2f4a722d))
* **core:** a call carries the chain it came by, and a circle is refused ([fccc887](https://github.com/toa-io/toa/commit/fccc8875b4af0d8cec914291c95db1c99e4a6a3f))
* **core:** a chain crosses an event, and the circle it closes is refused ([abd6ee2](https://github.com/toa-io/toa/commit/abd6ee22718c23dfdbc0974b3beec4afe0934533))
* **core:** a component reads the region it runs in ([fadc335](https://github.com/toa-io/toa/commit/fadc335bca9e71e6f2f592fa3ee13783cd71642b))
* **core:** a record carries the region that wrote it ([13ed187](https://github.com/toa-io/toa/commit/13ed187604f06dec66feec2e26ccf9dae30bb048))
* **core:** an outbox row is published to destinations ([cfb77b4](https://github.com/toa-io/toa/commit/cfb77b4826ff0f9560769a0996981e143d6525af))
* **core:** an outbox that owns no lane says so ([1ad693c](https://github.com/toa-io/toa/commit/1ad693cf5e2a6e2451e23e8c6d07831957ca150b))
* **core:** every system property is required ([52c468a](https://github.com/toa-io/toa/commit/52c468aacb03d0347a0e044f6bd76677bdd6af36))

### BREAKING CHANGES

* invoking an endpoint a component does not provide rejects with
  `EndpointException` (code 402) rather than an `AssertionError`.


# [1.0.0-alpha.298](https://github.com/toa-io/toa/compare/v1.0.0-alpha.297...v1.0.0-alpha.298) (2026-09-08)

### Bug Fixes

* **ui:** system fonts, and the discovery signature follows the list ([81abb0f](https://github.com/toa-io/toa/commit/81abb0f347383793ce9cfc34ff25e0f98c223a11))

### Features

* **operations:** tag a deploy with the environment so registries can prune ([7247c35](https://github.com/toa-io/toa/commit/7247c35f33fb34dcfb3ffa04b196c14bfb3d5620))


# [1.0.0-alpha.297](https://github.com/toa-io/toa/compare/v1.0.0-alpha.296...v1.0.0-alpha.297) (2026-09-08)

* feat(exposition)!: the gateway names itself in `exposition`, not `server` ([e707c63](https://github.com/toa-io/toa/commit/e707c6326b00db3dd648a3f3bb9bc7b21c0e6b4c))

### BREAKING CHANGES

* the `server` response header is no longer set. What it carried
  is in `exposition`, as `<version> <context>/<environment>`.


# [1.0.0-alpha.296](https://github.com/toa-io/toa/compare/v1.0.0-alpha.295...v1.0.0-alpha.296) (2026-09-08)

### Bug Fixes

* **exposition:** the gateway's image carries every storage provider ([ab19d25](https://github.com/toa-io/toa/commit/ab19d2567764d5a3148b067f186819d7e646908f))

### Features

* **exposition:** bind OAuth access tokens to the resource they were issued for ([a1728e1](https://github.com/toa-io/toa/commit/a1728e134287c9dd6a710370c1b9abc6d1139a54))
* **exposition:** the discovery page says what answered it ([78f6b2f](https://github.com/toa-io/toa/commit/78f6b2f31f1a85ef803b53a17f3dfc637a215e3a))


# [1.0.0-alpha.295](https://github.com/toa-io/toa/compare/v1.0.0-alpha.294...v1.0.0-alpha.295) (2026-09-07)

**Note:** Version bump only for package @toa.io/toa





# [1.0.0-alpha.294](https://github.com/toa-io/toa/compare/v1.0.0-alpha.293...v1.0.0-alpha.294) (2026-09-07)

### Bug Fixes

* **cli:** `toa npm` reads back through the range npm wrote ([8af4c53](https://github.com/toa-io/toa/commit/8af4c536fb0bf7f122a98d864d903f580ad832ba))

### Features

* **configuration:** refuse a plain string where the schema declares a secret ([f100057](https://github.com/toa-io/toa/commit/f1000576370c4fb02bac30313097825c159f3a45))


# [1.0.0-alpha.293](https://github.com/toa-io/toa/compare/v1.0.0-alpha.292...v1.0.0-alpha.293) (2026-09-07)

### Bug Fixes

* **exposition:** identity.tokens declares the jose it now imports ([dafd811](https://github.com/toa-io/toa/commit/dafd81123a65111332f38e8e11d75c3af8e0450f))
* **runtime:** the cadence extension is installed with the runtime ([a13c585](https://github.com/toa-io/toa/commit/a13c58530ece55fa618ae4bd2186eabf41625978))

### Features

* **cli:** `toa npm` installs what a Context's components declare ([97196f0](https://github.com/toa-io/toa/commit/97196f00feb1b422c6f7ac3a4ddcb47a5ba60d71))
* **exposition:** a queryable method states what picks the records ([a3a047e](https://github.com/toa-io/toa/commit/a3a047ead018aac494b4da6c9df722ed94c9acd8))
* **exposition:** discovery carries guides for authentication and multipart responses ([cd82e1d](https://github.com/toa-io/toa/commit/cd82e1d9049b62298f823788185570e35ab0a536))


# [1.0.0-alpha.292](https://github.com/toa-io/toa/compare/v1.0.0-alpha.291...v1.0.0-alpha.292) (2026-09-07)

### Features

* **cli:** the deployment library is a peer, and the binary is the CLI's ([a923f81](https://github.com/toa-io/toa/commit/a923f8173a55ed1c091213a7c7db1863ca1d0ba6))
* **definitions:** an operation is read from its source ([56ee048](https://github.com/toa-io/toa/commit/56ee0485e7f00fa52bd9de9a4b0c780127b3ee87))
* **definitions:** the version of Toa is the definitions package's ([3d0272e](https://github.com/toa-io/toa/commit/3d0272ea0ab862f4b6c2e58a2f003f92d0f8a87f))
* **definitions:** what a package declares is read from one package ([7052341](https://github.com/toa-io/toa/commit/70523411b5d9e2b204c999aa02365173f3bb518d))
* **norm:** a package's definition is read by one resolver ([bffd41c](https://github.com/toa-io/toa/commit/bffd41c8d18c42786b0bf321623088b9dabc4724))


# [1.0.0-alpha.291](https://github.com/toa-io/toa/compare/v1.0.0-alpha.290...v1.0.0-alpha.291) (2026-09-07)

**Note:** Version bump only for package @toa.io/toa





# [1.0.0-alpha.290](https://github.com/toa-io/toa/compare/v1.0.0-alpha.289...v1.0.0-alpha.290) (2026-09-07)

* fix(operations)!: an image starts as root again ([9eb0db7](https://github.com/toa-io/toa/commit/9eb0db75e3d02098fe75710280e8e15e63b73d57))
* The runtime's environment is not a component's (#1070), closes [#1070](https://github.com/toa-io/toa/issues/1070)

### Bug Fixes

* **bindings.amqp:** a lost connection is restored again, with comq 0.16.1 ([9002d21](https://github.com/toa-io/toa/commit/9002d2195306decad9ad02c15f195d89df570f57))
* **core:** a connection that crosses a teardown is taken down with it ([1e44f0d](https://github.com/toa-io/toa/commit/1e44f0dddbf90ed7ad5c2086ce6fe30aa7317c90))

### BREAKING CHANGES

* a component that read `process.env.TOA_*` reads `context` instead;
  `echo(input)` no longer substitutes from the environment; a bash operation sees no
  `TOA_*`; images no longer set `USER node` — see migrations/289.md.
* an image built by alpha.289 runs its composition as `node` and
  leaves the deployed environment readable under /proc; rebuild on 290. Nothing in
  a context or a manifest changes.


# [1.0.0-alpha.289](https://github.com/toa-io/toa/compare/v1.0.0-alpha.288...v1.0.0-alpha.289) (2026-09-07)

* A deploy moves only what changed, and a component sees none of the runtime's environment (#1073) ([f38e3db](https://github.com/toa-io/toa/commit/f38e3db533f24db866c57bfa1ef294eff1eaf499)), closes [#1073](https://github.com/toa-io/toa/issues/1073) [#1064](https://github.com/toa-io/toa/issues/1064) [#1066](https://github.com/toa-io/toa/issues/1066) [#1067](https://github.com/toa-io/toa/issues/1067) [#1068](https://github.com/toa-io/toa/issues/1068) [#1069](https://github.com/toa-io/toa/issues/1069) [#1071](https://github.com/toa-io/toa/issues/1071) [#1070](https://github.com/toa-io/toa/issues/1070) [#1072](https://github.com/toa-io/toa/issues/1072)

### BREAKING CHANGES

* a component that read `process.env.TOA_*` reads `context` instead;
  `echo(input)` no longer substitutes from the environment; a bash operation sees no
  `TOA_*`; images no longer set `USER node` — see migrations/289.md.


# [1.0.0-alpha.288](https://github.com/toa-io/toa/compare/v1.0.0-alpha.287...v1.0.0-alpha.288) (2026-09-06)

**Note:** Version bump only for package @toa.io/toa





# [1.0.0-alpha.287](https://github.com/toa-io/toa/compare/v1.0.0-alpha.286...v1.0.0-alpha.287) (2026-09-06)

### Bug Fixes

* **boot:** a discovery belongs to the connection that made it ([48e1c8f](https://github.com/toa-io/toa/commit/48e1c8f668b1853134ae9fb2349c485e6da66c28))
* **cadence:** the scan reads what is owed, and nothing that is done ([581610e](https://github.com/toa-io/toa/commit/581610e87ac54c42491c882d5749ff3307700d35))

### Features

* **mongodb:** a migration says what it is doing ([a917a81](https://github.com/toa-io/toa/commit/a917a81fdc94eb23fd73182c0edf891e6b2df843))

# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.327](https://github.com/toa-io/toa/compare/v1.0.0-alpha.326...v1.0.0-alpha.327) (2026-10-10)

* feat(core)!: name a property inside an object in a query ([aa11074](https://github.com/toa-io/toa/commit/aa110745695a6954a623d95ea7d694c7301fd683))
* feat(core)!: hold what a safe operation calls to reading ([b8bbc8e](https://github.com/toa-io/toa/commit/b8bbc8e33b6d0eea461df448dde7ea85c9d7c382))

### Bug Fixes

* **cli:** type the entity of a request to an effect ([6fa08d4](https://github.com/toa-io/toa/commit/6fa08d4ba407711a1d5fe6ed5921e485741e98f1))

### BREAKING CHANGES

* a value compared with an array of numbers, integers or
  booleans is read as one and refused where it is none, and a sort or a
  projection naming what every object carries is refused.
* an observation or a computation that calls a transition, an
  assignment, an effect or an unmanaged operation, or arms a delay, raises a
  Safety exception on that call. Declare it an effect.


# [1.0.0-alpha.326](https://github.com/toa-io/toa/compare/v1.0.0-alpha.325...v1.0.0-alpha.326) (2026-10-06)

* feat(exposition)!: answer a refusal with its code and its cause ([d1f6a95](https://github.com/toa-io/toa/commit/d1f6a9593712c8b7f1d7e1ab299dbe379a7753c0))
* feat(core)!: deliver an operation's error as its code and its cause ([18d303b](https://github.com/toa-io/toa/commit/18d303b9143930735e4b093345db1dbf37f90052))

### Bug Fixes

* **cli:** keep the declared errors of an operation that declares no output ([f533f78](https://github.com/toa-io/toa/commit/f533f7874172e0b74695e0080caf0dc503842c04))
* **exposition:** give a federated credential written before 1.0.0-alpha.257 its Identity ([ccb7e80](https://github.com/toa-io/toa/commit/ccb7e8041bc6ad489bcafb48b295f53edeb2a27a))

### Features

* **core:** parse criteria with [@toa](https://github.com/toa).io/rsql ([c4dc9f4](https://github.com/toa-io/toa/commit/c4dc9f41ca2719ac66607c5b14e9ead678baa740))

### BREAKING CHANGES

* a 422 body is `{ code, cause }`, the errors of the identity and octets
  components carry no text, and an octets upload, a JSON-RPC call and an MCP tool call
  answer a refusal with its code.
* an error returned with a `code` field and no message is an exception,
  and a property of an error other than `cause` no longer reaches the caller.


# [1.0.0-alpha.325](https://github.com/toa-io/toa/compare/v1.0.0-alpha.324...v1.0.0-alpha.325) (2026-10-02)

### Features

* **exposition:** route events to a literal realtime key ([d6c4feb](https://github.com/toa-io/toa/commit/d6c4feb448dfdad6235edbc36991c57f7adfa58f))


# [1.0.0-alpha.324](https://github.com/toa-io/toa/compare/v1.0.0-alpha.323...v1.0.0-alpha.324) (2026-10-02)

### Bug Fixes

* **ui:** take devalue 5.9.4, out of a high-severity advisory ([af58da5](https://github.com/toa-io/toa/commit/af58da58663da45684ebd597b0547ad0a9b33e98)), closes [high-severity](https://github.com/hi/issues/severity)

### Features

* **exposition:** show an MCP server by the icons of its web manifest ([4c841a2](https://github.com/toa-io/toa/commit/4c841a249813f20e43b8660c8fbf8a1c70d18168))


# [1.0.0-alpha.323](https://github.com/toa-io/toa/compare/v1.0.0-alpha.322...v1.0.0-alpha.323) (2026-10-01)

**Note:** Version bump only for package @toa.io/extensions.exposition





# [1.0.0-alpha.322](https://github.com/toa-io/toa/compare/v1.0.0-alpha.321...v1.0.0-alpha.322) (2026-09-29)

### Bug Fixes

* **exposition:** publish what is announced and decided only under TOA_DEV ([632c6b4](https://github.com/toa-io/toa/commit/632c6b404d5738f6404f2930274dc9f58ae49daf))

### Features

* **cli:** write the State a transition receives into the types ([0c8d0f7](https://github.com/toa-io/toa/commit/0c8d0f7a802df1f01ed16f120f75b5d791e5c8b4))


# [1.0.0-alpha.321](https://github.com/toa-io/toa/compare/v1.0.0-alpha.320...v1.0.0-alpha.321) (2026-09-28)

### Features

* **exposition:** export and import what realtime writes to the streams ([ccceb81](https://github.com/toa-io/toa/commit/ccceb81d0e61d6f604078ba338fa59eddbb72f5e))


# [1.0.0-alpha.320](https://github.com/toa-io/toa/compare/v1.0.0-alpha.319...v1.0.0-alpha.320) (2026-09-28)

### Features

* page a stream by CREATED, and stop it after its first page ([038dc52](https://github.com/toa-io/toa/commit/038dc52f2db1a4dd58c6ec58a00de8914b3d38a3))


# [1.0.0-alpha.319](https://github.com/toa-io/toa/compare/v1.0.0-alpha.318...v1.0.0-alpha.319) (2026-09-27)

### Bug Fixes

* **exposition:** make an OTP username resolve to one identity ([2fc8ad8](https://github.com/toa-io/toa/commit/2fc8ad81193296ffffbddb25a25de90c994bed89))
* **exposition:** offer the MCP host on the discovery page ([dd50083](https://github.com/toa-io/toa/commit/dd500830b72ec8d06f2a65a08b6ae8b5178049aa))

### Features

* **exposition:** expose exposition and retry-after cross-origin ([8f0fd11](https://github.com/toa-io/toa/commit/8f0fd11ab6cb3198be648f1fffaeb2a336f6ab1b))
* **exposition:** let a page on another origin read a halted gateway's 503 ([d986af9](https://github.com/toa-io/toa/commit/d986af91fef4eafedd4529efcbc8378c741f0c6b))
* **exposition:** page a stream by limit and continue it from a token ([d012757](https://github.com/toa-io/toa/commit/d0127576489d838a261c4448989b0c799c499f26))

### Performance Improvements

* carry the values of a stream to the gateway as the bytes it writes ([56ab3c5](https://github.com/toa-io/toa/commit/56ab3c5f50c65f55cde11733c8ac667a768b31ec))


# [1.0.0-alpha.318](https://github.com/toa-io/toa/compare/v1.0.0-alpha.317...v1.0.0-alpha.318) (2026-09-23)

**Note:** Version bump only for package @toa.io/extensions.exposition





# [1.0.0-alpha.317](https://github.com/toa-io/toa/compare/v1.0.0-alpha.316...v1.0.0-alpha.317) (2026-09-23)

**Note:** Version bump only for package @toa.io/extensions.exposition





# [1.0.0-alpha.316](https://github.com/toa-io/toa/compare/v1.0.0-alpha.315...v1.0.0-alpha.316) (2026-09-23)

**Note:** Version bump only for package @toa.io/extensions.exposition





# [1.0.0-alpha.315](https://github.com/toa-io/toa/compare/v1.0.0-alpha.314...v1.0.0-alpha.315) (2026-09-23)

* feat(core)!: refuse a timeout or a signal on an ordinary call ([600b392](https://github.com/toa-io/toa/commit/600b392abfd8b24df1a151c26fb31a6f0c7ccd41))

### Bug Fixes

* **exposition:** expose a branch whose newer tenant has expired ([2925589](https://github.com/toa-io/toa/commit/292558917382c865c9c9fd8d67ef49363d39b5b9))
* **ui:** leave every system property out of a schema read as a shape ([f8c2e60](https://github.com/toa-io/toa/commit/f8c2e6091eb08213637043ffb1b29f7edf5c3323))

### Features

* **exposition:** serve MCP on a host of its own ([f861b91](https://github.com/toa-io/toa/commit/f861b91d9fac0c6f12d374c2a4a144a2e07880a9))

### BREAKING CHANGES

* a call to a stateless operation that names a `timeout` or a
  `signal` is refused, where it used to be abandoned at its deadline.


# [1.0.0-alpha.314](https://github.com/toa-io/toa/compare/v1.0.0-alpha.313...v1.0.0-alpha.314) (2026-09-19)

### Bug Fixes

* authenticate runtime UIs against identity resources ([e1bb414](https://github.com/toa-io/toa/commit/e1bb414fa0cf010afba3193df79ea1f52c5987c1))

### Features

* **configuration:** reset a configuration to its deployed defaults ([0ca8c24](https://github.com/toa-io/toa/commit/0ca8c24c521d8de624dad9f468196f9e537f4783))
* **configuration:** tell a created configuration from the defaults ([f83a532](https://github.com/toa-io/toa/commit/f83a5327855e90fa9ba6327c923bbec3d77b5d27))
* **core:** a reference may name a declaration its package claims ([8040f60](https://github.com/toa-io/toa/commit/8040f60976549ab90497675bb54e664261f5b6bb))


# [1.0.0-alpha.313](https://github.com/toa-io/toa/compare/v1.0.0-alpha.312...v1.0.0-alpha.313) (2026-09-18)

### Bug Fixes

* **exposition:** declare the identity packages at the versions Toa declares ([6ffbe25](https://github.com/toa-io/toa/commit/6ffbe25fbad456c874b88f9e2385d2afed64c92a))


# [1.0.0-alpha.312](https://github.com/toa-io/toa/compare/v1.0.0-alpha.311...v1.0.0-alpha.312) (2026-09-18)

### Bug Fixes

* **exposition:** refuse a body past the limit with the status alone ([0fd5c57](https://github.com/toa-io/toa/commit/0fd5c57d2cff15103981916c53708975c5dc95fb))
* **exposition:** resolve every accept against what a route produces, and say why a refusal refused ([0e5cab9](https://github.com/toa-io/toa/commit/0e5cab9b2ae832c2d8d8d23359de31ed8a02614e))

### Features

* **exposition:** answer a component that cannot be reached with 503 ([dff650f](https://github.com/toa-io/toa/commit/dff650f03deda291466f8b08d266f3cac113f709))
* **exposition:** hand a request body to an operation as the stream it takes ([8c9061d](https://github.com/toa-io/toa/commit/8c9061dff624e9cab26bb0e1f6732304f1f36493))


# [1.0.0-alpha.311](https://github.com/toa-io/toa/compare/v1.0.0-alpha.310...v1.0.0-alpha.311) (2026-09-17)

### Bug Fixes

* **exposition:** resolve cache-control apart for anonymous and authenticated requests ([cee1ae5](https://github.com/toa-io/toa/commit/cee1ae5c6b660a235f36aca0fe81841cc4a1b509))

### Performance Improvements

* **exposition:** answer a request without the closures and promises of a chain ([e4ba55d](https://github.com/toa-io/toa/commit/e4ba55dbf827699229ca0142fb766d5cc5f1a20a))
* **exposition:** await an interceptor, a directive stage and a transform only where it is pending ([ffa3dee](https://github.com/toa-io/toa/commit/ffa3deec8c2d893bf7815b2d9f2f2993f77b4e28))
* **exposition:** make no headers and no promises a request without them does not need ([5d6cb93](https://github.com/toa-io/toa/commit/5d6cb93d822af396895407b291f9b4c68af11337))
* **exposition:** match a route and read a query without building what is not read ([299bbf2](https://github.com/toa-io/toa/commit/299bbf2be1293dad25ef73e6fb2344624b46c019))


# [1.0.0-alpha.310](https://github.com/toa-io/toa/compare/v1.0.0-alpha.309...v1.0.0-alpha.310) (2026-09-16)

### Bug Fixes

* **exposition:** end a multipart reply whose body fails with FIN ([672d60f](https://github.com/toa-io/toa/commit/672d60f5d48612a2b1e21a3a2409e4c5e31b1557))

### Features

* answer discovery on one queue a process holds ([3c5bb14](https://github.com/toa-io/toa/commit/3c5bb14184d80f0eddf18b763d3d3987256a238b))


# [1.0.0-alpha.309](https://github.com/toa-io/toa/compare/v1.0.0-alpha.308...v1.0.0-alpha.309) (2026-09-16)

### Bug Fixes

* **exposition:** destroy a reply stream the client left before it was written ([69351e5](https://github.com/toa-io/toa/commit/69351e553011c1e2e186dcf9dd8c3cb43cae9f16))


# [1.0.0-alpha.308](https://github.com/toa-io/toa/compare/v1.0.0-alpha.307...v1.0.0-alpha.308) (2026-09-15)

### Bug Fixes

* **exposition:** locate what a route reaches when the route is called ([9d7075a](https://github.com/toa-io/toa/commit/9d7075a235b0f9a75607055fec64c3d964349a8a))


# [1.0.0-alpha.307](https://github.com/toa-io/toa/compare/v1.0.0-alpha.306...v1.0.0-alpha.307) (2026-09-15)

**Note:** Version bump only for package @toa.io/extensions.exposition





# [1.0.0-alpha.306](https://github.com/toa-io/toa/compare/v1.0.0-alpha.305...v1.0.0-alpha.306) (2026-09-14)

* refactor(core)!: name the quiesce hooks pause and unpause ([6e4e5f5](https://github.com/toa-io/toa/commit/6e4e5f55d43f03ea95ca8bbdaae57b949564dfa2))
* feat(boot)!: a process can be halted and come back ([7196fa5](https://github.com/toa-io/toa/commit/7196fa51a9c882e84c3767a4fdd329fd2df319f5))

### Bug Fixes

* **exposition:** expose a component whose contract changed but whose routes did not ([6b9130b](https://github.com/toa-io/toa/commit/6b9130b5d910b95b898347595104799190e290af))

### Features

* **exposition:** answer 503 while the process is quiet ([4ab8c08](https://github.com/toa-io/toa/commit/4ab8c08bcdc7dbbb94f841f97e44e20cf6a3f766))

### BREAKING CHANGES

* `Host.halt` is `Host.stop`.
* `Host` gains `gate` and `halt`, and `Factory.service` may answer a gate. An
  extension that gates nothing keeps its connections through a halt.


# [1.0.0-alpha.305](https://github.com/toa-io/toa/compare/v1.0.0-alpha.304...v1.0.0-alpha.305) (2026-09-13)

### Features

* **exposition:** say that a safe method only reads, and let a route say otherwise ([a72227a](https://github.com/toa-io/toa/commit/a72227a63ba3f49e234aa984d70c53d5d6ef792d))
* **telemetry:** export log records to an OTLP endpoint ([aa7741d](https://github.com/toa-io/toa/commit/aa7741d3d1f813ac5c65b5b91d0bcf094cbe0973))


# [1.0.0-alpha.304](https://github.com/toa-io/toa/compare/v1.0.0-alpha.303...v1.0.0-alpha.304) (2026-09-13)

### Bug Fixes

* **core:** recognise an encoded reply whichever copy of the package made it ([643f048](https://github.com/toa-io/toa/commit/643f048784f7dc04db57194a2c64ebc148234951))

### Performance Improvements

* **exposition:** build the tools a tree publishes once per tree ([a010ad8](https://github.com/toa-io/toa/commit/a010ad890aaf32663b3ada05d07a68f477a83deb))
* **exposition:** describe a method once, for every caller ([8362512](https://github.com/toa-io/toa/commit/8362512b372392c2598a95f4b8ef5903ce24c31b))
* **exposition:** skip a directive's span where the trace is not sampled ([2ca585e](https://github.com/toa-io/toa/commit/2ca585ef0d3f58560712321102ab98382d054af0))
* **exposition:** write an answered status onto the request's own labels ([7ead1b8](https://github.com/toa-io/toa/commit/7ead1b8d02c868ef64f7bf53d25f144f2da114db))


# [1.0.0-alpha.303](https://github.com/toa-io/toa/compare/v1.0.0-alpha.302...v1.0.0-alpha.303) (2026-09-12)

### Bug Fixes

* **exposition:** state that flow:compose reads the reply it composes ([08e561d](https://github.com/toa-io/toa/commit/08e561da42080b3aa395c647bcabf3136d3e0486))
* **telemetry:** narrow an instrument where the suite reads one ([5809aaf](https://github.com/toa-io/toa/commit/5809aaf6890fb555d9f376c73e9200dd77bfc710))

### Features

* **core:** carry an output encoded for a caller that reads bytes ([38fdb32](https://github.com/toa-io/toa/commit/38fdb3234dee1ad83f755379f39eeab5708a29d1))
* **core:** measure operations and calls ([0d98e48](https://github.com/toa-io/toa/commit/0d98e480f38058ac0466de8b150951abe0254f2a))
* **exposition:** ask an operation for what io:output admits ([6c07c75](https://github.com/toa-io/toa/commit/6c07c7595a71a55e0110e63b3d8e121d8e1ce4b0))
* **exposition:** measure requests by route rather than by URL ([3da0c2b](https://github.com/toa-io/toa/commit/3da0c2b9ed3563edee2b754d8c420a93a5f20a67))
* **exposition:** send the projection a route declares with its call ([edc2e93](https://github.com/toa-io/toa/commit/edc2e930761d32a599e2486991f961385e8f9219))
* **metrics:** count what no span reaches ([efabf89](https://github.com/toa-io/toa/commit/efabf89e78f98a604bb939f476a937fc9ee106b3))
* **observability:** post metrics to the local Prometheus ([e0c702e](https://github.com/toa-io/toa/commit/e0c702e989f062fb79146fcdab634d1c59f9ed75))
* **telemetry:** configure metrics from the context annotation ([7eaaa94](https://github.com/toa-io/toa/commit/7eaaa9415e77a4a02802994d16d44754c4f41694))

### Performance Improvements

* **exposition:** abort a request's controller only when its reply is unfinished ([10194f1](https://github.com/toa-io/toa/commit/10194f1abdaa32e8f7d425a18893685a5441189c))
* **exposition:** tag a reply a client may keep ([1bc0d97](https://github.com/toa-io/toa/commit/1bc0d9756e61c562aa4252f26f1ced903267c846))
* **exposition:** write a component's bytes and tag a reply by its body ([90b3bba](https://github.com/toa-io/toa/commit/90b3bbac5e2bc08085b27abfc4c2ebdcc349d516))
* **identity.tokens:** import jose once ([6772753](https://github.com/toa-io/toa/commit/67727530a47873a99f97d26769cb202b795b4414))
* **identity.tokens:** open a token with node:crypto ([1f72eaa](https://github.com/toa-io/toa/commit/1f72eaa9d977b8616467ea4939cef48c139a04ba))


# [1.0.0-alpha.302](https://github.com/toa-io/toa/compare/v1.0.0-alpha.301...v1.0.0-alpha.302) (2026-09-11)

### Bug Fixes

* **exposition:** a stream the client closes is not logged as an error ([ba41535](https://github.com/toa-io/toa/commit/ba415358baa36d400e4748732d4ddb3d0c59f673))


# [1.0.0-alpha.301](https://github.com/toa-io/toa/compare/v1.0.0-alpha.300...v1.0.0-alpha.301) (2026-09-11)

### Features

* **exposition:** a request whose header holds a censored value is answered 451 ([04f275a](https://github.com/toa-io/toa/commit/04f275a641f37d2519d7ef209f4e0d0b2b5421bd))

### Reverts

* **ui:** the shadcn component indexes are as the generator writes them ([e02f03e](https://github.com/toa-io/toa/commit/e02f03e29d0565be83a936bfd21c24b49206e63f))


# [1.0.0-alpha.300](https://github.com/toa-io/toa/compare/v1.0.0-alpha.299...v1.0.0-alpha.300) (2026-09-11)

### Bug Fixes

* **exposition:** a null reply is 404 again ([a01d403](https://github.com/toa-io/toa/commit/a01d4032bc29ffa70f310a1d006bb67e2d4d1c58))
* **exposition:** a route that maps only the instance keeps an input of none ([3cde80c](https://github.com/toa-io/toa/commit/3cde80c3f1c669a7959508ecfeb1cc7ef59c7ace))

### Features

* **exposition:** a client's idempotency key is what the call is ([3092028](https://github.com/toa-io/toa/commit/3092028df2803183c7e0ab08a7e89de25b36151b))
* **exposition:** a route may name the process a stateful operation is called on ([f66d085](https://github.com/toa-io/toa/commit/f66d085c8cf1a646685bc9a3ca2ee0f7e0211bfa))
* **exposition:** discovery lists status codes, and a null reply is Gone ([b928f28](https://github.com/toa-io/toa/commit/b928f28c6a72028cd76614ac937cd35c7d385c62))


# [1.0.0-alpha.299](https://github.com/toa-io/toa/compare/v1.0.0-alpha.298...v1.0.0-alpha.299) (2026-09-10)

### Bug Fixes

* **exposition:** a stop leaves no stream running ([2816c1b](https://github.com/toa-io/toa/commit/2816c1b107b8774cf64f5c35f0008b32eaa92a69))

### Features

* **core:** a record carries the region that wrote it ([13ed187](https://github.com/toa-io/toa/commit/13ed187604f06dec66feec2e26ccf9dae30bb048))
* **core:** every system property is required ([52c468a](https://github.com/toa-io/toa/commit/52c468aacb03d0347a0e044f6bd76677bdd6af36))


# [1.0.0-alpha.298](https://github.com/toa-io/toa/compare/v1.0.0-alpha.297...v1.0.0-alpha.298) (2026-09-08)

### Bug Fixes

* **ui:** system fonts, and the discovery signature follows the list ([81abb0f](https://github.com/toa-io/toa/commit/81abb0f347383793ce9cfc34ff25e0f98c223a11))


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

**Note:** Version bump only for package @toa.io/extensions.exposition





# [1.0.0-alpha.294](https://github.com/toa-io/toa/compare/v1.0.0-alpha.293...v1.0.0-alpha.294) (2026-09-07)

**Note:** Version bump only for package @toa.io/extensions.exposition





# [1.0.0-alpha.293](https://github.com/toa-io/toa/compare/v1.0.0-alpha.292...v1.0.0-alpha.293) (2026-09-07)

### Bug Fixes

* **exposition:** identity.tokens declares the jose it now imports ([dafd811](https://github.com/toa-io/toa/commit/dafd81123a65111332f38e8e11d75c3af8e0450f))

### Features

* **exposition:** a queryable method states what picks the records ([a3a047e](https://github.com/toa-io/toa/commit/a3a047ead018aac494b4da6c9df722ed94c9acd8))
* **exposition:** discovery carries guides for authentication and multipart responses ([cd82e1d](https://github.com/toa-io/toa/commit/cd82e1d9049b62298f823788185570e35ab0a536))


# [1.0.0-alpha.292](https://github.com/toa-io/toa/compare/v1.0.0-alpha.291...v1.0.0-alpha.292) (2026-09-07)

### Features

* **definitions:** what a package declares is read from one package ([7052341](https://github.com/toa-io/toa/commit/70523411b5d9e2b204c999aa02365173f3bb518d))


# [1.0.0-alpha.291](https://github.com/toa-io/toa/compare/v1.0.0-alpha.290...v1.0.0-alpha.291) (2026-09-07)

**Note:** Version bump only for package @toa.io/extensions.exposition





# [1.0.0-alpha.289](https://github.com/toa-io/toa/compare/v1.0.0-alpha.288...v1.0.0-alpha.289) (2026-09-07)

* A deploy moves only what changed, and a component sees none of the runtime's environment (#1073) ([f38e3db](https://github.com/toa-io/toa/commit/f38e3db533f24db866c57bfa1ef294eff1eaf499)), closes [#1073](https://github.com/toa-io/toa/issues/1073) [#1064](https://github.com/toa-io/toa/issues/1064) [#1066](https://github.com/toa-io/toa/issues/1066) [#1067](https://github.com/toa-io/toa/issues/1067) [#1068](https://github.com/toa-io/toa/issues/1068) [#1069](https://github.com/toa-io/toa/issues/1069) [#1071](https://github.com/toa-io/toa/issues/1071) [#1070](https://github.com/toa-io/toa/issues/1070) [#1072](https://github.com/toa-io/toa/issues/1072)

### BREAKING CHANGES

* a component that read `process.env.TOA_*` reads `context` instead;
  `echo(input)` no longer substitutes from the environment; a bash operation sees no
  `TOA_*`; images no longer set `USER node` — see migrations/289.md.


# [1.0.0-alpha.288](https://github.com/toa-io/toa/compare/v1.0.0-alpha.287...v1.0.0-alpha.288) (2026-09-06)

**Note:** Version bump only for package @toa.io/extensions.exposition





# [1.0.0-alpha.287](https://github.com/toa-io/toa/compare/v1.0.0-alpha.286...v1.0.0-alpha.287) (2026-09-06)

**Note:** Version bump only for package @toa.io/extensions.exposition

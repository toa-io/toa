# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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

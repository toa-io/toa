# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.318](https://github.com/toa-io/toa/compare/v1.0.0-alpha.317...v1.0.0-alpha.318) (2026-09-23)

**Note:** Version bump only for package @toa.io/definitions





# [1.0.0-alpha.317](https://github.com/toa-io/toa/compare/v1.0.0-alpha.316...v1.0.0-alpha.317) (2026-09-23)

**Note:** Version bump only for package @toa.io/definitions





# [1.0.0-alpha.316](https://github.com/toa-io/toa/compare/v1.0.0-alpha.315...v1.0.0-alpha.316) (2026-09-23)

**Note:** Version bump only for package @toa.io/definitions





# [1.0.0-alpha.315](https://github.com/toa-io/toa/compare/v1.0.0-alpha.314...v1.0.0-alpha.315) (2026-09-23)

* feat(map)!: leave out of a contract what the runtime gives every component ([b81837a](https://github.com/toa-io/toa/commit/b81837a3bc4771d7ee1c10fe613c9a1d7501bf1a))

### Bug Fixes

* **map:** name a map mounted from a checkout for what it is ([e274a21](https://github.com/toa-io/toa/commit/e274a218875963bc7df26ea112c580bdab83531a))

### Features

* **cadence:** make a pulse declared `scope: replica` fire in every replica ([405a319](https://github.com/toa-io/toa/commit/405a319c3dc89889e6dac28ce3894bf59ea7836b))
* **exposition:** serve MCP on a host of its own ([f861b91](https://github.com/toa-io/toa/commit/f861b91d9fac0c6f12d374c2a4a144a2e07880a9))

### BREAKING CHANGES

* the deployed component map is `/etc/toa/.map.json.gz`.


# [1.0.0-alpha.314](https://github.com/toa-io/toa/compare/v1.0.0-alpha.313...v1.0.0-alpha.314) (2026-09-19)

### Features

* **core:** a destination renders the component's events ([2f93b28](https://github.com/toa-io/toa/commit/2f93b28bed61a0afe99cb8cfa646ed7815467497))
* **core:** a reference may name a declaration its package claims ([8040f60](https://github.com/toa-io/toa/commit/8040f60976549ab90497675bb54e664261f5b6bb))
* **realtime:** route events by dynamic routes ([37d136d](https://github.com/toa-io/toa/commit/37d136dd9883192c17118b797e4619a3b2b305f7))


# [1.0.0-alpha.313](https://github.com/toa-io/toa/compare/v1.0.0-alpha.312...v1.0.0-alpha.313) (2026-09-18)

**Note:** Version bump only for package @toa.io/definitions





# [1.0.0-alpha.312](https://github.com/toa-io/toa/compare/v1.0.0-alpha.311...v1.0.0-alpha.312) (2026-09-18)

### Features

* **bindings.http:** carry a call that holds a stream ([c571793](https://github.com/toa-io/toa/commit/c571793b617e3d5ae1dce5b98b64d67d7d8224f6))
* **boot:** offer a streamed endpoint to the bindings that carry a stream ([0099b4e](https://github.com/toa-io/toa/commit/0099b4e12bff4ce5dba2d0098f0b8c6a18fff2c5))
* **configuration:** give a deployed component the revision of its defaults ([6a54fc6](https://github.com/toa-io/toa/commit/6a54fc6f0f640f79316c383aa8448a7f28a79276))
* **exposition:** refuse a route that maps a stream onto an operation that takes none ([e679fba](https://github.com/toa-io/toa/commit/e679fbacff289791d5b909bcc0e6c9b806fd52be))


# [1.0.0-alpha.311](https://github.com/toa-io/toa/compare/v1.0.0-alpha.310...v1.0.0-alpha.311) (2026-09-17)

**Note:** Version bump only for package @toa.io/definitions





# [1.0.0-alpha.310](https://github.com/toa-io/toa/compare/v1.0.0-alpha.309...v1.0.0-alpha.310) (2026-09-16)

**Note:** Version bump only for package @toa.io/definitions





# [1.0.0-alpha.309](https://github.com/toa-io/toa/compare/v1.0.0-alpha.308...v1.0.0-alpha.309) (2026-09-16)

**Note:** Version bump only for package @toa.io/definitions





# [1.0.0-alpha.308](https://github.com/toa-io/toa/compare/v1.0.0-alpha.307...v1.0.0-alpha.308) (2026-09-15)

**Note:** Version bump only for package @toa.io/definitions





# [1.0.0-alpha.307](https://github.com/toa-io/toa/compare/v1.0.0-alpha.306...v1.0.0-alpha.307) (2026-09-15)

### Bug Fixes

* **introspection:** host the components the deployment provisioned ([b36d80b](https://github.com/toa-io/toa/commit/b36d80b154e40275c610b021cfb2c9628cac7cab))


# [1.0.0-alpha.306](https://github.com/toa-io/toa/compare/v1.0.0-alpha.305...v1.0.0-alpha.306) (2026-09-14)

* feat(introspection)!: remove payload samples ([934db2a](https://github.com/toa-io/toa/commit/934db2a2f617833cae37501c6ea8957f3d0a4c7d))

### Features

* **definitions:** refuse a component that is off the map where halts are on ([80b5a63](https://github.com/toa-io/toa/commit/80b5a63af971a6462cb14db89364f1904e22c887))
* **introspection:** a signal stops every process of a deployment ([bfeda01](https://github.com/toa-io/toa/commit/bfeda01133e0388ad577203f3d00ea87861646f9))
* **introspection:** let a deployment say what a halt may ask for ([a40d3ed](https://github.com/toa-io/toa/commit/a40d3ed6a07772be5bb747882cf1f4753b384b24))
* **introspection:** stop a deployment only once it has been seen still ([268db9b](https://github.com/toa-io/toa/commit/268db9b5a9f95716d6fc50c384d3fa101e21ce57))

### BREAKING CHANGES

* `introspection.samples` is read by nothing, in a context and in a manifest
  alike, and an edge carries no `sample`.


# [1.0.0-alpha.305](https://github.com/toa-io/toa/compare/v1.0.0-alpha.304...v1.0.0-alpha.305) (2026-09-13)

### Features

* **telemetry:** export log records to an OTLP endpoint ([aa7741d](https://github.com/toa-io/toa/commit/aa7741d3d1f813ac5c65b5b91d0bcf094cbe0973))


# [1.0.0-alpha.304](https://github.com/toa-io/toa/compare/v1.0.0-alpha.303...v1.0.0-alpha.304) (2026-09-13)

**Note:** Version bump only for package @toa.io/definitions





# [1.0.0-alpha.303](https://github.com/toa-io/toa/compare/v1.0.0-alpha.302...v1.0.0-alpha.303) (2026-09-12)

### Features

* **exposition:** send the projection a route declares with its call ([edc2e93](https://github.com/toa-io/toa/commit/edc2e930761d32a599e2486991f961385e8f9219))
* **telemetry:** configure metrics from the context annotation ([7eaaa94](https://github.com/toa-io/toa/commit/7eaaa9415e77a4a02802994d16d44754c4f41694))
* **telemetry:** let a component declare its own metrics ([05aa3c7](https://github.com/toa-io/toa/commit/05aa3c72cd6a160e1cef99df6176a7f627075bc0))


# [1.0.0-alpha.302](https://github.com/toa-io/toa/compare/v1.0.0-alpha.301...v1.0.0-alpha.302) (2026-09-11)

**Note:** Version bump only for package @toa.io/definitions





# [1.0.0-alpha.301](https://github.com/toa-io/toa/compare/v1.0.0-alpha.300...v1.0.0-alpha.301) (2026-09-11)

### Features

* **exposition:** a request whose header holds a censored value is answered 451 ([04f275a](https://github.com/toa-io/toa/commit/04f275a641f37d2519d7ef209f4e0d0b2b5421bd))
* **operations:** an evicted component is given its environment and configuration ([6cf7890](https://github.com/toa-io/toa/commit/6cf7890a632a2185d2b7d9790890a04187e5a897))


# [1.0.0-alpha.300](https://github.com/toa-io/toa/compare/v1.0.0-alpha.299...v1.0.0-alpha.300) (2026-09-11)

* feat(boot)!: a process is a thing, and an extension may keep something in one ([528d6cd](https://github.com/toa-io/toa/commit/528d6cdd307b45a6c30b6a184d7e06b3328cecf8))

### BREAKING CHANGES

* a composition booted directly has no readiness probe. Readiness is
  the process's, and a composition is not a process. `stage.workload` boots one where a
  suite needs it.


# [1.0.0-alpha.299](https://github.com/toa-io/toa/compare/v1.0.0-alpha.298...v1.0.0-alpha.299) (2026-09-10)

### Features

* **cadence:** a delayed call is made by the chain that asked for it ([0a38ac6](https://github.com/toa-io/toa/commit/0a38ac672516783644e27085e9372bcff6116d1a))
* **cadence:** a deployment makes the calls of the region it is ([60736e5](https://github.com/toa-io/toa/commit/60736e5a56a7f96648c8a3d1ddc1f4c6c8197b5e))
* **cli:** a region's broker topology is exported ([697ca6c](https://github.com/toa-io/toa/commit/697ca6ca08091a79a23c59ffe5ef5d9d462dbb8a))
* **convergence:** deployments of one context converge ([8a70343](https://github.com/toa-io/toa/commit/8a70343cf6953aab58d4a25bac215508ff8d9a37))
* **convergence:** the environment is which region a deployment is ([87f468a](https://github.com/toa-io/toa/commit/87f468af4da386c4c27057e817610768db841ac7))


# [1.0.0-alpha.298](https://github.com/toa-io/toa/compare/v1.0.0-alpha.297...v1.0.0-alpha.298) (2026-09-08)

**Note:** Version bump only for package @toa.io/definitions





# [1.0.0-alpha.297](https://github.com/toa-io/toa/compare/v1.0.0-alpha.296...v1.0.0-alpha.297) (2026-09-08)

**Note:** Version bump only for package @toa.io/definitions





# [1.0.0-alpha.296](https://github.com/toa-io/toa/compare/v1.0.0-alpha.295...v1.0.0-alpha.296) (2026-09-08)

### Bug Fixes

* **exposition:** the gateway's image carries every storage provider ([ab19d25](https://github.com/toa-io/toa/commit/ab19d2567764d5a3148b067f186819d7e646908f))

### Features

* **exposition:** bind OAuth access tokens to the resource they were issued for ([a1728e1](https://github.com/toa-io/toa/commit/a1728e134287c9dd6a710370c1b9abc6d1139a54))


# [1.0.0-alpha.295](https://github.com/toa-io/toa/compare/v1.0.0-alpha.294...v1.0.0-alpha.295) (2026-09-07)

**Note:** Version bump only for package @toa.io/definitions





# [1.0.0-alpha.294](https://github.com/toa-io/toa/compare/v1.0.0-alpha.293...v1.0.0-alpha.294) (2026-09-07)

### Features

* **configuration:** refuse a plain string where the schema declares a secret ([f100057](https://github.com/toa-io/toa/commit/f1000576370c4fb02bac30313097825c159f3a45))


# [1.0.0-alpha.293](https://github.com/toa-io/toa/compare/v1.0.0-alpha.292...v1.0.0-alpha.293) (2026-09-07)

### Bug Fixes

* **exposition:** identity.tokens declares the jose it now imports ([dafd811](https://github.com/toa-io/toa/commit/dafd81123a65111332f38e8e11d75c3af8e0450f))

### Features

* **cli:** `toa npm` installs what a Context's components declare ([97196f0](https://github.com/toa-io/toa/commit/97196f00feb1b422c6f7ac3a4ddcb47a5ba60d71))


# [1.0.0-alpha.292](https://github.com/toa-io/toa/compare/v1.0.0-alpha.291...v1.0.0-alpha.292) (2026-09-07)

### Features

* **cli:** the deployment library is a peer, and the binary is the CLI's ([a923f81](https://github.com/toa-io/toa/commit/a923f8173a55ed1c091213a7c7db1863ca1d0ba6))
* **definitions:** an operation is read from its source ([56ee048](https://github.com/toa-io/toa/commit/56ee0485e7f00fa52bd9de9a4b0c780127b3ee87))
* **definitions:** the version of Toa is the definitions package's ([3d0272e](https://github.com/toa-io/toa/commit/3d0272ea0ab862f4b6c2e58a2f003f92d0f8a87f))
* **definitions:** what a package declares is read from one package ([7052341](https://github.com/toa-io/toa/commit/70523411b5d9e2b204c999aa02365173f3bb518d))

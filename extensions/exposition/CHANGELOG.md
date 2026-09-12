# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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

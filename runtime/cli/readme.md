# Toa Command Line

## Installation

```shell
$ npm install @toa.io/runtime
$ toa -v
```

## Commands

### deploy

<dl>
<dt><code>toa deploy [environment]</code></dt>
<dd>Deploy context.</dd>
</dl>

### configure

<dl>
<dt><code>toa configure &lt;component&gt;</code></dt>
<dd>
Upsert local environment Configuration Object.

<code>--reset</code> clear local Configuration Object<br/>
<code>--export</code> print Configuration Object
</dd>
<dt><code>toa configure &lt;component&gt; &lt;key&gt; &lt;value&gt;
</code></dt>
<dd>Upsert local environment Configuration Object key. Nested keys are 
addressed with dot notation.

```shell
$ toa configure dummies.dummy foo.bar 'new-value'
```

</dd>
</dl>

### conceal

<dl>

<dt><code>toa conceal</code></dt>
<dd>Deploy new secrets.

<code>--reset</code> don't skip already deployed</dd>

<dt><code>toa conceal &lt;key&gt; &lt;value&gt;</code></dt>
<dd>Deploy a secret named <code>key</code> with a given <code>value</code>.</dd>

</dl>



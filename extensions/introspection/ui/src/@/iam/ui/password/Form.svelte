<script lang="ts">
  import { meta } from '@toa.io/origin'
  import { ArrowRight } from '@lucide/svelte'
  import { dict } from '@/iam/ui/intl'
  import * as iam from '@/iam'
  import { Spinner } from '$ui/spinner'
  import { Input } from '$ui/input'
  import { Button } from '$ui/button'
  import { autofocus, onsubmit } from '$lib/tools'
  import { Shake } from '$com/shake'
  import Password from './Password.svelte'
  import type { Props } from './Form'

  const { account, oncreate }: Props = $props()

  let busy = $state(false)
  let username = $state('')
  let password = $state('')
  let otp = $state('')
  let passwordRef = $state<HTMLDivElement | null>(null)
  let mode = $state<'password' | 'otp'>('password')
  let shake: { shake: () => Promise<void> } | undefined = $state()

  async function submit() {
    if (password.length === 0)
      if (mode === 'password') await sendOTP()
      else await verifyOTP()
    else await basic()
  }

  async function basic() {
    busy = true

    const result =
      account === undefined
        ? await verifyPassword()
        : await iam.basic.capture(account.id, { username, password })

    busy = false

    if (result instanceof Error) await fail()
  }

  async function verifyPassword() {
    const echo = await iam.basic.verify(username, password)

    if (echo instanceof Error) return echo

    const response = meta(echo)

    if (response?.status === 201) oncreate?.(echo)

    return echo
  }

  async function sendOTP() {
    busy = true

    const response =
      account === undefined ? await iam.otp.send(username) : await iam.otp.add(account.id, username)

    busy = false

    if (response instanceof Error) return

    mode = 'otp'
    requestAnimationFrame(() => focus())
  }

  async function verifyOTP() {
    if (username.length === 0) {
      console.error('username is required')

      return
    }

    if (otp.length !== 6) {
      await fail()

      return
    }

    busy = true

    const echo = await iam.otp.verify(username, otp)

    busy = false

    if (echo instanceof Error) {
      otp = ''
      await fail()

      return
    }

    const response = meta(echo)

    if (response?.status === 201) oncreate?.(echo)

    return echo
  }

  async function fail() {
    await shake?.shake()
    focus()
  }

  function focus() {
    if (!autofocus) return

    passwordRef?.querySelector('input')?.focus()
  }
</script>

<form onsubmit={onsubmit(submit)}>
  <fieldset class="space-y-2">
    <Input
      id="iam-username-input"
      bind:value={username}
      name="username"
      type="email"
      autocomplete="username"
      required
      disabled={mode === 'otp' ? true : undefined}
      {autofocus}
      placeholder={$dict.auth.email} />
    <div class="space-y-2">
      <div class="flex items-center gap-2">
        <Shake bind:this={shake} class="w-full">
          <Password bind:ref={passwordRef} bind:password bind:otp {mode} />
        </Shake>
        <Button size="icon-lg" type="submit">
          {#if busy}
            <Spinner />
          {:else}
            <ArrowRight />
          {/if}
          <span class="sr-only">{$dict.auth.login}</span>
        </Button>
      </div>
      <div class="text-sm text-muted-foreground px-1">
        {#if mode === 'password'}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html $dict.auth.passwordBlank}
        {:else}
          {$dict.auth.otpInstructions}
        {/if}
      </div>
    </div>
  </fieldset>
</form>

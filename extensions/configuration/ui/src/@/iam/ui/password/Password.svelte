<script lang="ts">
  import { REGEXP_ONLY_DIGITS } from 'bits-ui'
  import { dict } from '@/iam/ui/intl'
  import * as InputOTP from '$ui/input-otp'
  import { Input } from '$ui/input'
  import type { Props } from './Password'

  let {
    ref = $bindable(null),
    mode = $bindable('password'),
    password = $bindable(''),
    otp = $bindable(''),
  }: Props = $props()
</script>

<div bind:this={ref} class="w-full flex items-center">
  {#if mode === 'password'}
    <Input
      id="iam-password-input"
      bind:value={password}
      name="password"
      type="password"
      minlength={6}
      autocomplete="current-password"
      placeholder={$dict.auth.password}
      class="placeholder:text-sm"
    />
  {:else}
    <InputOTP.Root bind:value={otp} maxlength={6} pattern={REGEXP_ONLY_DIGITS} required>
      {#snippet children({ cells })}
        <InputOTP.Group>
          {#each cells.slice(0, 6) as cell, i (i)}
            <InputOTP.Slot {cell} class="size-[40px] bg-background" />
          {/each}
        </InputOTP.Group>
      {/snippet}
    </InputOTP.Root>
  {/if}
</div>

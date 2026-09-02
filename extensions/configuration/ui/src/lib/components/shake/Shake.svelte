<script lang="ts">
  import type { Props } from './Shake'

  const { children, class: classes }: Props = $props()

  let active = $state(false)

  // keep in sync with animation duration below
  const DURATION = 500

  export async function shake() {
    active = true
    await new Promise((resolve) => setTimeout(resolve, DURATION))
    active = false
  }
</script>

<div class={[classes, active && 'shake']}>
  {@render children()}
</div>

<style>
  .shake {
    animation: shake 0.5s ease-in-out;
  }

  @keyframes shake {
    0% {
      transform: translateX(0);
    }
    10% {
      transform: translateX(-12px);
    }
    20% {
      transform: translateX(12px);
    }
    30% {
      transform: translateX(-8px);
    }
    40% {
      transform: translateX(8px);
    }
    50% {
      transform: translateX(-4px);
    }
    60% {
      transform: translateX(4px);
    }
    70% {
      transform: translateX(-2px);
    }
    80% {
      transform: translateX(2px);
    }
    90% {
      transform: translateX(-1px);
    }
    100% {
      transform: translateX(0);
    }
  }
</style>
